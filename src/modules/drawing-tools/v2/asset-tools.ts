/**
 * @module drawing-tools/v2/asset-tools
 * Phase 5: insert preset or external images (not generative AI).
 */

import type { CanvasContext, SemanticPosition, ToolResult } from '../types';
import { generateId, resolvePosition, resolveUnit, toPx } from '../coordinate-utils';

const PRESET_ASSETS: Record<string, string> = {
  bowl: '/assets/presets/bowl-placeholder.svg',
  'logo-placeholder': '/assets/presets/bowl-placeholder.svg',
};

export function insertImage(
  context: CanvasContext,
  params: {
    position: SemanticPosition;
    width: number;
    height: number;
    unit?: 'mm' | 'px';
    src?: string;
    presetId?: string;
    layerId?: string;
  },
): ToolResult {
  try {
    const unit = resolveUnit(params.unit, context.defaultUnit ?? 'px');
    const width = toPx(params.width, unit);
    const height = toPx(params.height, unit);

    let href = params.src?.trim() ?? '';
    if (!href && params.presetId) {
      href = PRESET_ASSETS[params.presetId] ?? '';
    }
    if (!href) {
      return { success: false, error: '需要提供 src 或有效的 presetId（bowl）' };
    }

    const { x, y } = resolvePosition(params.position, width, height, context);
    const id = generateId('image');

    return {
      success: true,
      element: {
        id,
        type: 'image',
        props: {
          x,
          y,
          width,
          height,
          href,
          presetId: params.presetId,
          layerId: params.layerId ?? 'layer-default',
        },
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : '插入图片失败',
    };
  }
}
