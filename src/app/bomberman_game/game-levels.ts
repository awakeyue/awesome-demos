export type PowerUpType =
  | "bombRange"
  | "bombCount"
  | "speed"
  | "bombTimer"
  | "bombWalk";

export interface LevelConfig {
  level: number;
  mapWidth: number;
  mapHeight: number;
  monsterCount: number;
  monsterSpeed: number;
  monsterScanDistance: number;
  brickRatio: number;
  powerUp: PowerUpType | null;
  description: string;
}

export const LEVELS: LevelConfig[] = [
  {
    level: 1,
    mapWidth: 13,
    mapHeight: 13,
    monsterCount: 3,
    monsterSpeed: 0.025,
    monsterScanDistance: 5,
    brickRatio: 0.25,
    powerUp: "bombRange",
    description: "新手关卡 - 学习基础操作",
  },
  {
    level: 2,
    mapWidth: 15,
    mapHeight: 15,
    monsterCount: 3,
    monsterSpeed: 0.03,
    monsterScanDistance: 6,
    brickRatio: 0.3,
    powerUp: "bombCount",
    description: "增加炸弹数量",
  },
  {
    level: 3,
    mapWidth: 15,
    mapHeight: 15,
    monsterCount: 3,
    monsterSpeed: 0.035,
    monsterScanDistance: 6,
    brickRatio: 0.35,
    powerUp: "speed",
    description: "怪物开始加速",
  },
  {
    level: 4,
    mapWidth: 17,
    mapHeight: 17,
    monsterCount: 4,
    monsterSpeed: 0.035,
    monsterScanDistance: 7,
    brickRatio: 0.3,
    powerUp: "bombTimer",
    description: "更大的地图",
  },
  {
    level: 5,
    mapWidth: 17,
    mapHeight: 17,
    monsterCount: 4,
    monsterSpeed: 0.04,
    monsterScanDistance: 7,
    brickRatio: 0.35,
    powerUp: "bombWalk",
    description: "怪物更快了",
  },
  {
    level: 6,
    mapWidth: 19,
    mapHeight: 19,
    monsterCount: 5,
    monsterSpeed: 0.04,
    monsterScanDistance: 8,
    brickRatio: 0.32,
    powerUp: "bombRange",
    description: "更多的怪物",
  },
  {
    level: 7,
    mapWidth: 19,
    mapHeight: 19,
    monsterCount: 5,
    monsterSpeed: 0.045,
    monsterScanDistance: 9,
    brickRatio: 0.4,
    powerUp: "bombCount",
    description: "更多的障碍",
  },
  {
    level: 8,
    mapWidth: 21,
    mapHeight: 21,
    monsterCount: 6,
    monsterSpeed: 0.045,
    monsterScanDistance: 9,
    brickRatio: 0.35,
    powerUp: "speed",
    description: "挑战你的极限",
  },
  {
    level: 9,
    mapWidth: 21,
    mapHeight: 21,
    monsterCount: 6,
    monsterSpeed: 0.05,
    monsterScanDistance: 10,
    brickRatio: 0.38,
    powerUp: "bombTimer",
    description: "接近终点",
  },
  {
    level: 10,
    mapWidth: 23,
    mapHeight: 23,
    monsterCount: 8,
    monsterSpeed: 0.05,
    monsterScanDistance: 10,
    brickRatio: 0.4,
    powerUp: "bombWalk",
    description: "最终挑战！",
  },
];

export function getPowerUpColor(type: PowerUpType): string {
  switch (type) {
    case "bombRange":
      return "#ef4444"; // red
    case "bombCount":
      return "#f59e0b"; // amber
    case "speed":
      return "#10b981"; // emerald
    case "bombTimer":
      return "#8b5cf6"; // violet
    case "bombWalk":
      return "#06b6d4"; // cyan
  }
}

export function getPowerUpName(type: PowerUpType): string {
  switch (type) {
    case "bombRange":
      return "爆炸威力+";
    case "bombCount":
      return "炸弹数量+";
    case "speed":
      return "移速提升";
    case "bombTimer":
      return "炸弹计时-";
    case "bombWalk":
      return "穿越炸弹";
  }
}
