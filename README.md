# OjiGame - おじさん積み上げパズル

A Suika Game-style physics puzzle game featuring "uncles" (ojisan). Stack and merge uncles to evolve them through 11 stages!

## Game Overview

- Drop uncles from the top of the screen
- Same type uncles merge into a larger, evolved uncle
- Score points when uncles merge
- Game over when uncles overflow past the danger line

## Evolution Stages (11 levels)

1. 👴 豆粒おじさん (Bean Uncle) - Smallest
2. 🧘 体育座りおじさん (Sitting Uncle)
3. 🤸 逆立ちおじさん (Handstand Uncle)
4. 🤔 腕組みおじさん (Arms-Crossed Uncle)
5. 🍺 ビール腹おじさん (Beer Belly Uncle)
6. 🏌️ ゴルフスイングおじさん (Golf Uncle)
7. 📰 新聞を読むおじさん (Newspaper Uncle)
8. 🌳 盆栽を愛でるおじさん (Bonsai Uncle)
9. 🎤 カラオケ熱唱おじさん (Karaoke Uncle)
10. 😡 ちゃぶ台返しおじさん (Table Flip Uncle)
11. 🙏 大仏おじさん (Buddha Uncle) - Largest!

## How to Play

1. **Move**: Touch/drag to position the uncle
2. **Drop**: Release to drop the uncle
3. **Merge**: Match same uncles to evolve
4. **Goal**: Get the highest score!

## Tech Stack

- React 18
- TypeScript
- Matter.js (Physics)
- Vite (Build)
- PWA (Progressive Web App)

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## PWA Features

- Install to home screen
- Offline support
- Portrait mode optimized

## Customization

Uncle images can be replaced by modifying `src/constants/uncles.ts`. The current implementation uses emojis as placeholders.

## License

MIT
