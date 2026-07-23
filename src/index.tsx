// src/index.tsx
import { createRoot } from 'react-dom/client';
import { App } from './pet-window/App';
import { SettingsPanel } from './panels/SettingsPanel';

const root = document.getElementById('root')!;
const hash = window.location.hash;

if (hash === '#/settings') {
  createRoot(root).render(<SettingsPanel />);
} else {
  createRoot(root).render(<App />);
}
