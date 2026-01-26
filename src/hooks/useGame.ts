import { useRef, useState, useCallback, useEffect } from 'react';
import Matter from 'matter-js';
import {
  UNCLES,
  GAME_WIDTH,
  GAME_HEIGHT,
  WALL_THICKNESS,
  GAME_OVER_LINE_Y,
  DROP_AREA_HEIGHT,
  PHYSICS_CONFIG,
  getRandomSpawnableUncle,
  getNextEvolution,
} from '../constants/uncles';
import type { UncleType } from '../constants/uncles';
import { soundManager } from '../utils/sounds';
import { particleSystem } from '../utils/particles';

interface UncleBody extends Matter.Body {
  uncleId?: number;
  isUncle?: boolean;
}

interface GameState {
  score: number;
  highScore: number;
  isGameOver: boolean;
  currentUncle: UncleType;
  nextUncle: UncleType;
  dropX: number;
  canDrop: boolean;
  goldenFlash: number;
}

const HIGH_SCORE_KEY = 'ojigame_highscore';

export const useGame = () => {
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameOverCheckRef = useRef<number | null>(null);

  const [gameState, setGameState] = useState<GameState>(() => ({
    score: 0,
    highScore: parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10),
    isGameOver: false,
    currentUncle: getRandomSpawnableUncle(),
    nextUncle: getRandomSpawnableUncle(),
    dropX: GAME_WIDTH / 2,
    canDrop: true,
    goldenFlash: 0,
  }));

  // Create uncle body
  const createUncleBody = useCallback((x: number, y: number, uncle: UncleType): UncleBody => {
    const body = Matter.Bodies.circle(x, y, uncle.radius, {
      friction: PHYSICS_CONFIG.friction,
      frictionStatic: PHYSICS_CONFIG.frictionStatic,
      restitution: PHYSICS_CONFIG.restitution,
      density: PHYSICS_CONFIG.density,
      label: `uncle_${uncle.id}`,
    }) as UncleBody;

    body.uncleId = uncle.id;
    body.isUncle = true;

    return body;
  }, []);

  // Initialize the physics engine
  const initEngine = useCallback(() => {
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 1 },
    });

    engineRef.current = engine;

    // Create walls
    const walls = [
      // Bottom
      Matter.Bodies.rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT + WALL_THICKNESS / 2,
        GAME_WIDTH + WALL_THICKNESS * 2,
        WALL_THICKNESS,
        { isStatic: true, label: 'wall_bottom' }
      ),
      // Left
      Matter.Bodies.rectangle(
        -WALL_THICKNESS / 2,
        GAME_HEIGHT / 2,
        WALL_THICKNESS,
        GAME_HEIGHT,
        { isStatic: true, label: 'wall_left' }
      ),
      // Right
      Matter.Bodies.rectangle(
        GAME_WIDTH + WALL_THICKNESS / 2,
        GAME_HEIGHT / 2,
        WALL_THICKNESS,
        GAME_HEIGHT,
        { isStatic: true, label: 'wall_right' }
      ),
    ];

    Matter.Composite.add(engine.world, walls);

    // Collision detection for merging
    Matter.Events.on(engine, 'collisionStart', (event) => {
      const pairs = event.pairs;

      for (const pair of pairs) {
        const bodyA = pair.bodyA as UncleBody;
        const bodyB = pair.bodyB as UncleBody;

        if (bodyA.isUncle && bodyB.isUncle && bodyA.uncleId === bodyB.uncleId) {
          const uncleId = bodyA.uncleId!;
          const nextUncle = getNextEvolution(uncleId);

          if (nextUncle) {
            // Calculate midpoint
            const midX = (bodyA.position.x + bodyB.position.x) / 2;
            const midY = (bodyA.position.y + bodyB.position.y) / 2;

            // Remove both bodies
            Matter.Composite.remove(engine.world, bodyA);
            Matter.Composite.remove(engine.world, bodyB);

            // Create new evolved uncle
            const newBody = createUncleBody(midX, midY, nextUncle);
            Matter.Composite.add(engine.world, newBody);

            // Play sound and create particles
            const currentUncle = UNCLES[uncleId];
            soundManager.playMergeSound(currentUncle.soundType);

            const isEnlightenment = nextUncle.id === 10;
            particleSystem.createMergeParticles(midX, midY, nextUncle.color, isEnlightenment);

            // Update score
            setGameState((prev) => {
              const newScore = prev.score + nextUncle.score;
              const newHighScore = Math.max(newScore, prev.highScore);

              if (newHighScore > prev.highScore) {
                localStorage.setItem(HIGH_SCORE_KEY, newHighScore.toString());
              }

              return {
                ...prev,
                score: newScore,
                highScore: newHighScore,
                goldenFlash: isEnlightenment ? 60 : prev.goldenFlash,
              };
            });
          }
        }
      }
    });

    return engine;
  }, [createUncleBody]);

  // Check for game over
  const checkGameOver = useCallback(() => {
    if (!engineRef.current) return false;

    const bodies = Matter.Composite.allBodies(engineRef.current.world);

    for (const body of bodies) {
      const uncleBody = body as UncleBody;
      if (uncleBody.isUncle) {
        // Check if uncle is above the game over line and has settled
        if (uncleBody.position.y - (UNCLES[uncleBody.uncleId!]?.radius || 0) < GAME_OVER_LINE_Y) {
          // Check if the body has low velocity (settled)
          const speed = Math.sqrt(
            uncleBody.velocity.x * uncleBody.velocity.x +
            uncleBody.velocity.y * uncleBody.velocity.y
          );
          if (speed < 0.5) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  // Drop uncle
  const dropUncle = useCallback(() => {
    if (!engineRef.current || !gameState.canDrop || gameState.isGameOver) return;

    const body = createUncleBody(
      gameState.dropX,
      DROP_AREA_HEIGHT / 2,
      gameState.currentUncle
    );
    Matter.Composite.add(engineRef.current.world, body);

    soundManager.playDropSound();

    // Set next uncle and generate new next
    setGameState((prev) => ({
      ...prev,
      currentUncle: prev.nextUncle,
      nextUncle: getRandomSpawnableUncle(),
      canDrop: false,
    }));

    // Re-enable dropping after a delay
    setTimeout(() => {
      setGameState((prev) => ({ ...prev, canDrop: true }));
    }, 500);
  }, [createUncleBody, gameState.canDrop, gameState.currentUncle, gameState.dropX, gameState.isGameOver, gameState.nextUncle]);

  // Update drop position
  const updateDropX = useCallback((x: number) => {
    const uncle = gameState.currentUncle;
    const minX = uncle.radius;
    const maxX = GAME_WIDTH - uncle.radius;
    const clampedX = Math.max(minX, Math.min(maxX, x));

    setGameState((prev) => ({ ...prev, dropX: clampedX }));
  }, [gameState.currentUncle]);

  // Draw the game
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#E8E0D0';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Golden flash effect
    if (gameState.goldenFlash > 0) {
      ctx.fillStyle = `rgba(255, 215, 0, ${gameState.goldenFlash / 60 * 0.5})`;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      setGameState((prev) => ({ ...prev, goldenFlash: Math.max(0, prev.goldenFlash - 1) }));
    }

    // Draw background pattern (train-like)
    ctx.strokeStyle = '#D0C8B8';
    ctx.lineWidth = 2;

    // Horizontal lines (like train handles)
    for (let y = 150; y < GAME_HEIGHT; y += 100) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_WIDTH, y);
      ctx.stroke();
    }

    // Vertical bars (like train poles)
    ctx.strokeStyle = '#C0B8A8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(20, GAME_HEIGHT);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH - 20, 0);
    ctx.lineTo(GAME_WIDTH - 20, GAME_HEIGHT);
    ctx.stroke();

    // Draw game over line
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(0, GAME_OVER_LINE_Y);
    ctx.lineTo(GAME_WIDTH, GAME_OVER_LINE_Y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw preview uncle at drop position
    if (!gameState.isGameOver && gameState.canDrop) {
      const uncle = gameState.currentUncle;
      ctx.globalAlpha = 0.5;

      // Draw guide line
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(gameState.dropX, DROP_AREA_HEIGHT);
      ctx.lineTo(gameState.dropX, GAME_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw preview uncle
      ctx.beginPath();
      ctx.arc(gameState.dropX, DROP_AREA_HEIGHT / 2, uncle.radius, 0, Math.PI * 2);
      ctx.fillStyle = uncle.color;
      ctx.fill();
      ctx.strokeStyle = uncle.borderColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#000';
      ctx.font = `${Math.max(16, uncle.radius * 0.8)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(uncle.emoji, gameState.dropX, DROP_AREA_HEIGHT / 2);

      ctx.globalAlpha = 1;
    }

    // Draw all uncle bodies
    const bodies = Matter.Composite.allBodies(engine.world);

    for (const body of bodies) {
      const uncleBody = body as UncleBody;
      if (uncleBody.isUncle && uncleBody.uncleId !== undefined) {
        const uncle = UNCLES[uncleBody.uncleId];
        if (!uncle) continue;

        ctx.save();
        ctx.translate(uncleBody.position.x, uncleBody.position.y);
        ctx.rotate(uncleBody.angle);

        // Draw circle
        ctx.beginPath();
        ctx.arc(0, 0, uncle.radius, 0, Math.PI * 2);
        ctx.fillStyle = uncle.color;
        ctx.fill();
        ctx.strokeStyle = uncle.borderColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw emoji
        ctx.fillStyle = '#000';
        ctx.font = `${Math.max(16, uncle.radius * 0.8)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(uncle.emoji, 0, 0);

        // Draw glow for Buddha uncle
        if (uncle.id === 10) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#FFD700';
          ctx.beginPath();
          ctx.arc(0, 0, uncle.radius + 5, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
          ctx.lineWidth = 5;
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    // Draw particles
    particleSystem.update();
    particleSystem.draw(ctx);

    // Draw next uncle preview
    const nextUncle = gameState.nextUncle;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(GAME_WIDTH - 70, 10, 60, 60);
    ctx.fillStyle = '#FFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('NEXT', GAME_WIDTH - 40, 22);

    ctx.beginPath();
    ctx.arc(GAME_WIDTH - 40, 50, Math.min(20, nextUncle.radius * 0.5), 0, Math.PI * 2);
    ctx.fillStyle = nextUncle.color;
    ctx.fill();
    ctx.strokeStyle = nextUncle.borderColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
    ctx.fillText(nextUncle.emoji, GAME_WIDTH - 40, 52);
  }, [gameState]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!engineRef.current) return;

    Matter.Engine.update(engineRef.current, 1000 / 60);
    draw();

    // Check for game over periodically
    if (!gameState.isGameOver && checkGameOver()) {
      setGameState((prev) => ({ ...prev, isGameOver: true }));
      soundManager.playGameOverSound();
    }

    renderRef.current = requestAnimationFrame(gameLoop);
  }, [draw, checkGameOver, gameState.isGameOver]);

  // Start the game
  const startGame = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
    initEngine();
    gameLoop();
  }, [initEngine, gameLoop]);

  // Restart the game
  const restartGame = useCallback(() => {
    // Clear the physics world
    if (engineRef.current) {
      Matter.World.clear(engineRef.current.world, false);
      Matter.Engine.clear(engineRef.current);
    }

    // Cancel animation frame
    if (renderRef.current) {
      cancelAnimationFrame(renderRef.current);
    }

    // Clear game over check interval
    if (gameOverCheckRef.current) {
      clearInterval(gameOverCheckRef.current);
    }

    // Clear particles
    particleSystem.clear();

    // Reset state
    setGameState((prev) => ({
      score: 0,
      highScore: prev.highScore,
      isGameOver: false,
      currentUncle: getRandomSpawnableUncle(),
      nextUncle: getRandomSpawnableUncle(),
      dropX: GAME_WIDTH / 2,
      canDrop: true,
      goldenFlash: 0,
    }));

    // Reinitialize
    if (canvasRef.current) {
      initEngine();
      gameLoop();
    }
  }, [initEngine, gameLoop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (renderRef.current) {
        cancelAnimationFrame(renderRef.current);
      }
      if (gameOverCheckRef.current) {
        clearInterval(gameOverCheckRef.current);
      }
      if (engineRef.current) {
        Matter.World.clear(engineRef.current.world, false);
        Matter.Engine.clear(engineRef.current);
      }
    };
  }, []);

  return {
    gameState,
    startGame,
    restartGame,
    dropUncle,
    updateDropX,
    GAME_WIDTH,
    GAME_HEIGHT,
  };
};
