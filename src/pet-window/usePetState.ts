// src/pet-window/usePetState.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import { PetState } from './cat-pixels';

const SLEEP_TIMEOUT = 30_000; // 30s idle → sleep

export function usePetState() {
  const [state, setState] = useState<PetState>('idle');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const sleepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetSleepTimer = useCallback(() => {
    if (sleepTimer.current) clearTimeout(sleepTimer.current);
    sleepTimer.current = setTimeout(() => {
      setState('sleep');
    }, SLEEP_TIMEOUT);
  }, []);

  const handleClick = useCallback(() => {
    if (state === 'sleep') {
      setState('idle');
    } else {
      setState('clicked');
      setTimeout(() => setState('idle'), 300);
    }
    resetSleepTimer();
  }, [state, resetSleepTimer]);

  const handleDoubleClick = useCallback(() => {
    setState('happy');
    setTimeout(() => setState('idle'), 800);
    resetSleepTimer();
  }, [resetSleepTimer]);

  const handleDrag = useCallback((x: number, y: number) => {
    setPosition({ x, y });
  }, []);

  // start sleep timer on idle
  useEffect(() => {
    if (state === 'idle') resetSleepTimer();
    return () => { if (sleepTimer.current) clearTimeout(sleepTimer.current); };
  }, [state, resetSleepTimer]);

  return { state, position, handleClick, handleDoubleClick, handleDrag, setPosition };
}
