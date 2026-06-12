import React from 'react';

interface RectShapeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
  ry?: number;
  opacity?: number;
  [key: string]: unknown;
}

export const RectShape: React.FC<RectShapeProps> = ({
  x,
  y,
  width,
  height,
  fill = '#4a90d9',
  stroke = 'none',
  strokeWidth = 0,
  rx = 0,
  ry = 0,
  opacity = 1,
}) => {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      rx={rx}
      ry={ry}
      opacity={opacity}
    />
  );
};
