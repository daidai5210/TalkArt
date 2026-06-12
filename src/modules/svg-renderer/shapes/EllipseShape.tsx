import React from 'react';

interface EllipseShapeProps {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  [key: string]: unknown;
}

export const EllipseShape: React.FC<EllipseShapeProps> = ({
  cx,
  cy,
  rx,
  ry,
  fill = '#2ecc71',
  stroke = 'none',
  strokeWidth = 0,
  opacity = 1,
}) => {
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
    />
  );
};
