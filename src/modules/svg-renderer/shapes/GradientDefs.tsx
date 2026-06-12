import React from 'react';
import type { FillGradientSpec } from '@/modules/drawing-tools/v2/style-tools';

interface GradientDefsProps {
  id: string;
  gradient: FillGradientSpec;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const GradientDefs: React.FC<GradientDefsProps> = ({
  id,
  gradient,
  x,
  y,
  width,
  height,
}) => {
  const isVertical = gradient.direction !== 'horizontal';
  const x1 = isVertical ? x : x;
  const y1 = isVertical ? y : y;
  const x2 = isVertical ? x : x + width;
  const y2 = isVertical ? y + height : y;

  return (
    <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor={gradient.from} />
      <stop offset="100%" stopColor={gradient.to} />
    </linearGradient>
  );
};
