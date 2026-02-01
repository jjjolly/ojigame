import { useEffect, useRef, useCallback, useState } from 'react';
import { useGame } from '../hooks/useGame';
import { soundManager } from '../utils/sounds';
import './Game.css';

// Constants for layout calculation
const GAME_ASPECT_RATIO = 4 / 7; // width / height
const AD_ASPECT_RATIO = 320 / 100; // width / height = 3.2
const SCORE_DISPLAY_HEIGHT = 60; // approximate height of score display
const AD_MARGIN = 15;
const PADDING = 10;
const MAX_GAME_WIDTH = 500;

export const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(400);
  const {
    gameState,
    startGame,
    restartGame,
    dropOrb,
    updateDropX,
    GAME_WIDTH,
    GAME_HEIGHT,
  } = useGame();

  // Calculate responsive size based on viewport
  useEffect(() => {
    const calculateSize = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Available space
      const availableWidth = viewportWidth - (PADDING * 2);
      const availableHeight = viewportHeight - (PADDING * 2);

      // Calculate game height that would fit in available height
      // Total height = score + game + margin + ad
      // game_height = game_width / GAME_ASPECT_RATIO
      // ad_height = game_width / AD_ASPECT_RATIO
      // total = SCORE_DISPLAY_HEIGHT + (game_width / GAME_ASPECT_RATIO) + AD_MARGIN + (game_width / AD_ASPECT_RATIO)
      // Solve for game_width:
      // available_height = SCORE_DISPLAY_HEIGHT + game_width * (1/GAME_ASPECT_RATIO + 1/AD_ASPECT_RATIO) + AD_MARGIN
      // game_width = (available_height - SCORE_DISPLAY_HEIGHT - AD_MARGIN) / (1/GAME_ASPECT_RATIO + 1/AD_ASPECT_RATIO)

      const heightFactor = (1 / GAME_ASPECT_RATIO) + (1 / AD_ASPECT_RATIO);
      const widthFromHeight = (availableHeight - SCORE_DISPLAY_HEIGHT - AD_MARGIN) / heightFactor;

      // Use the smaller of available width or calculated width from height
      let gameWidth = Math.min(availableWidth, widthFromHeight, MAX_GAME_WIDTH);

      // Ensure minimum width
      gameWidth = Math.max(gameWidth, 280);

      setContainerWidth(gameWidth);
    };

    calculateSize();
    window.addEventListener('resize', calculateSize);
    return () => window.removeEventListener('resize', calculateSize);
  }, []);

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

  // Calculate ad dimensions based on game width
  const adWidth = containerWidth;
  const adHeight = containerWidth / AD_ASPECT_RATIO;

  return (
    <div className="game-wrapper">
      <div
        className="game-container"
        ref={containerRef}
        style={{ width: `${containerWidth}px` }}
      >
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
        <div
          className="ad-placeholder"
          style={{ width: `${adWidth}px`, height: `${adHeight}px` }}
        >
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
