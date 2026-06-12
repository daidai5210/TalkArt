import React from 'react';

interface CircleShapeProps {
  cx: number;
  cy: number;
  r: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  [key: string]: unknown;
}

export const CircleShape: React.FC<CircleShapeProps> = ({
  cx,
  cy,
  r,
  fill = '#e74c3c',
  stroke = 'none',
  strokeWidth = 0,
  opacity = 1,
}) => {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
    />
  );
};
