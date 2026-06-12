import React from 'react';

interface LineShapeProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  opacity?: number;
  [key: string]: unknown;
}

export const LineShape: React.FC<LineShapeProps> = ({
  x1,
  y1,
  x2,
  y2,
  stroke = '#333333',
  strokeWidth = 2,
  strokeDasharray,
  opacity = 1,
}) => {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      opacity={opacity}
    />
  );
};
