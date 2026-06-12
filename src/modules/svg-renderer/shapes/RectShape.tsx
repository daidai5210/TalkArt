import React from 'react';
import type { FillGradientSpec } from '@/modules/drawing-tools/v2/style-tools';
import { GradientDefs } from './GradientDefs';

interface RectShapeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  fillGradient?: FillGradientSpec;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
  ry?: number;
  opacity?: number;
  id?: string;
  [key: string]: unknown;
}

export const RectShape: React.FC<RectShapeProps> = ({
  x,
  y,
  width,
  height,
  fill = '#4a90d9',
  fillGradient,
  stroke = 'none',
  strokeWidth = 0,
  rx = 0,
  ry = 0,
  opacity = 1,
  id,
}) => {
  const gradId = fillGradient && id ? `grad-${id}` : null;
  const fillValue = gradId ? `url(#${gradId})` : fill;

  return (
    <>
      {fillGradient && gradId && (
        <GradientDefs
          id={gradId}
          gradient={fillGradient}
          x={x}
          y={y}
          width={width}
          height={height}
        />
      )}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fillValue}
        stroke={stroke}
        strokeWidth={strokeWidth}
        rx={rx}
        ry={ry}
        opacity={opacity}
      />
    </>
  );
};
