// src/pet-window/App.tsx
import { PixelCat } from './PixelCat';
import { usePetState } from './usePetState';

declare global {
  interface Window {
    electronAPI?: {
      pet: {
        savePosition: (x: number, y: number) => void;
        loadPosition: () => Promise<{ x: number; y: number }>;
      };
      window: {
        openSettings: () => void;
      };
    };
  }
}

export function App() {
  const { state, handleClick, handleDoubleClick } = usePetState();

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'transparent',
        userSelect: 'none',
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
      onContextMenu={(e) => e.preventDefault()}
    >
      <PixelCat state={state} onClick={handleClick} onDoubleClick={handleDoubleClick} />
    </div>
  );
}
