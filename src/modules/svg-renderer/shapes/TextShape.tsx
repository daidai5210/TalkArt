import React from 'react';

interface TextShapeProps {
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  textAnchor?: 'start' | 'middle' | 'end';
  opacity?: number;
  [key: string]: unknown;
}

export const TextShape: React.FC<TextShapeProps> = ({
  x,
  y,
  text,
  fontSize = 16,
  fontFamily = 'sans-serif',
  fill = '#333333',
  textAnchor = 'start',
  opacity = 1,
}) => {
  return (
    <text
      x={x}
      y={y}
      fontSize={fontSize}
      fontFamily={fontFamily}
      fill={fill}
      textAnchor={textAnchor}
      opacity={opacity}
    >
      {text}
    </text>
  );
};
