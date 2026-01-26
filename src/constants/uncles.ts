// Uncle definitions - 11 evolution stages
// Each uncle has a specific size, color, emoji representation, and score value

export interface UncleType {
  id: number;
  name: string;
  nameJa: string;
  emoji: string;
  radius: number;
  color: string;
  borderColor: string;
  score: number;
  soundType: 'light' | 'heavy' | 'enlightenment';
}

export const UNCLES: UncleType[] = [
  {
    id: 0,
    name: 'bean-uncle',
    nameJa: '豆粒おじさん',
    emoji: '👴',
    radius: 20,
    color: '#F5DEB3',
    borderColor: '#DEB887',
    score: 1,
    soundType: 'light',
  },
  {
    id: 1,
    name: 'sitting-uncle',
    nameJa: '体育座りおじさん',
    emoji: '🧘',
    radius: 28,
    color: '#FFE4B5',
    borderColor: '#DEB887',
    score: 3,
    soundType: 'light',
  },
  {
    id: 2,
    name: 'handstand-uncle',
    nameJa: '逆立ちおじさん',
    emoji: '🤸',
    radius: 36,
    color: '#FFDAB9',
    borderColor: '#CD853F',
    score: 6,
    soundType: 'light',
  },
  {
    id: 3,
    name: 'arms-crossed-uncle',
    nameJa: '腕組みおじさん',
    emoji: '🤔',
    radius: 44,
    color: '#FFD700',
    borderColor: '#DAA520',
    score: 10,
    soundType: 'light',
  },
  {
    id: 4,
    name: 'beer-belly-uncle',
    nameJa: 'ビール腹おじさん',
    emoji: '🍺',
    radius: 52,
    color: '#FFA500',
    borderColor: '#FF8C00',
    score: 15,
    soundType: 'light',
  },
  {
    id: 5,
    name: 'golf-uncle',
    nameJa: 'ゴルフスイングおじさん',
    emoji: '🏌️',
    radius: 62,
    color: '#98FB98',
    borderColor: '#32CD32',
    score: 21,
    soundType: 'heavy',
  },
  {
    id: 6,
    name: 'newspaper-uncle',
    nameJa: '新聞を読むおじさん',
    emoji: '📰',
    radius: 72,
    color: '#87CEEB',
    borderColor: '#4682B4',
    score: 28,
    soundType: 'heavy',
  },
  {
    id: 7,
    name: 'bonsai-uncle',
    nameJa: '盆栽を愛でるおじさん',
    emoji: '🌳',
    radius: 84,
    color: '#90EE90',
    borderColor: '#228B22',
    score: 36,
    soundType: 'heavy',
  },
  {
    id: 8,
    name: 'karaoke-uncle',
    nameJa: 'カラオケ熱唱おじさん',
    emoji: '🎤',
    radius: 96,
    color: '#FF69B4',
    borderColor: '#C71585',
    score: 45,
    soundType: 'heavy',
  },
  {
    id: 9,
    name: 'table-flip-uncle',
    nameJa: 'ちゃぶ台返しおじさん',
    emoji: '😡',
    radius: 110,
    color: '#FF6347',
    borderColor: '#DC143C',
    score: 55,
    soundType: 'heavy',
  },
  {
    id: 10,
    name: 'buddha-uncle',
    nameJa: '大仏おじさん',
    emoji: '🙏',
    radius: 130,
    color: '#FFD700',
    borderColor: '#B8860B',
    score: 100,
    soundType: 'enlightenment',
  },
];

// Game constants
export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 700;
export const WALL_THICKNESS = 20;
export const GAME_OVER_LINE_Y = 100; // Y position of the game over line
export const DROP_AREA_HEIGHT = 80; // Height of the drop area at top

// The maximum uncle type that can spawn (excluding the largest ones)
export const MAX_SPAWN_UNCLE_ID = 4; // Up to beer belly uncle can spawn

// Physics constants
export const PHYSICS_CONFIG = {
  friction: 0.3,
  frictionStatic: 0.5,
  restitution: 0.2,
  density: 0.001,
};

// Get uncle by ID
export const getUncleById = (id: number): UncleType | undefined => {
  return UNCLES.find((uncle) => uncle.id === id);
};

// Get next evolution uncle
export const getNextEvolution = (id: number): UncleType | undefined => {
  if (id >= UNCLES.length - 1) return undefined;
  return UNCLES[id + 1];
};

// Get random spawnable uncle
export const getRandomSpawnableUncle = (): UncleType => {
  const randomId = Math.floor(Math.random() * (MAX_SPAWN_UNCLE_ID + 1));
  return UNCLES[randomId];
};
