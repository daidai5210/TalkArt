import React from 'react';

interface TriangleShapeProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  [key: string]: unknown;
}

export const TriangleShape: React.FC<TriangleShapeProps> = ({
  x1,
  y1,
  x2,
  y2,
  x3,
  y3,
  fill = '#f39c12',
  stroke = 'none',
  strokeWidth = 0,
  opacity = 1,
}) => {
  const points = `${x1},${y1} ${x2},${y2} ${x3},${y3}`;
  return (
    <polygon
      points={points}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
    />
  );
};
