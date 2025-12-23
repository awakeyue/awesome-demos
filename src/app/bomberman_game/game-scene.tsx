import { useRef, useState, useEffect, useCallback, useMemo, memo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { CameraView } from "./bomberman-game";
import type { LevelConfig, PowerUpType } from "./game-levels";
import { getPowerUpColor } from "./game-levels";

const CELL_SIZE = 1;
const BASE_PLAYER_SPEED = 2.5;
const BASE_BOMB_TIMER = 3000;
const EXPLOSION_DURATION = 500;
const BASE_EXPLOSION_RANGE = 1;
const MIN_ZOOM_DISTANCE = 5;
const MAX_ZOOM_DISTANCE = 30;
const CAMERA_DEAD_ZONE = 3.5;
const ALIGNMENT_THRESHOLD = 0.15;
const ALIGNMENT_SPEED = 0.08;
const WALL_COLLISION_BUFFER = 0.45;

interface GameSceneProps {
  onGameOver: () => void;
  onVictory: () => void;
  onScoreChange: (score: number) => void;
  levelConfig: LevelConfig;
  cameraView: CameraView;
}

interface PowerUp {
  x: number;
  z: number;
  type: PowerUpType;
  collected: boolean;
}

interface Door {
  x: number;
  z: number;
  active: boolean;
}

function generateMap(
  width: number,
  height: number,
  brickRatio: number,
  powerUpType: PowerUpType | null,
) {
  const map: number[][] = [];
  const brickPositions: Array<{ x: number; z: number }> = [];

  for (let z = 0; z < height; z++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      if (z === 0 || z === height - 1 || x === 0 || x === width - 1) {
        row.push(1);
      } else if (z % 2 === 0 && x % 2 === 0) {
        row.push(1);
      } else if (
        (x <= 2 && z <= 2) ||
        (x >= width - 3 && z <= 2) ||
        (x <= 2 && z >= height - 3) ||
        (x >= width - 3 && z >= height - 3)
      ) {
        row.push(0);
      } else if (Math.random() < brickRatio) {
        row.push(2);
        brickPositions.push({ x, z });
      } else {
        row.push(0);
      }
    }
    map.push(row);
  }

  let powerUp: PowerUp | null = null;
  let door: Door | null = null;

  if (brickPositions.length >= 2) {
    // Shuffle brick positions
    const shuffled = [...brickPositions].sort(() => Math.random() - 0.5);

    // Place door in first brick
    door = { x: shuffled[0].x, z: shuffled[0].z, active: false };

    // Place power-up in second brick if available
    if (powerUpType && shuffled.length > 1) {
      powerUp = {
        x: shuffled[1].x,
        z: shuffled[1].z,
        type: powerUpType,
        collected: false,
      };
    }
  }

  return { map, powerUp, door };
}

function generateMonsterPositions(
  width: number,
  height: number,
  count: number,
) {
  const positions = [
    { x: width - 2, z: 1 },
    { x: width - 2, z: height - 2 },
    { x: 1, z: height - 2 },
    { x: width - 2, z: Math.floor(height / 2) },
    { x: 1, z: Math.floor(height / 2) },
    { x: Math.floor(width / 2), z: 1 },
    { x: Math.floor(width / 2), z: height - 2 },
    { x: Math.floor(width / 2), z: Math.floor(height / 2) },
  ];

  return positions.slice(0, count).map((pos, id) => ({
    id,
    x: pos.x,
    z: pos.z,
    direction: { x: Math.random() > 0.5 ? 1 : -1, z: 0 },
    alive: true,
  }));
}

