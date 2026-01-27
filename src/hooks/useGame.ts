import { useRef, useState, useEffect } from 'react';
import Matter from 'matter-js';
import {
  ORBS,
  GAME_WIDTH,
  GAME_HEIGHT,
  WALL_THICKNESS,
  GAME_OVER_LINE_Y,
  DROP_AREA_HEIGHT,
  PHYSICS_CONFIG,
  THEME,
  getRandomSpawnableOrb,
  getNextEvolution,
} from '../constants/uncles';
import type { OrbType } from '../constants/uncles';
import { soundManager } from '../utils/sounds';
import { particleSystem } from '../utils/particles';

interface OrbBody extends Matter.Body {
  orbId?: number;
  isOrb?: boolean;
  createdAt?: number;
}

interface GameState {
  score: number;
  highScore: number;
  isGameOver: boolean;
  currentOrb: OrbType;
  nextOrb: OrbType;
  dropX: number;
  canDrop: boolean;
  goldenFlash: number;
}

const HIGH_SCORE_KEY = 'ojigame_highscore';
const BALL_GRACE_PERIOD_MS = 1500; // 1.5 second grace period per ball

// Background animation state
let backgroundRotation = 0;
let frameCount = 0;

export const useGame = () => {
  const engineRef = useRef<Matter.Engine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);

  const stateRef = useRef<GameState>({
    score: 0,
    highScore: parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10),
    isGameOver: false,
    currentOrb: getRandomSpawnableOrb(),
    nextOrb: getRandomSpawnableOrb(),
    dropX: GAME_WIDTH / 2,
    canDrop: true,
    goldenFlash: 0,
  });

  const [displayState, setDisplayState] = useState<GameState>(stateRef.current);

  const setState = (updates: Partial<GameState>) => {
    stateRef.current = { ...stateRef.current, ...updates };
    setDisplayState({ ...stateRef.current });
  };

  const createOrbBody = (x: number, y: number, orb: OrbType, alreadyInPlay: boolean = false): OrbBody => {
    const body = Matter.Bodies.circle(x, y, orb.radius, {
      friction: PHYSICS_CONFIG.friction,
      frictionStatic: PHYSICS_CONFIG.frictionStatic,
      restitution: PHYSICS_CONFIG.restitution,
      density: PHYSICS_CONFIG.density,
      label: `orb_${orb.id}`,
    }) as OrbBody;

    body.orbId = orb.id;
    body.isOrb = true;
    body.createdAt = alreadyInPlay ? 0 : Date.now();

    return body;
  };

  const checkGameOver = (): boolean => {
    if (!engineRef.current) return false;

    const now = Date.now();
    const bodies = Matter.Composite.allBodies(engineRef.current.world);

    for (const body of bodies) {
      const orbBody = body as OrbBody;
      if (!orbBody.isOrb || orbBody.orbId === undefined) continue;

      const orb = ORBS[orbBody.orbId];
      if (!orb) continue;

      // Skip balls still in grace period
      const age = orbBody.createdAt ? now - orbBody.createdAt : Infinity;
      if (age < BALL_GRACE_PERIOD_MS) {
        continue;
      }

      // Check if the CENTER of the ball is above the game over line (more lenient)
      const orbCenter = orbBody.position.y;
      if (orbCenter < GAME_OVER_LINE_Y) {
        // Ball center is above the line - check if it has settled
        const speed = Math.sqrt(
          orbBody.velocity.x * orbBody.velocity.x +
          orbBody.velocity.y * orbBody.velocity.y
        );
        // Game over if ball is moving very slowly (well settled)
        if (speed < 2.0) {
          return true;
        }
      }
    }

    return false;
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    // Deep sea gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, THEME.backgroundGradientStart);
    gradient.addColorStop(1, THEME.backgroundGradientEnd);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Rotating geometric patterns (sacred geometry style)
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = '#4A90A4';
    ctx.lineWidth = 1;

    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Outer rotating circle pattern
    ctx.translate(centerX, centerY);
    ctx.rotate(backgroundRotation * 0.5);
    ctx.translate(-centerX, -centerY);

    // Draw multiple concentric geometric shapes
    for (let ring = 0; ring < 5; ring++) {
      const radius = 80 + ring * 60;
      const points = 6 + ring * 2;

      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const angle = (Math.PI * 2 * i) / points;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Inner connecting lines
      if (ring > 0) {
        const prevRadius = 80 + (ring - 1) * 60;
        for (let i = 0; i < points; i++) {
          const angle = (Math.PI * 2 * i) / points;
          ctx.beginPath();
          ctx.moveTo(centerX + Math.cos(angle) * prevRadius, centerY + Math.sin(angle) * prevRadius);
          ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
          ctx.stroke();
        }
      }
    }

    ctx.restore();

    // Counter-rotating inner pattern
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = '#7DD3FC';
    ctx.lineWidth = 1;

    ctx.translate(centerX, centerY);
    ctx.rotate(-backgroundRotation);
    ctx.translate(-centerX, -centerY);

    // Flower of life style circles
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const x = centerX + Math.cos(angle) * 100;
      const y = centerY + Math.sin(angle) * 100;
      ctx.beginPath();
      ctx.arc(x, y, 100, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    // Floating particles in background
    ctx.save();
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 20; i++) {
      const x = (Math.sin(frameCount * 0.01 + i * 0.5) * 0.5 + 0.5) * GAME_WIDTH;
      const y = ((frameCount * 0.3 + i * 50) % (GAME_HEIGHT + 20)) - 10;
      const size = 1 + Math.sin(frameCount * 0.05 + i) * 0.5;

      ctx.fillStyle = '#7DD3FC';
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#7DD3FC';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    const state = stateRef.current;
    if (!canvas || !engine) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Update animation
    backgroundRotation += 0.002;
    frameCount++;

    // Draw background
    drawBackground(ctx);

    // Golden flash effect for enlightenment
    if (state.goldenFlash > 0) {
      ctx.fillStyle = `rgba(253, 230, 138, ${state.goldenFlash / 60 * 0.4})`;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      stateRef.current.goldenFlash = Math.max(0, state.goldenFlash - 1);
    }

    // Game over line
    ctx.strokeStyle = THEME.gameOverLine;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(0, GAME_OVER_LINE_Y);
    ctx.lineTo(GAME_WIDTH, GAME_OVER_LINE_Y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Preview orb
    if (!state.isGameOver && state.canDrop) {
      const orb = state.currentOrb;
      ctx.globalAlpha = 0.6;

      // Guide line
      ctx.strokeStyle = THEME.guideLine;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(state.dropX, DROP_AREA_HEIGHT);
      ctx.lineTo(state.dropX, GAME_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      // Preview orb with glow
      ctx.shadowBlur = THEME.glowIntensity;
      ctx.shadowColor = orb.glowColor;

      ctx.beginPath();
      ctx.arc(state.dropX, DROP_AREA_HEIGHT / 2, orb.radius, 0, Math.PI * 2);
      ctx.fillStyle = orb.color;
      ctx.fill();

      ctx.shadowBlur = 0;

      // Emoji
      ctx.fillStyle = '#000';
      ctx.font = `${Math.max(16, orb.radius * 0.8)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(orb.emoji, state.dropX, DROP_AREA_HEIGHT / 2);

      ctx.globalAlpha = 1;
    }

    // Draw all orbs
    const bodies = Matter.Composite.allBodies(engine.world);
    for (const body of bodies) {
      const orbBody = body as OrbBody;
      if (!orbBody.isOrb || orbBody.orbId === undefined) continue;

      const orb = ORBS[orbBody.orbId];
      if (!orb) continue;

      ctx.save();
      ctx.translate(orbBody.position.x, orbBody.position.y);
      ctx.rotate(orbBody.angle);

      // Glow effect
      ctx.shadowBlur = THEME.glowIntensity;
      ctx.shadowColor = orb.glowColor;

      // Main orb body
      ctx.beginPath();
      ctx.arc(0, 0, orb.radius, 0, Math.PI * 2);
      ctx.fillStyle = orb.color;
      ctx.fill();

      // Inner glow gradient
      const innerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, orb.radius);
      innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      innerGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
      innerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = innerGradient;
      ctx.fill();

      ctx.shadowBlur = 0;

      // Emoji
      ctx.fillStyle = orb.id >= 8 ? '#333' : '#000';
      ctx.font = `${Math.max(16, orb.radius * 0.8)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(orb.emoji, 0, 0);

      // Special effect for enlightenment orb
      if (orb.id === 10) {
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#FDE68A';
        ctx.beginPath();
        ctx.arc(0, 0, orb.radius + 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(253, 230, 138, 0.5)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Rotating aura
        ctx.rotate(backgroundRotation * 2);
        ctx.strokeStyle = 'rgba(253, 230, 138, 0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 * i) / 8;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * (orb.radius + 12), Math.sin(angle) * (orb.radius + 12));
          ctx.lineTo(Math.cos(angle) * (orb.radius + 25), Math.sin(angle) * (orb.radius + 25));
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    // Particles
    particleSystem.update();
    particleSystem.draw(ctx);

    // Next orb preview
    const nextOrb = state.nextOrb;
    ctx.fillStyle = 'rgba(10, 20, 40, 0.7)';
    ctx.fillRect(GAME_WIDTH - 70, 10, 60, 60);
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(GAME_WIDTH - 70, 10, 60, 60);

    ctx.fillStyle = 'rgba(125, 211, 252, 0.8)';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('NEXT', GAME_WIDTH - 40, 22);

    // Mini orb preview with glow
    ctx.shadowBlur = 8;
    ctx.shadowColor = nextOrb.glowColor;
    ctx.beginPath();
    ctx.arc(GAME_WIDTH - 40, 48, Math.min(18, nextOrb.radius * 0.45), 0, Math.PI * 2);
    ctx.fillStyle = nextOrb.color;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#000';
    ctx.font = '14px Arial';
    ctx.fillText(nextOrb.emoji, GAME_WIDTH - 40, 50);
  };

  const gameLoop = () => {
    if (!engineRef.current || stateRef.current.isGameOver) {
      return;
    }

    Matter.Engine.update(engineRef.current, 1000 / 60);
    draw();

    if (checkGameOver()) {
      setState({ isGameOver: true });
      soundManager.playGameOverSound();
      return;
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
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

    // Walls
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

    // Collision handler for merging
    Matter.Events.on(engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        const bodyA = pair.bodyA as OrbBody;
        const bodyB = pair.bodyB as OrbBody;

        if (!bodyA.isOrb || !bodyB.isOrb) continue;
        if (bodyA.orbId !== bodyB.orbId) continue;

        const orbId = bodyA.orbId!;
        const nextOrb = getNextEvolution(orbId);

        if (nextOrb && engineRef.current) {
          const midX = (bodyA.position.x + bodyB.position.x) / 2;
          const midY = (bodyA.position.y + bodyB.position.y) / 2;

          bodyA.isOrb = false;
          bodyB.isOrb = false;

          Matter.Composite.remove(engineRef.current.world, bodyA);
          Matter.Composite.remove(engineRef.current.world, bodyB);

          const newBody = createOrbBody(midX, midY, nextOrb, true);
          Matter.Composite.add(engineRef.current.world, newBody);

          soundManager.playMergeSound(ORBS[orbId].soundType);

          const isEnlightenment = nextOrb.id === 10;
          particleSystem.createMergeParticles(midX, midY, nextOrb.glowColor, isEnlightenment);

          const newScore = stateRef.current.score + nextOrb.score;
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

  const startGame = (canvas: HTMLCanvasElement) => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    canvasRef.current = canvas;
    initEngine();
    requestAnimationFrame(gameLoop);
  };

  const dropOrb = () => {
    const state = stateRef.current;
    if (!engineRef.current || !state.canDrop || state.isGameOver) return;

    const body = createOrbBody(state.dropX, DROP_AREA_HEIGHT / 2, state.currentOrb, false);
    Matter.Composite.add(engineRef.current.world, body);

    soundManager.playDropSound();

    setState({
      currentOrb: state.nextOrb,
      nextOrb: getRandomSpawnableOrb(),
      canDrop: false,
    });

    setTimeout(() => {
      setState({ canDrop: true });
    }, 500);
  };

  const updateDropX = (x: number) => {
    const orb = stateRef.current.currentOrb;
    const minX = orb.radius;
    const maxX = GAME_WIDTH - orb.radius;
    stateRef.current.dropX = Math.max(minX, Math.min(maxX, x));
  };

  const restartGame = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    particleSystem.clear();
    backgroundRotation = 0;
    frameCount = 0;

    const newState: GameState = {
      score: 0,
      highScore: stateRef.current.highScore,
      isGameOver: false,
      currentOrb: getRandomSpawnableOrb(),
      nextOrb: getRandomSpawnableOrb(),
      dropX: GAME_WIDTH / 2,
      canDrop: true,
      goldenFlash: 0,
    };
    stateRef.current = newState;
    setDisplayState({ ...newState });

    initEngine();
    requestAnimationFrame(gameLoop);
  };

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
    dropOrb,
    updateDropX,
    GAME_WIDTH,
    GAME_HEIGHT,
  };
};
