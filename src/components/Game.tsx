import { useEffect, useRef, useCallback } from 'react';
import { useGame } from '../hooks/useGame';
import { soundManager } from '../utils/sounds';
import { ORBS } from '../constants/uncles';
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

  // Initialize game on mount (empty deps to run only once)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      startGame(canvas);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle touch/mouse events for positioning
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
      // Resume audio context on first interaction
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
          <div className="high-score">
            <span className="score-label">HIGH SCORE</span>
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
          <span className="ad-label">世俗の報せ (ADVERTISEMENT)</span>
        </div>

        {/* Game over overlay */}
        {gameState.isGameOver && (
          <div className="game-over-overlay">
            <div className="game-over-content">
              <h2>GAME OVER</h2>
              <p className="game-over-subtitle">悟りへの道は険しく...</p>
              <div className="final-scores">
                <p>
                  <span>SCORE:</span>
                  <span className="final-score-value">{gameState.score}</span>
                </p>
                <p>
                  <span>HIGH SCORE:</span>
                  <span className="final-score-value">{gameState.highScore}</span>
                </p>
              </div>
              <button className="restart-button" onClick={handleRestart}>
                RESTART
              </button>
            </div>
          </div>
        )}

        {/* Orb evolution guide */}
        <div className="evolution-guide">
          <div className="guide-title">Soul Orb Evolution</div>
          <div className="guide-list">
            {ORBS.map((orb, idx) => (
              <div
                key={idx}
                className="guide-item"
                style={{
                  background: `radial-gradient(circle, ${orb.color}40 0%, ${orb.glowColor}20 100%)`,
                  boxShadow: `0 0 8px ${orb.glowColor}50`
                }}
              >
                <span className="guide-emoji">{orb.emoji}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
