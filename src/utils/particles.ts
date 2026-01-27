// Particle effect system for merge animations - Spiritual theme

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  glowColor: string;
  type: 'orb' | 'enlightenment' | 'sparkle' | 'ring';
  rotation?: number;
  rotationSpeed?: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];

  public createMergeParticles(x: number, y: number, color: string, isEnlightenment: boolean = false): void {
    const count = isEnlightenment ? 40 : 16;
    const life = isEnlightenment ? 90 : 45;

    // Main burst particles with glow
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = isEnlightenment ? 4 + Math.random() * 5 : 2 + Math.random() * 3;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: isEnlightenment ? 10 + Math.random() * 8 : 5 + Math.random() * 4,
        color: isEnlightenment ? '#FDE68A' : color,
        glowColor: isEnlightenment ? '#FCD34D' : color,
        type: isEnlightenment ? 'enlightenment' : 'orb',
      });
    }

    // Sparkle particles floating upward
    const sparkleCount = isEnlightenment ? 30 : 10;
    for (let i = 0; i < sparkleCount; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 80,
        y: y + (Math.random() - 0.5) * 80,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 2 - 1,
        life: isEnlightenment ? 120 : 60,
        maxLife: isEnlightenment ? 120 : 60,
        size: 2 + Math.random() * 3,
        color: isEnlightenment ? '#FFFFFF' : '#E0F2FE',
        glowColor: isEnlightenment ? '#FDE68A' : '#BAE6FD',
        type: 'sparkle',
      });
    }

    // Expanding rings for enlightenment
    if (isEnlightenment) {
      for (let i = 0; i < 3; i++) {
        this.particles.push({
          x,
          y,
          vx: 0,
          vy: 0,
          life: 60 + i * 15,
          maxLife: 60 + i * 15,
          size: 20 + i * 10,
          color: '#FEF3C7',
          glowColor: '#FDE68A',
          type: 'ring',
          rotation: 0,
          rotationSpeed: 0.02 * (i % 2 === 0 ? 1 : -1),
        });
      }
    }
  }

  public update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;

      // Different gravity for different particle types
      if (p.type === 'sparkle') {
        p.vy -= 0.02; // Float upward
        p.vx *= 0.99; // Slow down horizontally
      } else if (p.type === 'ring') {
        // Rings don't move, just expand
        p.size += 2;
        if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
          p.rotation += p.rotationSpeed;
        }
      } else {
        p.vy += 0.05; // Slight gravity
        p.vx *= 0.98;
        p.vy *= 0.98;
      }

      p.life--;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.type === 'ring') {
        // Expanding ring effect
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3 * alpha;
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.glowColor;

        if (p.rotation !== undefined) {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.translate(-p.x, -p.y);
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'sparkle') {
        // Twinkling sparkle
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.glowColor;
        ctx.fillStyle = p.color;

        const twinkle = Math.sin(p.life * 0.3) * 0.5 + 0.5;
        const size = p.size * (0.5 + twinkle * 0.5);

        // Draw star shape
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const angle = (Math.PI / 2) * i;
          const outerX = p.x + Math.cos(angle) * size;
          const outerY = p.y + Math.sin(angle) * size;
          if (i === 0) {
            ctx.moveTo(outerX, outerY);
          } else {
            ctx.lineTo(outerX, outerY);
          }
          const innerAngle = angle + Math.PI / 4;
          const innerX = p.x + Math.cos(innerAngle) * size * 0.3;
          const innerY = p.y + Math.sin(innerAngle) * size * 0.3;
          ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        // Glowing orb particle
        ctx.shadowBlur = 20;
        ctx.shadowColor = p.glowColor;
        ctx.fillStyle = p.color;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright core
        ctx.globalAlpha = alpha * 0.8;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  public hasParticles(): boolean {
    return this.particles.length > 0;
  }

  public clear(): void {
    this.particles = [];
  }
}

export const particleSystem = new ParticleSystem();
