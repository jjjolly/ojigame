// Weird Object definitions - 11 evolution stages
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
    name: 'eyeball',
    displayName: 'Blinky',
    emoji: '👁️',
    radius: 20,
    color: '#FF69B4',
    glowColor: '#FF1493',
    score: 1,
    soundType: 'giggle',
  },
  {
    id: 1,
    name: 'tooth',
    displayName: 'Toothy',
    emoji: '🦷',
    radius: 28,
    color: '#E0FFFF',
    glowColor: '#00FFFF',
    score: 3,
    soundType: 'giggle',
  },
  {
    id: 2,
    name: 'ear',
    displayName: 'Listener',
    emoji: '👂',
    radius: 36,
    color: '#FFB6C1',
    glowColor: '#FF69B4',
    score: 6,
    soundType: 'giggle',
  },
  {
    id: 3,
    name: 'nose',
    displayName: 'Sniffy',
    emoji: '👃',
    radius: 44,
    color: '#DDA0DD',
    glowColor: '#DA70D6',
    score: 10,
    soundType: 'whisper',
  },
  {
    id: 4,
    name: 'lips',
    displayName: 'Kissy',
    emoji: '👄',
    radius: 52,
    color: '#FF6B6B',
    glowColor: '#FF4757',
    score: 15,
    soundType: 'whisper',
  },
  {
    id: 5,
    name: 'hand',
    displayName: 'Grabby',
    emoji: '🫳',
    radius: 62,
    color: '#FFEAA7',
    glowColor: '#FDCB6E',
    score: 21,
    soundType: 'whisper',
  },
  {
    id: 6,
    name: 'brain',
    displayName: 'Thinky',
    emoji: '🧠',
    radius: 72,
    color: '#FF9FF3',
    glowColor: '#F368E0',
    score: 28,
    soundType: 'distorted',
  },
  {
    id: 7,
    name: 'statue',
    displayName: 'Friend',
    emoji: '🗿',
    radius: 84,
    color: '#A0A0A0',
    glowColor: '#808080',
    score: 36,
    soundType: 'distorted',
  },
  {
    id: 8,
    name: 'mushroom',
    displayName: 'Funguy',
    emoji: '🍄',
    radius: 96,
    color: '#DA70D6',
    glowColor: '#BA55D3',
    score: 45,
    soundType: 'distorted',
  },
  {
    id: 9,
    name: 'crystal-ball',
    displayName: 'Oracle',
    emoji: '🔮',
    radius: 110,
    color: '#9B59B6',
    glowColor: '#8E44AD',
    score: 55,
    soundType: 'void',
  },
  {
    id: 10,
    name: 'tv-head',
    displayName: '???',
    emoji: '📺',
    radius: 130,
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
export const MAX_SPAWN_ORB_ID = 4;
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
