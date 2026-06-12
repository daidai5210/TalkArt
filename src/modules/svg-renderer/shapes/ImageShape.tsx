import React from 'react';

interface ImageShapeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  href: string;
  opacity?: number;
}

export const ImageShape: React.FC<ImageShapeProps> = ({
  x,
  y,
  width,
  height,
  href,
  opacity = 1,
}) => (
  <image
    x={x}
    y={y}
    width={width}
    height={height}
    href={href}
    opacity={opacity}
    preserveAspectRatio="xMidYMid meet"
  />
);
