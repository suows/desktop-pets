// src/pet-window/App.tsx
import { useEffect, useRef, useCallback } from 'react';
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
  const { state, position, handleClick, handleDoubleClick, handleDrag, setPosition } = usePetState();
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  // load saved position on mount
  useEffect(() => {
    window.electronAPI?.pet.loadPosition().then(pos => {
      setPosition(pos);
    });
  }, [setPosition]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    offset.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - offset.current.x;
    const dy = e.clientY - offset.current.y;
    handleDrag(position.x + dx, position.y + dy);
    offset.current = { x: e.clientX, y: e.clientY };
  }, [position, handleDrag]);

  const onMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    window.electronAPI?.pet.savePosition(position.x, position.y);
  }, [position]);

  return (
    <div
      style={{ width: '100vw', height: '100vh', background: 'transparent', userSelect: 'none' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <PixelCat state={state} onClick={handleClick} onDoubleClick={handleDoubleClick} />
    </div>
  );
}
