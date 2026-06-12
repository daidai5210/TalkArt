/**
 * @module drawing-tools/__tests__/path-layer.test
 * Phase 3: path and layer tool tests.
 */

import { describe, it, expect } from 'vitest';
import { ToolDispatcher } from '../../ai-agent/ToolDispatcher';
import { mmToPx } from '../coordinate-utils';
import type { CanvasContext } from '../types';
import type { Layer } from '../v2/layer-tools';

function createContext(layers?: Layer[]): CanvasContext {
  return {
    width: 800,
    height: 600,
    defaultUnit: 'mm',
    layers: layers ?? [
      { id: 'layer-default', name: '默认层', visible: true, zIndex: 0 },
      { id: 'layer-bg', name: '背景层', visible: true, zIndex: 1 },
      { id: 'layer-text', name: '文字层', visible: true, zIndex: 2 },
    ],
    elements: [],
    selectedId: null,
  };
}

describe('Phase 3 path tools', () => {
  it('draws polyline with 4+ points', () => {
    const dispatcher = new ToolDispatcher(createContext());
    const result = dispatcher.execute('drawPolyline', {
      points: [
        { x: 10, y: 10, unit: 'mm' },
        { x: 50, y: 30, unit: 'mm' },
        { x: 90, y: 10, unit: 'mm' },
        { x: 130, y: 40, unit: 'mm' },
      ],
      stroke: '黑色',
      strokeWidth: 2,
    });

    expect(result.success).toBe(true);
    expect(result.element?.type).toBe('polyline');
    const points = result.element?.props.points as string;
    expect(points.split(' ')).toHaveLength(4);
    expect(points).toContain(`${mmToPx(10).toFixed(0)}`);
  });

  it('draws SVG path from d attribute', () => {
    const dispatcher = new ToolDispatcher(createContext());
    const result = dispatcher.execute('drawPath', {
      d: 'M 10 10 L 100 50 Q 150 100 200 50',
      style: { stroke: '蓝色', fill: 'none' },
    });

    expect(result.success).toBe(true);
    expect(result.element?.type).toBe('path');
    expect(result.element?.props.d).toContain('M 10 10');
  });
});

describe('Phase 3 layer tools', () => {
  it('creates a new layer', () => {
    const dispatcher = new ToolDispatcher(createContext());
    const result = dispatcher.execute('createLayer', { name: '标题层' });

    expect(result.success).toBe(true);
    expect(result.action).toBe('createLayer');
    expect(result.layer?.name).toBe('标题层');
    expect(result.layer?.visible).toBe(true);
  });

  it('sets layer visibility', () => {
    const dispatcher = new ToolDispatcher(createContext());
    const result = dispatcher.execute('setLayerVisibility', {
      layerId: 'layer-text',
      visible: false,
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe('setLayerVisibility');
    expect(result.layerVisible).toBe(false);
  });

  it('draws rect on specific layer via layerId', () => {
    const dispatcher = new ToolDispatcher(createContext());
    const result = dispatcher.execute('drawRect', {
      position: { x: 10, y: 10, unit: 'mm' },
      size: { width: 40, height: 20, unit: 'mm' },
      style: { fill: '红色' },
      layerId: 'layer-bg',
    });

    expect(result.success).toBe(true);
    expect(result.element?.props.layerId).toBe('layer-bg');
  });
});
