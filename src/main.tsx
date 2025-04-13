
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeTheme } from './lib/theme-script.ts'

// Initialize theme before app renders
initializeTheme();

createRoot(document.getElementById("root")!).render(<App />);
