/**
 * @module three-renderer/ThreeCanvas
 * React wrapper that mounts a Three.js WebGL renderer.
 */

import React, { useEffect, useRef } from 'react';
import { getThreeManager } from './ThreeManager';

interface ThreeCanvasProps {
  className?: string;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const attachedRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const syncSize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w <= 0 || h <= 0) return;

      const manager = getThreeManager();
      if (!attachedRef.current) {
        manager.attach(el, w, h);
        attachedRef.current = true;
      } else {
        manager.resize(w, h);
      }
    };

    syncSize();
    const ro = new ResizeObserver(syncSize);
    ro.observe(el);

    return () => {
      ro.disconnect();
      if (attachedRef.current) {
        getThreeManager().destroy();
        attachedRef.current = false;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full ${className}`}
      data-testid="three-canvas"
    />
  );
};

/** @deprecated use ThreeCanvas */
export const LeaferCanvas = ThreeCanvas;
