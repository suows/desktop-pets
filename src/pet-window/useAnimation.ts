// src/pet-window/useAnimation.ts
import { useRef, useState, useEffect, useCallback } from 'react';
import { Frame } from './cat-pixels';

export function useAnimation() {
  const [frameIndex, setFrameIndex] = useState(0);
  const timerRef = useRef<number | null>(null);
  const framesRef = useRef<Frame[]>([]);
  const intervalRef = useRef(800);

  const start = useCallback((frames: Frame[], interval: number) => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    framesRef.current = frames;
    intervalRef.current = interval;
    setFrameIndex(0);
    let lastTime = performance.now();
    let idx = 0;
    function tick(now: number) {
      if (now - lastTime >= intervalRef.current) {
        idx = (idx + 1) % framesRef.current.length;
        setFrameIndex(idx);
        lastTime = now;
      }
      timerRef.current = requestAnimationFrame(tick);
    }
    timerRef.current = requestAnimationFrame(tick);
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // cleanup on unmount
  useEffect(() => () => stop(), [stop]);

  return { frameIndex, start, stop };
}
