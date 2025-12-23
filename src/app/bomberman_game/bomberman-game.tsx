"use client";

import { Canvas } from "@react-three/fiber";
import { GameScene } from "./game-scene";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LEVELS } from "./game-levels";
import { Clock } from "lucide-react";

export type CameraView = "top" | "angle";

export function BombermanGame() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [score, setScore] = useState(0);
  const [cameraView, setCameraView] = useState<CameraView>("top");
  const [lives, setLives] = useState(3);
  const [totalScore, setTotalScore] = useState(0);
  const [showDeathScreen, setShowDeathScreen] = useState(false);

  const [timeRemaining, setTimeRemaining] = useState(120);

  const currentLevelConfig = useMemo(
    () => LEVELS[currentLevel - 1],
    [currentLevel],
  );

  const handleRestart = useCallback(() => {
    setGameOver(false);
    setVictory(false);
    setShowDeathScreen(false);
    setScore(0);
    setCurrentLevel(1);
    setLives(3);
    setTotalScore(0);
    setTimeRemaining(120);
  }, []);

  const handleStart = useCallback(() => {
    setGameOver(false);
    setVictory(false);
    setShowDeathScreen(false);
    setScore(0);
    setTimeRemaining(120);
  }, []);

  const handleNextLevel = () => {
    if (currentLevel < LEVELS.length) {
      setVictory(false);
      setTotalScore((prev) => prev + score);
      setCurrentLevel((prev) => prev + 1);
    } else {
      setTotalScore((prev) => prev + score);
    }
  };

  const handleDeath = useCallback(() => {
    setShowDeathScreen(true);
    if (lives > 1) {
      setLives((prev) => prev - 1);
    } else {
      setGameOver(true);
    }
  }, [lives]);

  const handleVictory = useCallback(() => setVictory(true), []);

  const handleContinue = () => {
    handleStart();
  };

  const toggleCameraView = () => {
    setCameraView((prev) => (prev === "top" ? "angle" : "top"));
  };

  const getCameraViewName = () => {
    return cameraView === "top" ? "俯视视角" : "倾斜视角";
  };

  const gameCompleted = victory && currentLevel === LEVELS.length;

  // Timer effect moved from GameScene
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(interval);
          handleDeath();
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [handleDeath]);

  return (
    <div className="relative h-screen w-full bg-slate-950">
      <Canvas shadows>
        <GameScene
          onGameOver={handleDeath}
          onVictory={handleVictory}
          onScoreChange={setScore}
          levelConfig={currentLevelConfig}
          cameraView={cameraView}
          key={`level-${currentLevel}-${lives}-${showDeathScreen}`}
        />
      </Canvas>

      {/* HUD */}
      <div className="absolute top-4 left-4 text-white">
        <div className="rounded-lg border border-cyan-500/30 bg-slate-900/90 p-4 backdrop-blur-sm">
          <h1 className="mb-2 text-2xl font-bold text-cyan-400">炸弹超人 3D</h1>
          <div className="space-y-1 text-sm">
            <p className="text-lg font-bold text-emerald-400">
              第 {currentLevel} 关
            </p>
            <p className="text-slate-300">{currentLevelConfig.description}</p>
            <p className="text-emerald-400">当前得分: {score}</p>
            <p className="text-cyan-400">总分: {totalScore + score}</p>
            <p className="text-pink-400">生命: {"❤️".repeat(lives)}</p>
          </div>
          <div className="mt-4 space-y-1 text-sm text-slate-300">
            <p>WASD - 移动</p>
            <p>空格 - 放炸弹</p>
            <p>滚轮 - 缩放</p>
          </div>
        </div>
      </div>

      {/* Timer Display */}
      <div className="absolute top-4 right-1/2 translate-x-1/2">
        <div
          className={`flex items-center gap-1 rounded-lg border-2 px-6 py-3 text-2xl font-bold backdrop-blur-sm ${
            timeRemaining <= 10
              ? "animate-pulse border-red-500/50 bg-red-900/30 text-red-400"
              : timeRemaining <= 30
                ? "border-orange-500/50 bg-orange-900/30 text-orange-400"
                : "border-cyan-500/50 bg-slate-900/70 text-cyan-400"
          }`}
          style={{ pointerEvents: "none" }}
        >
          <Clock />
          <span>
            {Math.floor(timeRemaining / 60)}:
            {(timeRemaining % 60).toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Camera Toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleCameraView}
          className="rounded-lg border border-purple-500/30 bg-slate-900/90 px-4 py-3 text-sm text-white backdrop-blur-sm transition-colors hover:bg-slate-800/90"
        >
          <div className="font-semibold text-purple-400">
            视角: {getCameraViewName()}
          </div>
          <div className="mt-1 text-xs text-slate-400">点击切换</div>
        </button>
      </div>

      {showDeathScreen && !gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="text-center text-white">
            <h2 className="mb-4 text-5xl font-bold text-orange-400">阵亡!</h2>
            <p className="mb-4 text-2xl text-slate-300">剩余生命: {lives}</p>
            <p className="mb-8 text-lg text-slate-400">从当前关卡复活</p>
            <button
              onClick={handleContinue}
              className="transform rounded-lg bg-linear-to-r from-orange-600 to-orange-700 px-8 py-4 text-lg font-semibold shadow-lg transition-all hover:scale-105 hover:from-orange-700 hover:to-orange-800"
            >
              继续游戏
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="text-center text-white">
            <h2 className="mb-4 text-5xl font-bold text-red-400">游戏结束!</h2>
            <p className="mb-2 text-2xl text-slate-300">
              到达关卡: {currentLevel}
            </p>
            <p className="mb-4 text-lg text-red-300">生命已用完</p>
            <p className="mb-8 text-xl text-slate-300">
              总分: {totalScore + score}
            </p>
            <button
              onClick={handleRestart}
              className="transform rounded-lg bg-linear-to-r from-red-600 to-red-700 px-8 py-4 text-lg font-semibold shadow-lg transition-all hover:scale-105 hover:from-red-700 hover:to-red-800"
            >
              从第一关重新开始
            </button>
          </div>
        </div>
      )}

      {/* Victory Screen */}
      {victory && !gameCompleted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="text-center text-white">
            <h2 className="mb-4 text-5xl font-bold text-emerald-400">
              关卡完成!
            </h2>
            <p className="mb-4 text-2xl text-slate-300">第 {currentLevel} 关</p>
            <p className="mb-8 text-xl text-slate-300">得分: {score}</p>
            <button
              onClick={handleNextLevel}
              className="transform rounded-lg bg-linear-to-r from-emerald-600 to-emerald-700 px-8 py-4 text-lg font-semibold shadow-lg transition-all hover:scale-105 hover:from-emerald-700 hover:to-emerald-800"
            >
              下一关
            </button>
          </div>
        </div>
      )}

      {/* Game Completed */}
      {gameCompleted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="text-center text-white">
            <h2 className="mb-4 text-6xl font-bold text-yellow-400">
              🎉 恭喜通关! 🎉
            </h2>
            <p className="mb-4 text-3xl text-slate-300">
              完成所有 {LEVELS.length} 关
            </p>
            <p className="mb-8 text-2xl text-emerald-400">
              最终得分: {totalScore + score}
            </p>
            <button
              onClick={handleRestart}
              className="transform rounded-lg bg-linear-to-r from-yellow-600 to-orange-600 px-8 py-4 text-lg font-semibold shadow-lg transition-all hover:scale-105 hover:from-yellow-700 hover:to-orange-700"
            >
              再玩一次
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