export const GameScene = memo(function GameScene({
  onGameOver,
  onVictory,
  onScoreChange,
  levelConfig,
  cameraView,
}: GameSceneProps) {
  console.log("Rendering GameScene");
  const {
    map: MAP,
    powerUp: initialPowerUp,
    door: initialDoor,
  } = useMemo(
    () =>
      generateMap(
        levelConfig.mapWidth,
        levelConfig.mapHeight,
        levelConfig.brickRatio,
        levelConfig.powerUp,
      ),
    [levelConfig],
  );

  const initialMonsters = useMemo(
    () =>
      generateMonsterPositions(
        levelConfig.mapWidth,
        levelConfig.mapHeight,
        levelConfig.monsterCount,
      ),
    [levelConfig],
  );

  const playerRef = useRef<THREE.Mesh>(null);
  const playerPosition = useRef({ x: 1, z: 1 });
  // Replace useState with useRef for monsters to reduce re-renders
  const monstersRef = useRef(initialMonsters);
  const [bombs, setBombs] = useState<
    Array<{ id: number; x: number; z: number; timer: number }>
  >([]);
  const [explosions, setExplosions] = useState<
    Array<{
      x: number;
      z: number;
      timestamp: number;
      isCenter?: boolean;
      direction?: string;
    }>
  >([]);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(true);
  const [bricks, setBricks] = useState<Set<string>>(new Set());
  const [powerUp, setPowerUp] = useState<PowerUp | null>(initialPowerUp);
  const [door, setDoor] = useState<Door | null>(initialDoor);
  const [zoomDistance, setZoomDistance] = useState(() => {
    const maxDimension = Math.max(levelConfig.mapWidth, levelConfig.mapHeight);
    return maxDimension * 1.2;
  });

  const [playerStats, setPlayerStats] = useState({
    speed: BASE_PLAYER_SPEED,
    bombRange: BASE_EXPLOSION_RANGE,
    maxBombs: 1,
    bombTimer: BASE_BOMB_TIMER,
  });
  const [activeBombCount, setActiveBombCount] = useState(0);

  const keysPressed = useRef<Set<string>>(new Set());
  const bombIdCounter = useRef(0);
  const spaceKeyPressed = useRef(false);
  const cameraTarget = useRef({
    x: levelConfig.mapWidth / 2 - 0.5,
    z: levelConfig.mapHeight / 2 - 0.5,
  });

  const { camera, viewport } = useThree();
  const currentTimeRef = useRef(0);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * 0.01;
      setZoomDistance((prev) =>
        Math.max(MIN_ZOOM_DISTANCE, Math.min(MAX_ZOOM_DISTANCE, prev + delta)),
      );
    };

    const canvas = document.querySelector("canvas");
    canvas?.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas?.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    const brickSet = new Set<string>();
    MAP.forEach((row, z) => {
      row.forEach((cell, x) => {
        if (cell === 2) {
          brickSet.add(`${x},${z}`);
        }
      });
    });
    setBricks(brickSet);
  }, [MAP]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());

      if (e.key === " " && gameActive && !spaceKeyPressed.current) {
        spaceKeyPressed.current = true;
        const bombX = Math.round(playerPosition.current.x);
        const bombZ = Math.round(playerPosition.current.z);

        const bombExists = bombs.some(
          (b) => Math.round(b.x) === bombX && Math.round(b.z) === bombZ,
        );

        if (!bombExists && activeBombCount < playerStats.maxBombs) {
          setBombs((prev) => [
            ...prev,
            {
              id: bombIdCounter.current++,
              x: bombX,
              z: bombZ,
              timer: Date.now() + playerStats.bombTimer,
            },
          ]);
          setActiveBombCount((prev) => prev + 1);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
      if (e.key === " ") {
        spaceKeyPressed.current = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [bombs, gameActive, activeBombCount, playerStats]);

  const bombPositionsRef = useRef<Set<string>>(new Set());

  const canMove = useCallback(
    (x: number, z: number, isPlayer = true) => {
      const gridX = Math.round(x);
      const gridZ = Math.round(z);

      if (
        gridX < 0 ||
        gridX >= levelConfig.mapWidth ||
        gridZ < 0 ||
        gridZ >= levelConfig.mapHeight
      )
        return false;

      if (MAP[gridZ][gridX] === 1) return false;
      if (bricks.has(`${gridX},${gridZ}`)) return false;

      if (!isPlayer && bombPositionsRef.current.has(`${gridX},${gridZ}`)) {
        return false;
      }

      const checkPositions = [
        { dx: WALL_COLLISION_BUFFER, dz: WALL_COLLISION_BUFFER },
        { dx: -WALL_COLLISION_BUFFER, dz: WALL_COLLISION_BUFFER },
        { dx: WALL_COLLISION_BUFFER, dz: -WALL_COLLISION_BUFFER },
        { dx: -WALL_COLLISION_BUFFER, dz: -WALL_COLLISION_BUFFER },
      ];

      for (const pos of checkPositions) {
        const checkX = Math.round(x + pos.dx);
        const checkZ = Math.round(z + pos.dz);
        if (
          checkX >= 0 &&
          checkX < levelConfig.mapWidth &&
          checkZ >= 0 &&
          checkZ < levelConfig.mapHeight
        ) {
          if (MAP[checkZ][checkX] === 1 || bricks.has(`${checkX},${checkZ}`)) {
            return false;
          }
        }
      }

      return true;
    },
    [MAP, bricks, levelConfig.mapWidth, levelConfig.mapHeight],
  );

  const hasLineOfSight = (
    fromX: number,
    fromZ: number,
    toX: number,
    toZ: number,
  ): boolean => {
    const dx = toX - fromX;
    const dz = toZ - fromZ;
    const distance = Math.sqrt(dx * dx + dz * dz);
    const steps = Math.ceil(distance * 2);

    for (let i = 1; i < steps; i++) {
      const checkX = Math.round(fromX + (dx * i) / steps);
      const checkZ = Math.round(fromZ + (dz * i) / steps);

      if (
        checkX < 0 ||
        checkX >= levelConfig.mapWidth ||
        checkZ < 0 ||
        checkZ >= levelConfig.mapHeight
      ) {
        return false;
      }

      if (MAP[checkZ][checkX] === 1 || bricks.has(`${checkX},${checkZ}`)) {
        return false;
      }
    }

    return true;
  };

  const getMapFitInfo = () => {
    const mapWorldWidth = levelConfig.mapWidth * CELL_SIZE;
    const mapWorldHeight = levelConfig.mapHeight * CELL_SIZE;
    const fov = (camera as any).fov || 75;
    const aspect = viewport.width / viewport.height;

    if (cameraView === "top") {
      const cameraHeight = zoomDistance;
      const verticalSize = 2 * cameraHeight * Math.tan((fov * Math.PI) / 360);
      const horizontalSize = verticalSize * aspect;

      const fitsInView =
        horizontalSize >= mapWorldWidth && verticalSize >= mapWorldHeight;

      return {
        fitsInView,
        mapCenter: {
          x: levelConfig.mapWidth / 2 - 0.5,
          z: levelConfig.mapHeight / 2 - 0.5,
        },
        visibleWidth: horizontalSize,
        visibleHeight: verticalSize,
      };
    } else {
      const cameraHeight = zoomDistance * 0.8;
      const angle = Math.atan2(cameraHeight, zoomDistance * 0.8);
      const effectiveDistance = Math.sqrt(
        cameraHeight * cameraHeight + zoomDistance * 0.8 * (zoomDistance * 0.8),
      );

      const verticalSize =
        2 * effectiveDistance * Math.tan((fov * Math.PI) / 360);
      const horizontalSize = verticalSize * aspect;

      const adjustedVertical = verticalSize * Math.cos(angle);

      const fitsInView =
        horizontalSize >= mapWorldWidth && adjustedVertical >= mapWorldHeight;

      return {
        fitsInView,
        mapCenter: {
          x: levelConfig.mapWidth / 2 - 0.5,
          z: levelConfig.mapHeight / 2 - 0.5,
        },
        visibleWidth: horizontalSize,
        visibleHeight: adjustedVertical,
      };
    }
  };

  const wallGeometry = useMemo(
    () => new THREE.BoxGeometry(CELL_SIZE, 1, CELL_SIZE, 2, 2, 2),
    [],
  );
  const brickGeometry = useMemo(
    () =>
      new THREE.BoxGeometry(
        CELL_SIZE * 0.95,
        CELL_SIZE * 0.8,
        CELL_SIZE * 0.95,
        2,
        2,
        2,
      ),
    [],
  );
  const playerGeometry = useMemo(
    () => new THREE.BoxGeometry(0.7, 0.7, 0.7, 2, 2, 2),
    [],
  );
  const monsterGeometry = useMemo(
    () => new THREE.BoxGeometry(0.7, 0.7, 0.7, 2, 2, 2),
    [],
  );

  const wallMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#64748b",
        metalness: 0.4,
        roughness: 0.6,
      }),
    [],
  );
  const brickMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#b45309",
        roughness: 0.9,
        metalness: 0.1,
      }),
    [],
  );

  const [canWalkThroughBombs, setCanWalkThroughBombs] = useState(false);

  useFrame((state, delta) => {
    if (!gameActive) return;

    const now = Date.now();
    currentTimeRef.current = now;

    bombPositionsRef.current = new Set(
      bombs.map((b) => `${Math.round(b.x)},${Math.round(b.z)}`),
    );

    const fitInfo = getMapFitInfo();

    if (fitInfo.fitsInView) {
      cameraTarget.current = { x: fitInfo.mapCenter.x, z: fitInfo.mapCenter.z };
    } else {
      const deltaX = playerPosition.current.x - cameraTarget.current.x;
      const deltaZ = playerPosition.current.z - cameraTarget.current.z;

      if (Math.abs(deltaX) > CAMERA_DEAD_ZONE) {
        const moveX =
          deltaX > 0 ? deltaX - CAMERA_DEAD_ZONE : deltaX + CAMERA_DEAD_ZONE;
        cameraTarget.current.x += moveX * 0.1;
      }

      if (Math.abs(deltaZ) > CAMERA_DEAD_ZONE) {
        const moveZ =
          deltaZ > 0 ? deltaZ - CAMERA_DEAD_ZONE : deltaZ + CAMERA_DEAD_ZONE;
        cameraTarget.current.z += moveZ * 0.1;
      }

      const margin = CAMERA_DEAD_ZONE;
      cameraTarget.current.x = Math.max(
        margin,
        Math.min(levelConfig.mapWidth - margin, cameraTarget.current.x),
      );
      cameraTarget.current.z = Math.max(
        margin,
        Math.min(levelConfig.mapHeight - margin, cameraTarget.current.z),
      );
    }

    if (cameraView === "top") {
      camera.position.set(
        cameraTarget.current.x,
        zoomDistance,
        cameraTarget.current.z,
      );
      camera.lookAt(cameraTarget.current.x, 0, cameraTarget.current.z);
    } else {
      const offset = zoomDistance * 0.8;
      camera.position.set(
        cameraTarget.current.x,
        offset,
        cameraTarget.current.z + offset,
      );
      camera.lookAt(cameraTarget.current.x, 0, cameraTarget.current.z);
    }

    const frameSpeed = playerStats.speed * delta;
    let moveX = 0;
    let moveZ = 0;
    let wantsHorizontal = false;
    let wantsVertical = false;

    if (keysPressed.current.has("w")) {
      moveZ -= frameSpeed;
      wantsVertical = true;
    }
    if (keysPressed.current.has("s")) {
      moveZ += frameSpeed;
      wantsVertical = true;
    }
    if (keysPressed.current.has("a")) {
      moveX -= frameSpeed;
      wantsHorizontal = true;
    }
    if (keysPressed.current.has("d")) {
      moveX += frameSpeed;
      wantsHorizontal = true;
    }

    const roundedX = Math.round(playerPosition.current.x);
    const roundedZ = Math.round(playerPosition.current.z);
    const offsetX = playerPosition.current.x - roundedX;
    const offsetZ = playerPosition.current.z - roundedZ;

    if (wantsVertical && !wantsHorizontal && Math.abs(offsetX) > 0.02) {
      const alignX = offsetX > 0 ? -ALIGNMENT_SPEED : ALIGNMENT_SPEED;
      const targetX = playerPosition.current.x + alignX;
      if (canMove(targetX, playerPosition.current.z, true)) {
        playerPosition.current.x = targetX;
        if (playerRef.current) {
          playerRef.current.position.x = targetX;
        }
      }
    } else if (wantsHorizontal && !wantsVertical && Math.abs(offsetZ) > 0.02) {
      const alignZ = offsetZ > 0 ? -ALIGNMENT_SPEED : ALIGNMENT_SPEED;
      const targetZ = playerPosition.current.z + alignZ;
      if (canMove(playerPosition.current.x, targetZ, true)) {
        playerPosition.current.z = targetZ;
        if (playerRef.current) {
          playerRef.current.position.z = targetZ;
        }
      }
    }

    if (moveX !== 0 || moveZ !== 0) {
      let newX = playerPosition.current.x;
      let newZ = playerPosition.current.z;
      const proposedX = playerPosition.current.x + moveX;
      const proposedZ = playerPosition.current.z + moveZ;

      if (moveX !== 0 && moveZ !== 0) {
        if (canMove(proposedX, proposedZ, true)) {
          newX = proposedX;
          newZ = proposedZ;
        } else {
          if (canMove(proposedX, playerPosition.current.z, true)) {
            newX = proposedX;
          }
          if (canMove(playerPosition.current.x, proposedZ, true)) {
            newZ = proposedZ;
          }
        }
      } else {
        if (moveX !== 0) {
          if (Math.abs(offsetZ) < ALIGNMENT_THRESHOLD || !wantsHorizontal) {
            if (canMove(proposedX, playerPosition.current.z, true)) {
              newX = proposedX;
            }
          }
        }
        if (moveZ !== 0) {
          if (Math.abs(offsetX) < ALIGNMENT_THRESHOLD || !wantsVertical) {
            if (canMove(playerPosition.current.x, proposedZ, true)) {
              newZ = proposedZ;
            }
          }
        }
      }

      const clampedX = Math.max(
        0.5,
        Math.min(levelConfig.mapWidth - 0.5, newX),
      );
      const clampedZ = Math.max(
        0.5,
        Math.min(levelConfig.mapHeight - 0.5, newZ),
      );

      if (
        clampedX !== playerPosition.current.x ||
        clampedZ !== playerPosition.current.z
      ) {
        playerPosition.current = { x: clampedX, z: clampedZ };
        if (playerRef.current) {
          playerRef.current.position.x = clampedX;
          playerRef.current.position.z = clampedZ;
        }
      }
    }

    if (powerUp && !powerUp.collected) {
      const distToPowerUp = Math.sqrt(
        (playerPosition.current.x - powerUp.x) ** 2 +
          (playerPosition.current.z - powerUp.z) ** 2,
      );
      if (distToPowerUp < 0.5) {
        setPowerUp((prev) => (prev ? { ...prev, collected: true } : null));

        // Apply power-up effect
        setPlayerStats((prev) => {
          switch (powerUp.type) {
            case "bombRange":
              return { ...prev, bombRange: prev.bombRange + 1 };
            case "bombCount":
              return { ...prev, maxBombs: prev.maxBombs + 1 };
            case "speed":
              return { ...prev, speed: prev.speed + 0.5 };
            case "bombTimer":
              return {
                ...prev,
                bombTimer: Math.max(1500, prev.bombTimer - 500),
              };
            default:
              return prev;
          }
        });

        setScore((prev) => prev + 50);
      }
    }

    if (door && door.active) {
      const distToDoor = Math.sqrt(
        (playerPosition.current.x - door.x) ** 2 +
          (playerPosition.current.z - door.z) ** 2,
      );
      if (distToDoor < 0.5) {
        setGameActive(false);
        setTimeout(() => onVictory(), 100);
      }
    }

    const monsterFrameSpeed = levelConfig.monsterSpeed * delta * 60;
    // Update monsters through ref instead of state
    monstersRef.current = monstersRef.current.map((monster) => {
      if (!monster.alive) return monster;

      const dx = playerPosition.current.x - monster.x;
      const dz = playerPosition.current.z - monster.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      let newDir = { ...monster.direction };
      let isChasing = false;

      if (
        distance < levelConfig.monsterScanDistance &&
        hasLineOfSight(
          monster.x,
          monster.z,
          playerPosition.current.x,
          playerPosition.current.z,
        )
      ) {
        if (Math.abs(dx) > Math.abs(dz)) {
          newDir = { x: dx > 0 ? 1 : -1, z: 0 };
          isChasing = true;
        } else {
          newDir = { x: 0, z: dz > 0 ? 1 : -1 };
          isChasing = true;
        }
      }

      let newX = monster.x + newDir.x * monsterFrameSpeed;
      let newZ = monster.z + newDir.z * monsterFrameSpeed;

      if (!canMove(newX, newZ, false)) {
        if (isChasing) {
          if (newDir.x !== 0) {
            const altDir = { x: 0, z: dz > 0 ? 1 : -1 };
            const altX = monster.x + altDir.x * monsterFrameSpeed;
            const altZ = monster.z + altDir.z * monsterFrameSpeed;
            if (canMove(altX, altZ, false)) {
              newX = altX;
              newZ = altZ;
              newDir = altDir;
            } else {
              newX = monster.x;
              newZ = monster.z;
            }
          } else {
            const altDir = { x: dx > 0 ? 1 : -1, z: 0 };
            const altX = monster.x + altDir.x * monsterFrameSpeed;
            const altZ = monster.z + altDir.z * monsterFrameSpeed;
            if (canMove(altX, altZ, false)) {
              newX = altX;
              newZ = altZ;
              newDir = altDir;
            } else {
              newX = monster.x;
              newZ = monster.z;
            }
          }
        } else {
          const directions = [
            { x: 1, z: 0 },
            { x: -1, z: 0 },
            { x: 0, z: 1 },
            { x: 0, z: -1 },
          ];
          newDir = directions[Math.floor(Math.random() * directions.length)];
          newX = monster.x;
          newZ = monster.z;
        }
      }

      const distToPlayer = Math.sqrt(
        (newX - playerPosition.current.x) ** 2 +
          (newZ - playerPosition.current.z) ** 2,
      );
      if (distToPlayer < 0.4) {
        setGameActive(false);
        setTimeout(() => onGameOver(), 100);
      }

      return {
        ...monster,
        x: newX,
        z: newZ,
        direction: newDir,
      };
    });

    const bombsToExplode = bombs.filter((bomb) => bomb.timer <= now);

    if (bombsToExplode.length > 0) {
      setBombs((prev) => prev.filter((bomb) => bomb.timer > now));
      setActiveBombCount((prev) => Math.max(0, prev - bombsToExplode.length));

      requestAnimationFrame(() => {
        const newExplosions = bombsToExplode.flatMap((bomb) => {
          const exp = [];
          exp.push({ x: bomb.x, z: bomb.z, timestamp: now, isCenter: true });

          for (const dir of [
            { x: 1, z: 0, name: "right" },
            { x: -1, z: 0, name: "left" },
            { x: 0, z: 1, name: "down" },
            { x: 0, z: -1, name: "up" },
          ]) {
            for (let i = 1; i <= playerStats.bombRange; i++) {
              const expX = bomb.x + dir.x * i;
              const expZ = bomb.z + dir.z * i;

              if (
                expX < 0 ||
                expX >= levelConfig.mapWidth ||
                expZ < 0 ||
                expZ >= levelConfig.mapHeight
              )
                break;
              if (MAP[Math.round(expZ)][Math.round(expX)] === 1) break;

              const brickKey = `${Math.round(expX)},${Math.round(expZ)}`;
              if (bricks.has(brickKey)) {
                setBricks((prev) => {
                  const newBricks = new Set(prev);
                  newBricks.delete(brickKey);
                  return newBricks;
                });
                break;
              }

              exp.push({
                x: expX,
                z: expZ,
                timestamp: now,
                direction: dir.name,
              });
            }
          }
          return exp;
        });

        setExplosions((prev) => [...prev, ...newExplosions]);

        newExplosions.forEach((exp) => {
          const distToPlayer = Math.sqrt(
            (exp.x - playerPosition.current.x) ** 2 +
              (exp.z - playerPosition.current.z) ** 2,
          );
          if (distToPlayer < 0.5) {
            setGameActive(false);
            setTimeout(() => onGameOver(), 100);
          }

          // Process monster explosions using ref
          monstersRef.current = monstersRef.current.map((monster) => {
            if (!monster.alive) return monster;
            const distToMonster = Math.sqrt(
              (exp.x - monster.x) ** 2 + (exp.z - monster.z) ** 2,
            );
            if (distToMonster < 0.5) {
              setScore((s) => {
                const newScore = s + 100;
                onScoreChange(newScore);
                return newScore;
              });
              return { ...monster, alive: false };
            }
            return monster;
          });
        });
      });
    }

    setExplosions((prev) =>
      prev.filter((exp) => now - exp.timestamp < EXPLOSION_DURATION),
    );

    const allMonstersDead = monstersRef.current.every((m) => !m.alive);
    if (allMonstersDead && door && !door.active) {
      setDoor((prev) => (prev ? { ...prev, active: true } : null));
    }
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <hemisphereLight args={["#87ceeb", "#654321", 0.5]} />
      <directionalLight
        position={[levelConfig.mapWidth / 2, 20, levelConfig.mapHeight / 2]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-levelConfig.mapWidth}
        shadow-camera-right={levelConfig.mapWidth}
        shadow-camera-top={levelConfig.mapHeight}
        shadow-camera-bottom={-levelConfig.mapHeight}
      />
      <pointLight
        position={[playerPosition.current.x, 3, playerPosition.current.z]}
        intensity={1.5}
        distance={10}
        color="#06b6d4"
      />

      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[
          levelConfig.mapWidth / 2 - 0.5,
          -0.01,
          levelConfig.mapHeight / 2 - 0.5,
        ]}
      >
        <planeGeometry args={[levelConfig.mapWidth, levelConfig.mapHeight]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} metalness={0.1} />
      </mesh>

      {MAP.map((row, z) =>
        row.map((cell, x) => {
          if (cell === 1) {
            return (
              <mesh
                key={`wall-${x}-${z}`}
                position={[x, 0.5, z]}
                castShadow
                receiveShadow
                geometry={wallGeometry}
                material={wallMaterial}
              />
            );
          }
          return null;
        }),
      )}

      {Array.from(bricks).map((key) => {
        const [x, z] = key.split(",").map(Number);
        return (
          <mesh
            key={`brick-${key}`}
            position={[x, 0.4, z]}
            castShadow
            receiveShadow
            geometry={brickGeometry}
            material={brickMaterial}
          />
        );
      })}

      <mesh
        ref={playerRef}
        position={[playerPosition.current.x, 0.35, playerPosition.current.z]}
        castShadow
        receiveShadow
        geometry={playerGeometry}
      >
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#06b6d4"
          emissiveIntensity={0.3}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>

      {/* Render monsters from ref */}
      {monstersRef.current.map(
        (monster) =>
          monster.alive && (
            <mesh
              key={monster.id}
              position={[monster.x, 0.35, monster.z]}
              castShadow
              receiveShadow
              geometry={monsterGeometry}
            >
              <meshStandardMaterial
                color="#ef4444"
                emissive="#ef4444"
                emissiveIntensity={0.3}
                roughness={0.4}
                metalness={0.6}
              />
            </mesh>
          ),
      )}

      {bombs.map((bomb) => (
        <mesh
          key={bomb.id}
          position={[bomb.x, 0.3, bomb.z]}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial
            color="#1e3a8a"
            emissive="#1e3a8a"
            emissiveIntensity={0.5}
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
      ))}

      {explosions.map((exp, i) => {
        const age =
          (currentTimeRef.current - exp.timestamp) / EXPLOSION_DURATION;
        const opacity = Math.max(0, 1 - age);

        if (exp.isCenter) {
          const scale = 0.8 + age * 0.4;
          return (
            <group key={`exp-${i}`} position={[exp.x, 0.3, exp.z]}>
              <mesh scale={[scale, scale * 1.5, scale]}>
                <sphereGeometry args={[0.4, 12, 12]} />
                <meshStandardMaterial
                  color="#ffdd00"
                  emissive="#ffdd00"
                  emissiveIntensity={3}
                  transparent
                  opacity={opacity}
                />
              </mesh>
              <mesh scale={[scale * 1.3, scale * 1.8, scale * 1.3]}>
                <sphereGeometry args={[0.4, 12, 12]} />
                <meshStandardMaterial
                  color="#ff6600"
                  emissive="#ff6600"
                  emissiveIntensity={2}
                  transparent
                  opacity={opacity * 0.7}
                />
              </mesh>
              <mesh scale={[scale * 1.6, scale * 2, scale * 1.6]}>
                <sphereGeometry args={[0.4, 12, 12]} />
                <meshStandardMaterial
                  color="#ff0000"
                  emissive="#ff0000"
                  emissiveIntensity={1.5}
                  transparent
                  opacity={opacity * 0.4}
                />
              </mesh>
              <pointLight
                position={[0, 0.5, 0]}
                intensity={opacity * 8}
                distance={4}
                color="#ffaa00"
                decay={2}
              />
            </group>
          );
        } else {
          const isHorizontal =
            exp.direction === "left" || exp.direction === "right";
          const scaleX = isHorizontal ? 0.8 + age * 0.3 : 0.5 + age * 0.2;
          const scaleZ = !isHorizontal ? 0.8 + age * 0.3 : 0.5 + age * 0.2;
          const scaleY = 0.6 + age * 0.4;

          return (
            <group key={`exp-${i}`} position={[exp.x, 0.3, exp.z]}>
              <mesh scale={[scaleX, scaleY, scaleZ]}>
                <boxGeometry args={[0.8, 0.8, 0.8]} />
                <meshStandardMaterial
                  color="#ffee00"
                  emissive="#ffee00"
                  emissiveIntensity={2.5}
                  transparent
                  opacity={opacity}
                />
              </mesh>
              <mesh scale={[scaleX * 1.2, scaleY * 1.3, scaleZ * 1.2]}>
                <boxGeometry args={[0.8, 0.8, 0.8]} />
                <meshStandardMaterial
                  color="#ff8800"
                  emissive="#ff8800"
                  emissiveIntensity={2}
                  transparent
                  opacity={opacity * 0.6}
                />
              </mesh>
              <pointLight
                position={[0, 0.3, 0]}
                intensity={opacity * 4}
                distance={3}
                color="#ffaa00"
                decay={2}
              />
            </group>
          );
        }
      })}

      {powerUp && !powerUp.collected && (
        <mesh position={[powerUp.x, 0.4, powerUp.z]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial
            color={getPowerUpColor(powerUp.type)}
            emissive={getPowerUpColor(powerUp.type)}
            emissiveIntensity={0.8}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      )}

      {door && (
        <mesh position={[door.x, 0.5, door.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.8, 0.8]} />
          <meshStandardMaterial
            color={door.active ? "#10b981" : "#6b7280"}
            emissive={door.active ? "#10b981" : "#6b7280"}
            emissiveIntensity={door.active ? 0.8 : 0.2}
            transparent
            opacity={0.9}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      )}
    </>
  );
});
