/**
 * @module drawing-tools/v2/layer-tools
 * Phase 3: layer management tools.
 */

import type { CanvasContext, ToolResult } from '../types';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  zIndex: number;
}

function generateLayerId(name: string): string {
  const slug = name.replace(/\s+/g, '-').slice(0, 20);
  return `layer-${slug}-${Date.now().toString(36)}`;
}

/**
 * Create a new layer.
 */
export function createLayer(
  context: CanvasContext,
  params: { name: string; id?: string; zIndex?: number },
): ToolResult {
  const id = params.id ?? generateLayerId(params.name);
  const existing = context.layers?.find((l) => l.id === id);
  if (existing) {
    return { success: false, error: `图层 "${id}" 已存在` };
  }

  const maxZ = context.layers?.reduce((m, l) => Math.max(m, l.zIndex), 0) ?? 0;

  return {
    success: true,
    action: 'createLayer',
    layer: {
      id,
      name: params.name,
      visible: true,
      zIndex: params.zIndex ?? maxZ + 1,
    },
  };
}

/**
 * Delete a layer (elements move to layer-default).
 */
export function deleteLayer(
  context: CanvasContext,
  params: { layerId: string },
): ToolResult {
  if (params.layerId === 'layer-default') {
    return { success: false, error: '不能删除默认图层' };
  }
  const layer = context.layers?.find((l) => l.id === params.layerId);
  if (!layer) {
    return { success: false, error: `图层 "${params.layerId}" 不存在` };
  }

  return {
    success: true,
    action: 'deleteLayer',
    layerId: params.layerId,
  };
}

/**
 * Rename a layer.
 */
export function renameLayer(
  context: CanvasContext,
  params: { layerId: string; name: string },
): ToolResult {
  const layer = context.layers?.find((l) => l.id === params.layerId);
  if (!layer) {
    return { success: false, error: `图层 "${params.layerId}" 不存在` };
  }

  return {
    success: true,
    action: 'renameLayer',
    layerId: params.layerId,
    layerName: params.name,
  };
}

/**
 * Set layer visibility.
 */
export function setLayerVisibility(
  context: CanvasContext,
  params: { layerId: string; visible: boolean },
): ToolResult {
  const layer = context.layers?.find((l) => l.id === params.layerId);
  if (!layer) {
    return { success: false, error: `图层 "${params.layerId}" 不存在` };
  }

  return {
    success: true,
    action: 'setLayerVisibility',
    layerId: params.layerId,
    layerVisible: params.visible,
  };
}

/**
 * Set layer z-order.
 */
export function setLayerOrder(
  context: CanvasContext,
  params: { layerId: string; zIndex: number },
): ToolResult {
  const layer = context.layers?.find((l) => l.id === params.layerId);
  if (!layer) {
    return { success: false, error: `图层 "${params.layerId}" 不存在` };
  }

  return {
    success: true,
    action: 'setLayerOrder',
    layerId: params.layerId,
    layerZIndex: params.zIndex,
  };
}

/**
 * Move an element to a different layer.
 */
export function moveElementToLayer(
  context: CanvasContext,
  params: { elementId: string; layerId: string },
): ToolResult {
  const element = context.elements.find((el) => el.id === params.elementId);
  if (!element) {
    return { success: false, error: `元素 "${params.elementId}" 不存在` };
  }

  const layer = context.layers?.find((l) => l.id === params.layerId);
  if (!layer) {
    return { success: false, error: `图层 "${params.layerId}" 不存在` };
  }

  return {
    success: true,
    action: 'moveElementToLayer',
    elementId: params.elementId,
    layerId: params.layerId,
  };
}
