import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GameApp } from './ui/GameApp';
import './ui/styles/game.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameApp />
  </StrictMode>,
);
