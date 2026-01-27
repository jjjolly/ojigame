// Soul Orb definitions - 11 evolution stages
// Deep Sea Spiritual theme - each orb represents a stage of spiritual awakening

export interface OrbType {
  id: number;
  name: string;
  displayName: string;
  emoji: string;
  radius: number;
  color: string;
  glowColor: string;
  score: number;
  soundType: 'light' | 'medium' | 'deep' | 'enlightenment';
}

// Backward compatibility alias
export type UncleType = OrbType;

export const ORBS: OrbType[] = [
  {
    id: 0,
    name: 'bubble',
    displayName: 'Bubble',
    emoji: '🫧',
    radius: 20,
    color: '#E0F2FE',
    glowColor: '#BAE6FD',
    score: 1,
    soundType: 'light',
  },
  {
    id: 1,
    name: 'droplet',
    displayName: 'Droplet',
    emoji: '💧',
    radius: 28,
    color: '#BAE6FD',
    glowColor: '#7DD3FC',
    score: 3,
    soundType: 'light',
  },
  {
    id: 2,
    name: 'lotus-sprout',
    displayName: 'Sprout',
    emoji: '🌱',
    radius: 36,
    color: '#5EEAD4',
    glowColor: '#2DD4BF',
    score: 6,
    soundType: 'light',
  },
  {
    id: 3,
    name: 'lotus',
    displayName: 'Lotus',
    emoji: '🪷',
    radius: 44,
    color: '#F9A8D4',
    glowColor: '#F472B6',
    score: 10,
    soundType: 'light',
  },
  {
    id: 4,
    name: 'om',
    displayName: 'Om',
    emoji: 'ॐ',
    radius: 52,
    color: '#FDE047',
    glowColor: '#FACC15',
    score: 15,
    soundType: 'medium',
  },
  {
    id: 5,
    name: 'mudra',
    displayName: 'Mudra',
    emoji: '🫱',
    radius: 62,
    color: '#818CF8',
    glowColor: '#6366F1',
    score: 21,
    soundType: 'medium',
  },
  {
    id: 6,
    name: 'third-eye',
    displayName: 'Third Eye',
    emoji: '👁️',
    radius: 72,
    color: '#A855F7',
    glowColor: '#9333EA',
    score: 28,
    soundType: 'medium',
  },
  {
    id: 7,
    name: 'mandala',
    displayName: 'Mandala',
    emoji: '🔆',
    radius: 84,
    color: '#FB923C',
    glowColor: '#F97316',
    score: 36,
    soundType: 'deep',
  },
  {
    id: 8,
    name: 'light-particle',
    displayName: 'Light',
    emoji: '✨',
    radius: 96,
    color: '#FFFFFF',
    glowColor: '#E0E7FF',
    score: 45,
    soundType: 'deep',
  },
  {
    id: 9,
    name: 'infinity',
    displayName: 'Infinity',
    emoji: '♾️',
    radius: 110,
    color: '#FDE68A',
    glowColor: '#FCD34D',
    score: 55,
    soundType: 'deep',
  },
  {
    id: 10,
    name: 'enlightenment',
    displayName: 'Nirvana',
    emoji: '👁‍🗨',
    radius: 130,
    color: '#FEF3C7',
    glowColor: '#FDE68A',
    score: 100,
    soundType: 'enlightenment',
  },
];

// Backward compatibility alias
export const UNCLES = ORBS;

// Game constants
export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 600; // Reduced to make room for ad
export const WALL_THICKNESS = 20;
export const GAME_OVER_LINE_Y = 100;
export const DROP_AREA_HEIGHT = 80;

// The maximum orb type that can spawn (excluding the largest ones)
export const MAX_SPAWN_ORB_ID = 4;
export const MAX_SPAWN_UNCLE_ID = MAX_SPAWN_ORB_ID; // Backward compatibility

// Physics constants
export const PHYSICS_CONFIG = {
  friction: 0.3,
  frictionStatic: 0.5,
  restitution: 0.2,
  density: 0.001,
};

// Deep sea theme colors
export const THEME = {
  background: '#050b1a',
  backgroundGradientStart: '#050b1a',
  backgroundGradientEnd: '#0c1929',
  gameOverLine: 'rgba(255, 100, 100, 0.6)',
  guideLine: 'rgba(255, 255, 255, 0.15)',
  glowIntensity: 20,
};

// Get orb by ID
export const getOrbById = (id: number): OrbType | undefined => {
  return ORBS.find((orb) => orb.id === id);
};
export const getUncleById = getOrbById; // Backward compatibility

// Get next evolution orb
export const getNextEvolution = (id: number): OrbType | undefined => {
  if (id >= ORBS.length - 1) return undefined;
  return ORBS[id + 1];
};

// Get random spawnable orb
export const getRandomSpawnableOrb = (): OrbType => {
  const randomId = Math.floor(Math.random() * (MAX_SPAWN_ORB_ID + 1));
  return ORBS[randomId];
};
export const getRandomSpawnableUncle = getRandomSpawnableOrb; // Backward compatibility
