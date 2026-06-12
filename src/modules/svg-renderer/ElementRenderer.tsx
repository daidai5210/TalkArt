import React from 'react';
import { SVGElement } from '@/store/canvas-slice';
import { useStore } from '@/store';
import {
  RectShape,
  CircleShape,
  EllipseShape,
  LineShape,
  TextShape,
  TriangleShape,
} from './shapes';

interface ElementRendererProps {
  element: SVGElement;
}

export const ElementRenderer: React.FC<ElementRendererProps> = ({ element }) => {
  const selectElement = useStore((state) => state.selectElement);
  const selectedId = useStore((state) => state.selectedId);
  const isSelected = selectedId === element.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectElement(element.id);
  };

  const renderShape = () => {
    const { type, props } = element;

    switch (type) {
      case 'rect':
        return <RectShape {...(props as any)} />;
      case 'circle':
        return <CircleShape {...(props as any)} />;
      case 'ellipse':
        return <EllipseShape {...(props as any)} />;
      case 'line':
        return <LineShape {...(props as any)} />;
      case 'text':
        return <TextShape {...(props as any)} />;
      case 'triangle':
        return <TriangleShape {...(props as any)} />;
      default:
        console.warn(`Unknown element type: ${type}`);
        return null;
    }
  };

  return (
    <g onClick={handleClick} style={{ cursor: 'pointer' }}>
      {renderShape()}
      {isSelected && (
        <>
          {/* Subtle blue glow effect */}
          <filter id={`glow-${element.id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </>
      )}
    </g>
  );
};
