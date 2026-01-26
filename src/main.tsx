import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Note: StrictMode removed to prevent double-initialization issues with Matter.js
createRoot(document.getElementById('root')!).render(<App />)
