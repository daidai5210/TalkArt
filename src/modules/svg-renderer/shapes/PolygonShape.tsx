import React from 'react';

interface PolygonShapeProps {
  points: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

export const PolygonShape: React.FC<PolygonShapeProps> = ({
  points,
  fill = '#7c5cfc',
  stroke = 'none',
  strokeWidth = 0,
  opacity = 1,
}) => (
  <polygon
    points={points}
    fill={fill}
    stroke={stroke}
    strokeWidth={strokeWidth}
    opacity={opacity}
  />
);
