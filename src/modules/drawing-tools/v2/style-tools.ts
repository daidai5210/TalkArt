/**
 * @module drawing-tools/v2/style-tools
 * Phase 5: gradient fills and style updates.
 */

import type { CanvasContext, ToolResult } from '../types';
import { parseColor } from '../coordinate-utils';
import { selectElement } from '../element-ops';

export interface FillGradientSpec {
  from: string;
  to: string;
  direction?: 'horizontal' | 'vertical';
}

export function setFillGradient(
  context: CanvasContext,
  params: {
    elementId?: string;
    description?: string;
    gradient: FillGradientSpec;
  },
): ToolResult {
  const selection = selectElement(context, {
    id: params.elementId,
    description: params.description,
  });

  if (!selection.success || !selection.elementId) {
    return { success: false, error: selection.error ?? '未找到目标元素' };
  }

  const element = context.elements.find((el) => el.id === selection.elementId);
  if (!element) {
    return { success: false, error: '元素不存在' };
  }

  if (!['rect', 'circle', 'ellipse', 'triangle', 'polygon'].includes(element.type)) {
    return { success: false, error: '该元素类型不支持渐变填充' };
  }

  const from = parseColor(params.gradient.from);
  const to = parseColor(params.gradient.to);
  const direction = params.gradient.direction ?? 'vertical';

  return {
    success: true,
    elementId: selection.elementId,
    element: {
      id: selection.elementId,
      type: element.type,
      props: {
        ...element.props,
        fillGradient: { from, to, direction },
        fill: undefined,
      },
    },
  };
}
