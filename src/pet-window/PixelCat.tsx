// src/pet-window/PixelCat.tsx
import { useRef, useEffect } from 'react';
import { PetState, Frame, getAnimation, palette } from './cat-pixels';
import { useAnimation } from './useAnimation';

const PIXEL_SIZE = 16;   // source pixels
const SCALE = 8;         // display scale → 128×128

interface Props {
  state: PetState;
  onClick: () => void;
  onDoubleClick: () => void;
}

function renderFrame(ctx: CanvasRenderingContext2D, frame: Frame) {
  const imageData = ctx.createImageData(PIXEL_SIZE, PIXEL_SIZE);
  for (let y = 0; y < PIXEL_SIZE; y++) {
    for (let x = 0; x < PIXEL_SIZE; x++) {
      const colorIdx = frame[y][x];
      const [r, g, b, a] = palette[colorIdx];
      const idx = (y * PIXEL_SIZE + x) * 4;
      imageData.data[idx] = r;
      imageData.data[idx + 1] = g;
      imageData.data[idx + 2] = b;
      imageData.data[idx + 3] = a;
    }
  }
  // draw unscaled raw pixels to offscreen
  const offscreen = new OffscreenCanvas(PIXEL_SIZE, PIXEL_SIZE);
  const offCtx = offscreen.getContext('2d')!;
  offCtx.putImageData(imageData, 0, 0);
  // scale and draw to main canvas with pixel-art rendering (no smoothing)
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, PIXEL_SIZE * SCALE, PIXEL_SIZE * SCALE);
  ctx.drawImage(offscreen, 0, 0, PIXEL_SIZE * SCALE, PIXEL_SIZE * SCALE);
}

export function PixelCat({ state, onClick, onDoubleClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { frameIndex, start } = useAnimation();

  useEffect(() => {
    const anim = getAnimation(state);
    start(anim.frames, anim.interval);
  }, [state, start]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const anim = getAnimation(state);
    renderFrame(ctx, anim.frames[frameIndex]);
  }, [state, frameIndex]);

  // double-click detection via manual counter
  const clickCount = useRef(0);
  const handleClick = () => {
    clickCount.current++;
    if (clickCount.current === 2) {
      onDoubleClick();
      clickCount.current = 0;
    } else {
      setTimeout(() => {
        if (clickCount.current === 1) onClick();
        clickCount.current = 0;
      }, 250);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={PIXEL_SIZE * SCALE}
      height={PIXEL_SIZE * SCALE}
      style={{ cursor: 'pointer', display: 'block' }}
      onClick={handleClick}
    />
  );
}
