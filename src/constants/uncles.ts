// Weird Object definitions - 6 evolution stages
// Weirdcore/Traumacore theme - liminal space shopping mall aesthetic

export interface OrbType {
  id: number;
  name: string;
  displayName: string;
  emoji: string;
  radius: number;
  color: string;
  glowColor: string;
  score: number;
  soundType: 'giggle' | 'whisper' | 'distorted' | 'void';
}

// Backward compatibility alias
export type UncleType = OrbType;

export const ORBS: OrbType[] = [
  {
    id: 0,
    name: 'legged-toothbrush',
    displayName: 'Brushy',
    emoji: '🪥',
    radius: 25,
    color: '#FF69B4',
    glowColor: '#FF1493',
    score: 1,
    soundType: 'giggle',
  },
  {
    id: 1,
    name: 'eyeball-dice',
    displayName: 'Dicey',
    emoji: '🎲',
    radius: 38,
    color: '#00FFFF',
    glowColor: '#00CED1',
    score: 5,
    soundType: 'giggle',
  },
  {
    id: 2,
    name: 'floating-ear',
    displayName: 'Listener',
    emoji: '👂',
    radius: 52,
    color: '#FFB6C1',
    glowColor: '#FF69B4',
    score: 15,
    soundType: 'whisper',
  },
  {
    id: 3,
    name: 'smiling-statue',
    displayName: 'Friend',
    emoji: '🗿',
    radius: 70,
    color: '#E6E6FA',
    glowColor: '#DDA0DD',
    score: 30,
    soundType: 'whisper',
  },
  {
    id: 4,
    name: 'giant-mushroom',
    displayName: 'Funguy',
    emoji: '🍄',
    radius: 90,
    color: '#DA70D6',
    glowColor: '#BA55D3',
    score: 50,
    soundType: 'distorted',
  },
  {
    id: 5,
    name: 'tv-head',
    displayName: '???',
    emoji: '📺',
    radius: 115,
    color: '#FFFFFF',
    glowColor: '#00FFFF',
    score: 100,
    soundType: 'void',
  },
];

// Backward compatibility alias
export const UNCLES = ORBS;

// Game constants
export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 600;
export const WALL_THICKNESS = 20;
export const GAME_OVER_LINE_Y = 100;
export const DROP_AREA_HEIGHT = 80;

// The maximum orb type that can spawn (excluding the largest ones)
export const MAX_SPAWN_ORB_ID = 2;
export const MAX_SPAWN_UNCLE_ID = MAX_SPAWN_ORB_ID;

// Physics constants - sticky/gooey feel
export const PHYSICS_CONFIG = {
  friction: 0.8,
  frictionStatic: 0.9,
  restitution: 0.05,
  density: 0.002,
};

// Weirdcore/Liminal theme colors
export const THEME = {
  background: '#1a0a2e',
  backgroundGradientStart: '#2d1b4e',
  backgroundGradientEnd: '#0a0a1a',
  neonPink: '#FF69B4',
  neonCyan: '#00FFFF',
  neonPurple: '#DA70D6',
  gameOverLine: 'rgba(255, 105, 180, 0.6)',
  guideLine: 'rgba(0, 255, 255, 0.3)',
  glowIntensity: 25,
};

// Get orb by ID
export const getOrbById = (id: number): OrbType | undefined => {
  return ORBS.find((orb) => orb.id === id);
};
export const getUncleById = getOrbById;

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
export const getRandomSpawnableUncle = getRandomSpawnableOrb;
