import { useEffect, useRef, useCallback } from 'react';
import { useGame } from '../hooks/useGame';
import { soundManager } from '../utils/sounds';
import './Game.css';

export const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    gameState,
    startGame,
    restartGame,
    dropOrb,
    updateDropX,
    GAME_WIDTH,
    GAME_HEIGHT,
  } = useGame();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      startGame(canvas);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getGameX = useCallback(
    (clientX: number): number => {
      if (!containerRef.current) return GAME_WIDTH / 2;
      const rect = containerRef.current.getBoundingClientRect();
      const scaleX = GAME_WIDTH / rect.width;
      return (clientX - rect.left) * scaleX;
    },
    [GAME_WIDTH]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (gameState.isGameOver) return;
      const x = getGameX(e.clientX);
      updateDropX(x);
    },
    [getGameX, updateDropX, gameState.isGameOver]
  );

  const handlePointerDown = useCallback(
    async (e: React.PointerEvent) => {
      await soundManager.resume();
      if (gameState.isGameOver) return;
      const x = getGameX(e.clientX);
      updateDropX(x);
    },
    [getGameX, updateDropX, gameState.isGameOver]
  );

  const handlePointerUp = useCallback(() => {
    if (gameState.isGameOver) return;
    dropOrb();
  }, [dropOrb, gameState.isGameOver]);

  const handleRestart = useCallback(async () => {
    await soundManager.resume();
    restartGame();
  }, [restartGame]);

  return (
    <div className="game-wrapper">
      <div className="game-container" ref={containerRef}>
        {/* Score display */}
        <div className="score-display">
          <div className="score">
            <span className="score-label">SCORE</span>
            <span className="score-value">{gameState.score}</span>
          </div>
          <div className="game-title">
            <span className="title-text">DEEP MERGE</span>
          </div>
          <div className="high-score">
            <span className="score-label">BEST</span>
            <span className="score-value">{gameState.highScore}</span>
          </div>
        </div>

        {/* Game canvas */}
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="game-canvas"
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        {/* Ad placeholder */}
        <div className="ad-placeholder">
          <span className="ad-label">[ ADVERTISEMENT ]</span>
        </div>

        {/* Game over overlay */}
        {gameState.isGameOver && (
          <div className="game-over-overlay">
            <div className="game-over-content">
              <h2 className="glitch-text" data-text="GAME OVER">GAME OVER</h2>
              <p className="game-over-subtitle">the void consumes all...</p>
              <div className="final-scores">
                <p>
                  <span>SCORE:</span>
                  <span className="final-score-value">{gameState.score}</span>
                </p>
                <p>
                  <span>BEST:</span>
                  <span className="final-score-value">{gameState.highScore}</span>
                </p>
              </div>
              <button className="restart-button" onClick={handleRestart}>
                AGAIN?
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
