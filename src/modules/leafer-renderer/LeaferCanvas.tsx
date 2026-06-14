/**
 * @module leafer-renderer/LeaferCanvas
 * React wrapper that mounts a Leafer instance on a div container.
 */

import React, { useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { getLeaferManager } from './LeaferManager';

interface LeaferCanvasProps {
  className?: string;
}

export const LeaferCanvas: React.FC<LeaferCanvasProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWidth = useStore((s) => s.canvasWidth);
  const canvasHeight = useStore((s) => s.canvasHeight);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const manager = getLeaferManager();
    manager.attach(el, canvasWidth, canvasHeight);

    return () => {
      manager.destroy();
    };
  }, []);

  useEffect(() => {
    getLeaferManager().resize(canvasWidth, canvasHeight);
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
      data-testid="leafer-canvas"
    />
  );
};
