import React from 'react';
import { useStore } from '@/store';
import { ElementRenderer } from './ElementRenderer';
import { SelectionOverlay } from './SelectionOverlay';

export const Canvas: React.FC = () => {
  const elements = useStore((state) => state.elements);
  const selectedId = useStore((state) => state.selectedId);
  const selectElement = useStore((state) => state.selectElement);
  const canvasWidth = useStore((state) => state.canvasWidth);
  const canvasHeight = useStore((state) => state.canvasHeight);
  const layers = useStore((state) => state.layers);

  const selectedElement = elements.find((el) => el.id === selectedId) || null;

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    // Only deselect if clicking directly on the canvas background
    if ((e.target as SVGElement).tagName === 'svg' || (e.target as SVGElement).id === 'canvas-background') {
      selectElement(null);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-talkart-bg p-4">
      <div className="bg-talkart-surface rounded-lg shadow-lg p-4 border border-gray-700/50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          width={canvasWidth}
          height={canvasHeight}
          className="block rounded"
          style={{ background: '#ffffff' }}
          onClick={handleCanvasClick}
        >
          {/* White canvas background */}
          <rect
            id="canvas-background"
            x={0}
            y={0}
            width={canvasWidth}
            height={canvasHeight}
            fill="#ffffff"
          />

          {/* Render elements grouped by layer (z-index order) */}
          {[...layers]
            .sort((a, b) => a.zIndex - b.zIndex)
            .filter((layer) => layer.visible)
            .map((layer) => (
              <g key={layer.id} data-layer={layer.id}>
                {elements
                  .filter(
                    (el) => (el.layerId ?? (el.props.layerId as string)) === layer.id
                      || (!(el.layerId ?? el.props.layerId) && layer.id === 'layer-default'),
                  )
                  .map((element) => (
                    <ElementRenderer key={element.id} element={element} />
                  ))}
              </g>
            ))}

          {/* Selection overlay on top */}
          {selectedElement && <SelectionOverlay element={selectedElement} />}
        </svg>
      </div>
    </div>
  );
};
