// Particle effect system for merge animations

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'normal' | 'enlightenment';
}

export class ParticleSystem {
  private particles: Particle[] = [];

  public createMergeParticles(x: number, y: number, color: string, isEnlightenment: boolean = false): void {
    const count = isEnlightenment ? 30 : 12;
    const life = isEnlightenment ? 60 : 30;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = isEnlightenment ? 3 + Math.random() * 4 : 2 + Math.random() * 2;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: isEnlightenment ? 8 + Math.random() * 6 : 4 + Math.random() * 3,
        color: isEnlightenment ? '#FFD700' : color,
        type: isEnlightenment ? 'enlightenment' : 'normal',
      });
    }

    // Add sparkle particles for enlightenment
    if (isEnlightenment) {
      for (let i = 0; i < 20; i++) {
        this.particles.push({
          x: x + (Math.random() - 0.5) * 100,
          y: y + (Math.random() - 0.5) * 100,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 3 - 1,
          life: 90,
          maxLife: 90,
          size: 3 + Math.random() * 4,
          color: Math.random() > 0.5 ? '#FFFFFF' : '#FFD700',
          type: 'enlightenment',
        });
      }
    }
  }

  public update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // Gravity
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

      if (p.type === 'enlightenment') {
        // Glowing effect for enlightenment particles
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
      }

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();

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
