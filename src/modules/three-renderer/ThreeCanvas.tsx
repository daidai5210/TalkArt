/**
 * @module three-renderer/ThreeCanvas
 * React wrapper that mounts a Three.js WebGL renderer.
 */

import React, { useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { getThreeManager } from './ThreeManager';

interface ThreeCanvasProps {
  className?: string;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWidth = useStore((s) => s.canvasWidth);
  const canvasHeight = useStore((s) => s.canvasHeight);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const manager = getThreeManager();
    manager.attach(el, canvasWidth, canvasHeight);

    return () => {
      manager.destroy();
    };
  }, []);

  useEffect(() => {
    getThreeManager().resize(canvasWidth, canvasHeight);
  }, [canvasWidth, canvasHeight]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: canvasWidth,
        height: canvasHeight,
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
      data-testid="three-canvas"
    />
  );
};

/** @deprecated use ThreeCanvas */
export const LeaferCanvas = ThreeCanvas;
