// src/index.tsx
import { createRoot } from 'react-dom/client';
import { App } from './pet-window/App';
import { SettingsPanel } from './panels/SettingsPanel';
import { TodoPanel } from './panels/TodoPanel';

const root = document.getElementById('root')!;
const hash = window.location.hash;

if (hash === '#/settings') {
  createRoot(root).render(<SettingsPanel />);
} else if (hash === '#/todo') {
  createRoot(root).render(<TodoPanel />);
} else {
  createRoot(root).render(<App />);
}
