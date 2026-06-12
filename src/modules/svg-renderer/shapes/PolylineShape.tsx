import React from 'react';

interface PolylineShapeProps {
  points: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

export const PolylineShape: React.FC<PolylineShapeProps> = ({
  points,
  fill = 'none',
  stroke = '#333333',
  strokeWidth = 2,
  opacity = 1,
}) => (
  <polyline
    points={points}
    fill={fill}
    stroke={stroke}
    strokeWidth={strokeWidth}
    opacity={opacity}
  />
);
