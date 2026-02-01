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
    const vanishX = GAME_WIDTH / 2;
    const vanishY = 180;
    const time = frameCount * 0.015;

    // Main background - purple/magenta gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    bgGradient.addColorStop(0, '#4a3a6e');
    bgGradient.addColorStop(0.3, '#3d2b5a');
    bgGradient.addColorStop(0.6, '#2a1f42');
    bgGradient.addColorStop(1, '#1a1428');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Ceiling area - lighter purple
    ctx.fillStyle = '#5a4a7a';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(GAME_WIDTH, 0);
    ctx.lineTo(vanishX + 80, vanishY - 40);
    ctx.lineTo(vanishX - 80, vanishY - 40);
    ctx.closePath();
    ctx.fill();

    // Left wall (store fronts)
    const leftWallGradient = ctx.createLinearGradient(0, 0, 80, 0);
    leftWallGradient.addColorStop(0, '#2a2040');
    leftWallGradient.addColorStop(1, '#3a2a50');
    ctx.fillStyle = leftWallGradient;
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.lineTo(80, vanishY);
    ctx.lineTo(80, GAME_HEIGHT);
    ctx.lineTo(0, GAME_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Right wall (store fronts)
    const rightWallGradient = ctx.createLinearGradient(GAME_WIDTH - 80, 0, GAME_WIDTH, 0);
    rightWallGradient.addColorStop(0, '#3a2a50');
    rightWallGradient.addColorStop(1, '#2a2040');
    ctx.fillStyle = rightWallGradient;
    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH, 60);
    ctx.lineTo(GAME_WIDTH - 80, vanishY);
    ctx.lineTo(GAME_WIDTH - 80, GAME_HEIGHT);
    ctx.lineTo(GAME_WIDTH, GAME_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Store windows on left (dark rectangles)
    ctx.fillStyle = '#0a0810';
    for (let i = 0; i < 3; i++) {
      const y = 200 + i * 140;
      ctx.fillRect(5, y, 60, 100);
    }

    // Store windows on right (dark rectangles)
    for (let i = 0; i < 3; i++) {
      const y = 200 + i * 140;
      ctx.fillRect(GAME_WIDTH - 65, y, 60, 100);
    }

    // Floor with perspective tiles
    const floorGradient = ctx.createLinearGradient(0, vanishY + 50, 0, GAME_HEIGHT);
    floorGradient.addColorStop(0, '#2a2545');
    floorGradient.addColorStop(1, '#1a1525');
    ctx.fillStyle = floorGradient;
    ctx.beginPath();
    ctx.moveTo(80, vanishY);
    ctx.lineTo(GAME_WIDTH - 80, vanishY);
    ctx.lineTo(GAME_WIDTH, GAME_HEIGHT);
    ctx.lineTo(0, GAME_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Floor grid lines
    ctx.strokeStyle = 'rgba(100, 80, 140, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 12; i++) {
      const ratio = i / 12;
      const y = vanishY + (GAME_HEIGHT - vanishY) * ratio;
      const leftX = 80 - (80 * ratio);
      const rightX = GAME_WIDTH - 80 + (80 * ratio);
      ctx.beginPath();
      ctx.moveTo(leftX, y);
      ctx.lineTo(rightX, y);
      ctx.stroke();
    }

    // Vertical floor lines converging
    for (let i = 0; i <= 10; i++) {
      const bottomX = (GAME_WIDTH / 10) * i;
      ctx.beginPath();
      ctx.moveTo(vanishX, vanishY);
      ctx.lineTo(bottomX, GAME_HEIGHT);
      ctx.stroke();
    }

    // Cyan neon ceiling lines
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00FFFF';
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 3;

    // Main ceiling lines converging to center
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(vanishX - 60, vanishY - 30);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH, 50);
    ctx.lineTo(vanishX + 60, vanishY - 30);
    ctx.stroke();

    // Inner ceiling lines
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 70);
    ctx.lineTo(vanishX - 40, vanishY - 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH - 40, 70);
    ctx.lineTo(vanishX + 40, vanishY - 20);
    ctx.stroke();
    ctx.restore();

    // Pink neon accents on walls
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#FF69B4';
    ctx.strokeStyle = '#FF69B4';
    ctx.lineWidth = 2;

    // Left wall pink line
    ctx.beginPath();
    ctx.moveTo(70, 150);
    ctx.lineTo(70, GAME_HEIGHT);
    ctx.stroke();

    // Right wall pink line
    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH - 70, 150);
    ctx.lineTo(GAME_WIDTH - 70, GAME_HEIGHT);
    ctx.stroke();
    ctx.restore();

    // Vertical cyan neon on store fronts
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00FFFF';
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(15, 180);
    ctx.lineTo(15, GAME_HEIGHT);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH - 15, 180);
    ctx.lineTo(GAME_WIDTH - 15, GAME_HEIGHT);
    ctx.stroke();
    ctx.restore();

    // Party bunting/flags
    ctx.save();
    const flagColors = ['#FF69B4', '#00FFFF', '#FFD700', '#FF6B6B', '#9B59B6'];
    for (let i = 0; i < 8; i++) {
      const x = 60 + i * 40;
      const sag = Math.sin((i / 7) * Math.PI) * 15;
      ctx.fillStyle = flagColors[i % flagColors.length];
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(x, 110 + sag);
      ctx.lineTo(x + 12, 110 + sag);
      ctx.lineTo(x + 6, 130 + sag);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Disco ball
    ctx.save();
    ctx.globalAlpha = 0.8;
    const gradient = ctx.createRadialGradient(vanishX, 60, 0, vanishX, 60, 18);
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.5, '#C0C0C0');
    gradient.addColorStop(1, '#808080');
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(vanishX, 60, 15, 0, Math.PI * 2);
    ctx.fill();

    // Disco ball reflections
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 6; i++) {
      const angle = time * 2 + (i * Math.PI / 3);
      const length = 50 + Math.sin(time + i) * 20;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(vanishX, 60);
      ctx.lineTo(
        vanishX + Math.cos(angle) * length,
        60 + Math.sin(angle) * length * 0.5
      );
      ctx.stroke();
    }
    ctx.restore();

    // Floating kawaii elements
    ctx.save();

    // Hearts (pink)
    ctx.fillStyle = '#FF69B4';
    ctx.globalAlpha = 0.7;
    ctx.font = '18px Arial';
    ctx.fillText('♥', 30 + Math.sin(time) * 8, 250 + Math.cos(time * 0.8) * 10);
    ctx.fillText('♥', 350 + Math.sin(time + 2) * 8, 200 + Math.cos(time * 0.7) * 12);
    ctx.font = '14px Arial';
    ctx.fillText('♥', 120 + Math.sin(time + 1) * 6, 300 + Math.cos(time * 0.9) * 8);

    // Stars (yellow)
    ctx.fillStyle = '#FFD700';
    ctx.globalAlpha = 0.8;
    ctx.font = '16px Arial';
    ctx.fillText('★', 50 + Math.sin(time + 0.5) * 6, 150 + Math.cos(time * 0.6) * 8);
    ctx.fillText('☆', 320 + Math.sin(time + 1.5) * 6, 280 + Math.cos(time * 0.5) * 10);
    ctx.font = '12px Arial';
    ctx.fillText('★', 280 + Math.sin(time + 3) * 5, 160 + Math.cos(time * 0.7) * 6);

    // Clouds (cyan)
    ctx.fillStyle = '#87CEEB';
    ctx.globalAlpha = 0.6;
    ctx.font = '20px Arial';
    ctx.fillText('☁', 300 + Math.sin(time * 0.4) * 10, 140 + Math.cos(time * 0.3) * 5);
    ctx.font = '16px Arial';
    ctx.fillText('☁', 100 + Math.sin(time * 0.5 + 1) * 8, 180 + Math.cos(time * 0.4) * 6);

    // Moon/circle
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#E8E0F0';
    ctx.beginPath();
    ctx.arc(330 + Math.sin(time * 0.3) * 5, 120 + Math.cos(time * 0.2) * 3, 15, 0, Math.PI * 2);
    ctx.fill();

    // Japanese katakana scattered
    ctx.fillStyle = 'rgba(200, 180, 220, 0.4)';
    ctx.font = '14px Arial';
    const kataChars = ['カ', 'ワ', 'イ', 'ク', 'ラ', 'ユ', 'メ', 'コ'];
    kataChars.forEach((char, i) => {
      const x = 40 + (i % 4) * 90 + Math.sin(time + i * 0.5) * 5;
      const y = 220 + Math.floor(i / 4) * 150 + Math.cos(time * 0.4 + i) * 8;
      ctx.fillText(char, x, y);
    });
    ctx.restore();

    // Sparkles/particles
    ctx.save();
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 30; i++) {
      const sparkleX = (Math.sin(time * 0.5 + i * 1.3) * 0.5 + 0.5) * GAME_WIDTH;
      const sparkleY = (Math.cos(time * 0.3 + i * 0.9) * 0.5 + 0.5) * GAME_HEIGHT;
      const size = 1 + Math.sin(time * 2 + i) * 0.5;
      const colors = ['#FFFFFF', '#FF69B4', '#00FFFF', '#FFD700'];
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(sparkleX, sparkleY, size, size);
    }
    ctx.restore();

    // Subtle scanlines
    ctx.save();
    ctx.globalAlpha = 0.04;
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
