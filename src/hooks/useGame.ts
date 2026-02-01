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
  glitchFlash: number;
}

const HIGH_SCORE_KEY = 'deepmerge_highscore';
const BALL_GRACE_PERIOD_MS = 1500;

// Background animation state
let frameCount = 0;
let glitchOffset = 0;

// Background image (loaded once)
let backgroundImage: HTMLImageElement | null = null;
let backgroundLoaded = false;

// Preload background image
const loadBackgroundImage = () => {
  if (backgroundImage) return;
  backgroundImage = new Image();
  backgroundImage.onload = () => {
    backgroundLoaded = true;
  };
  backgroundImage.src = '/bg-liminal.png';
};

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
    glitchFlash: 0,
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

      const age = orbBody.createdAt ? now - orbBody.createdAt : Infinity;
      if (age < BALL_GRACE_PERIOD_MS) {
        continue;
      }

      const orbCenter = orbBody.position.y;
      if (orbCenter < GAME_OVER_LINE_Y) {
        const speed = Math.sqrt(
          orbBody.velocity.x * orbBody.velocity.x +
          orbBody.velocity.y * orbBody.velocity.y
        );
        if (speed < 2.0) {
          return true;
        }
      }
    }

    return false;
  };

  const drawLiminalBackground = (ctx: CanvasRenderingContext2D) => {
    // Draw background image if loaded
    if (backgroundLoaded && backgroundImage) {
      // Draw image to cover the entire canvas
      ctx.drawImage(backgroundImage, 0, 0, GAME_WIDTH, GAME_HEIGHT);
    } else {
      // Fallback gradient while image loads
      const bgGradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      bgGradient.addColorStop(0, '#4a3a6e');
      bgGradient.addColorStop(0.5, '#3d2b5a');
      bgGradient.addColorStop(1, '#1a1428');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Subtle scanlines overlay
    ctx.save();
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = '#000';
    for (let y = 0; y < GAME_HEIGHT; y += 2) {
      ctx.fillRect(0, y, GAME_WIDTH, 1);
    }
    ctx.restore();

    // Random glitch
    if (Math.random() < 0.01) {
      glitchOffset = (Math.random() - 0.5) * 6;
    } else {
      glitchOffset *= 0.95;
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    const state = stateRef.current;
    if (!canvas || !engine) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameCount++;

    // Apply glitch offset occasionally
    ctx.save();
    if (Math.abs(glitchOffset) > 0.5) {
      ctx.translate(glitchOffset, 0);
    }

    // Draw liminal background
    drawLiminalBackground(ctx);

    // Glitch flash effect on merge
    if (state.glitchFlash > 0) {
      ctx.fillStyle = `rgba(255, 105, 180, ${state.glitchFlash / 30 * 0.3})`;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      stateRef.current.glitchFlash = Math.max(0, state.glitchFlash - 1);
    }

    ctx.restore();

    // Game over line with glitch effect
    ctx.strokeStyle = THEME.gameOverLine;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.shadowBlur = 10;
    ctx.shadowColor = THEME.neonPink;
    ctx.beginPath();
    ctx.moveTo(0, GAME_OVER_LINE_Y);
    ctx.lineTo(GAME_WIDTH, GAME_OVER_LINE_Y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // Preview orb
    if (!state.isGameOver && state.canDrop) {
      const orb = state.currentOrb;
      ctx.globalAlpha = 0.7;

      // Guide line with neon effect
      ctx.strokeStyle = THEME.guideLine;
      ctx.shadowBlur = 5;
      ctx.shadowColor = THEME.neonCyan;
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
      ctx.font = `${Math.max(20, orb.radius * 0.7)}px Arial`;
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

      // Inner gradient for depth
      const innerGradient = ctx.createRadialGradient(
        -orb.radius * 0.3, -orb.radius * 0.3, 0,
        0, 0, orb.radius
      );
      innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      innerGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
      innerGradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
      ctx.fillStyle = innerGradient;
      ctx.fill();

      ctx.shadowBlur = 0;

      // Emoji
      ctx.fillStyle = '#000';
      ctx.font = `${Math.max(20, orb.radius * 0.7)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(orb.emoji, 0, 0);

      // Special effect for TV head (final evolution)
      if (orb.id === 10) {
        // Static noise effect
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 20; i++) {
          const nx = (Math.random() - 0.5) * orb.radius * 1.5;
          const ny = (Math.random() - 0.5) * orb.radius * 1.5;
          ctx.fillStyle = Math.random() > 0.5 ? '#FFF' : '#000';
          ctx.fillRect(nx, ny, 3, 3);
        }
        ctx.globalAlpha = 1;

        // Glowing ring
        ctx.strokeStyle = THEME.neonCyan;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = THEME.neonCyan;
        ctx.beginPath();
        ctx.arc(0, 0, orb.radius + 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }

    // Particles
    particleSystem.update();
    particleSystem.draw(ctx);

    // Next orb preview box
    const nextOrb = state.nextOrb;
    ctx.fillStyle = 'rgba(26, 10, 46, 0.8)';
    ctx.strokeStyle = THEME.neonPink;
    ctx.lineWidth = 1;
    ctx.shadowBlur = 10;
    ctx.shadowColor = THEME.neonPink;
    ctx.fillRect(GAME_WIDTH - 70, 10, 60, 60);
    ctx.strokeRect(GAME_WIDTH - 70, 10, 60, 60);
    ctx.shadowBlur = 0;

    ctx.fillStyle = THEME.neonCyan;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NEXT', GAME_WIDTH - 40, 22);

    // Mini orb preview
    ctx.shadowBlur = 8;
    ctx.shadowColor = nextOrb.glowColor;
    ctx.beginPath();
    ctx.arc(GAME_WIDTH - 40, 48, Math.min(18, nextOrb.radius * 0.4), 0, Math.PI * 2);
    ctx.fillStyle = nextOrb.color;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
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
    // Load background image
    loadBackgroundImage();

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

          const isFinalForm = nextOrb.id === 10;
          particleSystem.createMergeParticles(midX, midY, nextOrb.glowColor, isFinalForm);

          const newScore = stateRef.current.score + nextOrb.score;
          const newHighScore = Math.max(newScore, stateRef.current.highScore);

          if (newHighScore > stateRef.current.highScore) {
            localStorage.setItem(HIGH_SCORE_KEY, newHighScore.toString());
          }

          setState({
            score: newScore,
            highScore: newHighScore,
            glitchFlash: isFinalForm ? 30 : 15,
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
    frameCount = 0;
    glitchOffset = 0;

    const newState: GameState = {
      score: 0,
      highScore: stateRef.current.highScore,
      isGameOver: false,
      currentOrb: getRandomSpawnableOrb(),
      nextOrb: getRandomSpawnableOrb(),
      dropX: GAME_WIDTH / 2,
      canDrop: true,
      glitchFlash: 0,
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
