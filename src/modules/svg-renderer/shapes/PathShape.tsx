import React from 'react';

interface PathShapeProps {
  d: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

export const PathShape: React.FC<PathShapeProps> = ({
  d,
  fill = 'none',
  stroke = '#333333',
  strokeWidth = 2,
  opacity = 1,
}) => (
  <path d={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} />
);
