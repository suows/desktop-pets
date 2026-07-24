// src/pet-window/App.tsx
import { PixelCat } from './PixelCat';
import { usePetState } from './usePetState';

declare global {
  interface Window {
    electronAPI?: {
      window: {
        openSettings: () => void;
        openTodo: () => void;
      };
      todo: {
        list: () => Promise<Array<{ id: string; text: string; done: boolean; createdAt: string }>>;
        add: (text: string) => void;
        toggle: (id: string) => void;
        delete: (id: string) => void;
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
