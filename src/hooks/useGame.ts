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
  dropTime?: number;
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
const GAME_OVER_GRACE_PERIOD = 2000; // 2 seconds grace period

export const useGame = () => {
  const engineRef = useRef<Matter.Engine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const gameStartTimeRef = useRef<number>(0);
  const isInitializedRef = useRef(false);

  const stateRef = useRef<GameState>({
    score: 0,
    highScore: parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10),
    isGameOver: false,
    currentUncle: getRandomSpawnableUncle(),
    nextUncle: getRandomSpawnableUncle(),
    dropX: GAME_WIDTH / 2,
    canDrop: true,
    goldenFlash: 0,
  });

  const [displayState, setDisplayState] = useState<GameState>(stateRef.current);

  const setState = useCallback((updates: Partial<GameState>) => {
    stateRef.current = { ...stateRef.current, ...updates };
    setDisplayState({ ...stateRef.current });
  }, []);

  const createUncleBody = (x: number, y: number, uncle: UncleType): UncleBody => {
    const body = Matter.Bodies.circle(x, y, uncle.radius, {
      friction: PHYSICS_CONFIG.friction,
      frictionStatic: PHYSICS_CONFIG.frictionStatic,
      restitution: PHYSICS_CONFIG.restitution,
      density: PHYSICS_CONFIG.density,
      label: `uncle_${uncle.id}`,
    }) as UncleBody;

    body.uncleId = uncle.id;
    body.isUncle = true;
    body.dropTime = Date.now();

    return body;
  };

  const checkGameOver = (): boolean => {
    if (!engineRef.current) return false;

    const now = Date.now();

    // Don't check during initial grace period
    if (now - gameStartTimeRef.current < GAME_OVER_GRACE_PERIOD) {
      return false;
    }

    const bodies = Matter.Composite.allBodies(engineRef.current.world);

    for (const body of bodies) {
      const uncleBody = body as UncleBody;
      if (!uncleBody.isUncle || uncleBody.uncleId === undefined) continue;

      const uncle = UNCLES[uncleBody.uncleId];
      if (!uncle) continue;

      // Skip recently dropped balls (1.5 second grace per ball)
      if (uncleBody.dropTime && now - uncleBody.dropTime < 1500) {
        continue;
      }

      const uncleTop = uncleBody.position.y - uncle.radius;
      if (uncleTop < GAME_OVER_LINE_Y) {
        const speed = Math.sqrt(
          uncleBody.velocity.x * uncleBody.velocity.x +
          uncleBody.velocity.y * uncleBody.velocity.y
        );
        if (speed < 1.0) {
          return true;
        }
      }
    }
    return false;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    const state = stateRef.current;
    if (!canvas || !engine) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#E8E0D0';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (state.goldenFlash > 0) {
      ctx.fillStyle = `rgba(255, 215, 0, ${state.goldenFlash / 60 * 0.5})`;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      stateRef.current.goldenFlash = Math.max(0, state.goldenFlash - 1);
    }

    ctx.strokeStyle = '#D0C8B8';
    ctx.lineWidth = 2;
    for (let y = 150; y < GAME_HEIGHT; y += 100) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_WIDTH, y);
      ctx.stroke();
    }

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

    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(0, GAME_OVER_LINE_Y);
    ctx.lineTo(GAME_WIDTH, GAME_OVER_LINE_Y);
    ctx.stroke();
    ctx.setLineDash([]);

    if (!state.isGameOver && state.canDrop) {
      const uncle = state.currentUncle;
      ctx.globalAlpha = 0.5;

      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(state.dropX, DROP_AREA_HEIGHT);
      ctx.lineTo(state.dropX, GAME_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(state.dropX, DROP_AREA_HEIGHT / 2, uncle.radius, 0, Math.PI * 2);
      ctx.fillStyle = uncle.color;
      ctx.fill();
      ctx.strokeStyle = uncle.borderColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#000';
      ctx.font = `${Math.max(16, uncle.radius * 0.8)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(uncle.emoji, state.dropX, DROP_AREA_HEIGHT / 2);

      ctx.globalAlpha = 1;
    }

    const bodies = Matter.Composite.allBodies(engine.world);

    for (const body of bodies) {
      const uncleBody = body as UncleBody;
      if (!uncleBody.isUncle || uncleBody.uncleId === undefined) continue;

      const uncle = UNCLES[uncleBody.uncleId];
      if (!uncle) continue;

      ctx.save();
      ctx.translate(uncleBody.position.x, uncleBody.position.y);
      ctx.rotate(uncleBody.angle);

      ctx.beginPath();
      ctx.arc(0, 0, uncle.radius, 0, Math.PI * 2);
      ctx.fillStyle = uncle.color;
      ctx.fill();
      ctx.strokeStyle = uncle.borderColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#000';
      ctx.font = `${Math.max(16, uncle.radius * 0.8)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(uncle.emoji, 0, 0);

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

    particleSystem.update();
    particleSystem.draw(ctx);

    const nextUncle = state.nextUncle;
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
  };

  const gameLoopRef = useRef<() => void>(() => {});

  gameLoopRef.current = () => {
    if (!engineRef.current) return;

    Matter.Engine.update(engineRef.current, 1000 / 60);
    draw();

    if (!stateRef.current.isGameOver && checkGameOver()) {
      setState({ isGameOver: true });
      soundManager.playGameOverSound();
    }

    animationFrameRef.current = requestAnimationFrame(() => gameLoopRef.current?.());
  };

  const initEngine = () => {
    if (engineRef.current) {
      Matter.World.clear(engineRef.current.world, false);
      Matter.Engine.clear(engineRef.current);
    }

    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 1 },
    });

    engineRef.current = engine;

    const walls = [
      Matter.Bodies.rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT + WALL_THICKNESS / 2,
        GAME_WIDTH + WALL_THICKNESS * 2,
        WALL_THICKNESS,
        { isStatic: true, label: 'wall_bottom' }
      ),
      Matter.Bodies.rectangle(
        -WALL_THICKNESS / 2,
        GAME_HEIGHT / 2,
        WALL_THICKNESS,
        GAME_HEIGHT,
        { isStatic: true, label: 'wall_left' }
      ),
      Matter.Bodies.rectangle(
        GAME_WIDTH + WALL_THICKNESS / 2,
        GAME_HEIGHT / 2,
        WALL_THICKNESS,
        GAME_HEIGHT,
        { isStatic: true, label: 'wall_right' }
      ),
    ];

    Matter.Composite.add(engine.world, walls);

    Matter.Events.on(engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        const bodyA = pair.bodyA as UncleBody;
        const bodyB = pair.bodyB as UncleBody;

        if (!bodyA.isUncle || !bodyB.isUncle) continue;
        if (bodyA.uncleId !== bodyB.uncleId) continue;

        const uncleId = bodyA.uncleId!;
        const nextUncle = getNextEvolution(uncleId);

        if (nextUncle && engineRef.current) {
          const midX = (bodyA.position.x + bodyB.position.x) / 2;
          const midY = (bodyA.position.y + bodyB.position.y) / 2;

          bodyA.isUncle = false;
          bodyB.isUncle = false;

          Matter.Composite.remove(engineRef.current.world, bodyA);
          Matter.Composite.remove(engineRef.current.world, bodyB);

          const newBody = createUncleBody(midX, midY, nextUncle);
          newBody.dropTime = 0;
          Matter.Composite.add(engineRef.current.world, newBody);

          const currentUncle = UNCLES[uncleId];
          soundManager.playMergeSound(currentUncle.soundType);

          const isEnlightenment = nextUncle.id === 10;
          particleSystem.createMergeParticles(midX, midY, nextUncle.color, isEnlightenment);

          const newScore = stateRef.current.score + nextUncle.score;
          const newHighScore = Math.max(newScore, stateRef.current.highScore);

          if (newHighScore > stateRef.current.highScore) {
            localStorage.setItem(HIGH_SCORE_KEY, newHighScore.toString());
          }

          setState({
            score: newScore,
            highScore: newHighScore,
            goldenFlash: isEnlightenment ? 60 : stateRef.current.goldenFlash,
          });
        }
      }
    });
  };

  const startGame = useCallback((canvas: HTMLCanvasElement) => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    canvasRef.current = canvas;
    gameStartTimeRef.current = Date.now();
    initEngine();
    gameLoopRef.current?.();
  }, []);

  const dropUncle = useCallback(() => {
    const state = stateRef.current;
    if (!engineRef.current || !state.canDrop || state.isGameOver) return;

    const body = createUncleBody(state.dropX, DROP_AREA_HEIGHT / 2, state.currentUncle);
    Matter.Composite.add(engineRef.current.world, body);

    soundManager.playDropSound();

    setState({
      currentUncle: state.nextUncle,
      nextUncle: getRandomSpawnableUncle(),
      canDrop: false,
    });

    setTimeout(() => {
      setState({ canDrop: true });
    }, 500);
  }, [setState]);

  const updateDropX = useCallback((x: number) => {
    const uncle = stateRef.current.currentUncle;
    const minX = uncle.radius;
    const maxX = GAME_WIDTH - uncle.radius;
    stateRef.current.dropX = Math.max(minX, Math.min(maxX, x));
  }, []);

  const restartGame = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    particleSystem.clear();
    isInitializedRef.current = false;

    const newState: GameState = {
      score: 0,
      highScore: stateRef.current.highScore,
      isGameOver: false,
      currentUncle: getRandomSpawnableUncle(),
      nextUncle: getRandomSpawnableUncle(),
      dropX: GAME_WIDTH / 2,
      canDrop: true,
      goldenFlash: 0,
    };
    stateRef.current = newState;
    setDisplayState({ ...newState });

    gameStartTimeRef.current = Date.now();
    isInitializedRef.current = true;
    initEngine();
    gameLoopRef.current?.();
  }, []);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (engineRef.current) {
        Matter.World.clear(engineRef.current.world, false);
        Matter.Engine.clear(engineRef.current);
      }
    };
  }, []);

  return {
    gameState: displayState,
    startGame,
    restartGame,
    dropUncle,
    updateDropX,
    GAME_WIDTH,
    GAME_HEIGHT,
  };
};
