import React from 'react';
import { SVGElement } from '@/store/canvas-slice';

interface SelectionOverlayProps {
  element: SVGElement;
}

const HANDLE_SIZE = 8;

function getBoundingBox(element: SVGElement): { x: number; y: number; width: number; height: number } {
  const { type, props } = element;
  const p = props as Record<string, number>;

  switch (type) {
    case 'rect':
      return {
        x: (p.x ?? 0) - (p.strokeWidth ?? 0) / 2,
        y: (p.y ?? 0) - (p.strokeWidth ?? 0) / 2,
        width: (p.width ?? 0) + (p.strokeWidth ?? 0),
        height: (p.height ?? 0) + (p.strokeWidth ?? 0),
      };
    case 'circle':
      return {
        x: (p.cx ?? 0) - (p.r ?? 0) - (p.strokeWidth ?? 0) / 2,
        y: (p.cy ?? 0) - (p.r ?? 0) - (p.strokeWidth ?? 0) / 2,
        width: ((p.r ?? 0) + (p.strokeWidth ?? 0) / 2) * 2,
        height: ((p.r ?? 0) + (p.strokeWidth ?? 0) / 2) * 2,
      };
    case 'ellipse':
      return {
        x: (p.cx ?? 0) - (p.rx ?? 0) - (p.strokeWidth ?? 0) / 2,
        y: (p.cy ?? 0) - (p.ry ?? 0) - (p.strokeWidth ?? 0) / 2,
        width: ((p.rx ?? 0) + (p.strokeWidth ?? 0) / 2) * 2,
        height: ((p.ry ?? 0) + (p.strokeWidth ?? 0) / 2) * 2,
      };
    case 'line': {
      const x = Math.min(p.x1 ?? 0, p.x2 ?? 0);
      const y = Math.min(p.y1 ?? 0, p.y2 ?? 0);
      const width = Math.abs((p.x2 ?? 0) - (p.x1 ?? 0));
      const height = Math.abs((p.y2 ?? 0) - (p.y1 ?? 0));
      const padding = Math.max((p.strokeWidth ?? 2) / 2, 4);
      return { x: x - padding, y: y - padding, width: width + padding * 2, height: height + padding * 2 };
    }
    case 'text': {
      const fontSize = p.fontSize ?? 16;
      const textValue = typeof p.text === 'string' ? p.text : '';
      const estimatedWidth = textValue.length * fontSize * 0.6;
      return {
        x: p.x ?? 0,
        y: (p.y ?? 0) - fontSize,
        width: estimatedWidth,
        height: fontSize * 1.2,
      };
    }
    case 'triangle': {
      const xs = [p.x1 ?? 0, p.x2 ?? 0, p.x3 ?? 0];
      const ys = [p.y1 ?? 0, p.y2 ?? 0, p.y3 ?? 0];
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    default:
      return { x: 0, y: 0, width: 0, height: 0 };
  }
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({ element }) => {
  const bbox = getBoundingBox(element);
  const halfHandle = HANDLE_SIZE / 2;

  const corners = [
    { x: bbox.x - halfHandle, y: bbox.y - halfHandle },
    { x: bbox.x + bbox.width - halfHandle, y: bbox.y - halfHandle },
    { x: bbox.x - halfHandle, y: bbox.y + bbox.height - halfHandle },
    { x: bbox.x + bbox.width - halfHandle, y: bbox.y + bbox.height - halfHandle },
  ];

  return (
    <g pointerEvents="none">
      {/* Subtle blue glow filter */}
      <defs>
        <filter id="selection-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feFlood floodColor="#7c5cfc" floodOpacity="0.3" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Dashed selection outline */}
      <rect
        x={bbox.x}
        y={bbox.y}
        width={bbox.width}
        height={bbox.height}
        fill="none"
        stroke="#7c5cfc"
        strokeWidth={2}
        strokeDasharray="5,5"
        filter="url(#selection-glow)"
      />

      {/* Corner resize handles */}
      {corners.map((corner, index) => (
        <rect
          key={index}
          x={corner.x}
          y={corner.y}
          width={HANDLE_SIZE}
          height={HANDLE_SIZE}
          fill="#ffffff"
          stroke="#7c5cfc"
          strokeWidth={1.5}
          rx={1}
        />
      ))}
    </g>
  );
};
