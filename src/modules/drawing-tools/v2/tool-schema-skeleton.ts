/**
 * @module drawing-tools/v2/tool-schema-skeleton
 * Phase 1 deliverable: grouped tool schema skeleton for v0.2 vector voice drawing.
 * Schemas are descriptive placeholders; runtime dispatch remains on v0.1 tools until Phase 2.
 */

import type { ToolDefinition } from '../tool-definitions';
import type { ExecuteDrawingPlanInput } from './execute-drawing-plan.types';

/** Tool groups aligned with docs/research/phased-implementation-plan.md §5. */
export const TOOL_GROUPS = {
  canvasLayer: '画布/图层',
  geometry: '几何',
  text: '文字',
  edit: '编辑',
  asset: '素材',
  style: '样式',
  orchestration: '编排',
  historyExport: '历史/导出',
} as const;

export type ToolGroupKey = keyof typeof TOOL_GROUPS;

export interface SkeletonToolMeta {
  name: string;
  group: ToolGroupKey;
  phase: 1 | 2 | 3 | 4 | 5 | 6;
  status: 'skeleton' | 'implemented-v01' | 'planned';
  description: string;
}

/**
 * Master registry of all ~39 tools with phase introduction markers.
 * Used for documentation generation and phased rollout checks.
 */
export const TOOL_REGISTRY: SkeletonToolMeta[] = [
  // 编排 — Phase 1 definition, Phase 2 implementation
  { name: 'executeDrawingPlan', group: 'orchestration', phase: 1, status: 'skeleton', description: '批量执行绘图步骤列表' },

  // 画布/图层
  { name: 'setCanvasSize', group: 'canvasLayer', phase: 2, status: 'planned', description: '设置画布尺寸（mm/px）' },
  { name: 'setCanvasUnit', group: 'canvasLayer', phase: 2, status: 'planned', description: '切换默认单位' },
  { name: 'setBackground', group: 'canvasLayer', phase: 5, status: 'planned', description: '画布背景' },
  { name: 'clearCanvas', group: 'canvasLayer', phase: 2, status: 'implemented-v01', description: '清空画布' },
  { name: 'createLayer', group: 'canvasLayer', phase: 3, status: 'planned', description: '新建图层' },
  { name: 'deleteLayer', group: 'canvasLayer', phase: 3, status: 'planned', description: '删除图层' },
  { name: 'renameLayer', group: 'canvasLayer', phase: 3, status: 'planned', description: '重命名图层' },
  { name: 'setLayerVisibility', group: 'canvasLayer', phase: 3, status: 'planned', description: '图层显隐' },
  { name: 'setLayerOrder', group: 'canvasLayer', phase: 3, status: 'planned', description: '图层层级' },

  // 几何
  { name: 'drawRect', group: 'geometry', phase: 2, status: 'implemented-v01', description: '矩形' },
  { name: 'drawCircle', group: 'geometry', phase: 2, status: 'implemented-v01', description: '圆形' },
  { name: 'drawEllipse', group: 'geometry', phase: 2, status: 'implemented-v01', description: '椭圆' },
  { name: 'drawLine', group: 'geometry', phase: 2, status: 'implemented-v01', description: '线段' },
  { name: 'drawTriangle', group: 'geometry', phase: 2, status: 'implemented-v01', description: '三角形' },
  { name: 'drawArc', group: 'geometry', phase: 5, status: 'planned', description: '圆弧' },
  { name: 'drawPolygon', group: 'geometry', phase: 3, status: 'planned', description: '多边形' },
  { name: 'drawPolyline', group: 'geometry', phase: 3, status: 'planned', description: '折线' },
  { name: 'drawPath', group: 'geometry', phase: 3, status: 'planned', description: 'SVG 路径' },
  { name: 'drawArrow', group: 'geometry', phase: 6, status: 'planned', description: '箭头' },

  // 文字
  { name: 'drawText', group: 'text', phase: 2, status: 'implemented-v01', description: '单行文字' },
  { name: 'drawTextBlock', group: 'text', phase: 6, status: 'planned', description: '多行文字块' },

  // 编辑
  { name: 'selectElement', group: 'edit', phase: 2, status: 'implemented-v01', description: '选择元素' },
  { name: 'updateElement', group: 'edit', phase: 3, status: 'implemented-v01', description: '更新属性' },
  { name: 'deleteElement', group: 'edit', phase: 2, status: 'implemented-v01', description: '删除元素' },
  { name: 'moveElement', group: 'edit', phase: 2, status: 'implemented-v01', description: '移动元素' },
  { name: 'scaleElement', group: 'edit', phase: 2, status: 'implemented-v01', description: '缩放元素' },
  { name: 'duplicateElement', group: 'edit', phase: 2, status: 'implemented-v01', description: '复制元素' },
  { name: 'moveElementToLayer', group: 'edit', phase: 3, status: 'planned', description: '元素改层' },
  { name: 'alignElements', group: 'edit', phase: 6, status: 'planned', description: '对齐' },
  { name: 'distributeElements', group: 'edit', phase: 6, status: 'planned', description: '分布' },

  // 素材
  { name: 'insertImage', group: 'asset', phase: 5, status: 'planned', description: '插入位图素材' },
  { name: 'updateImage', group: 'asset', phase: 5, status: 'planned', description: '调整图片' },

  // 样式
  { name: 'setFillGradient', group: 'style', phase: 5, status: 'planned', description: '填充渐变' },
  { name: 'setStrokeGradient', group: 'style', phase: 5, status: 'planned', description: '描边渐变' },
  { name: 'setOpacity', group: 'style', phase: 5, status: 'planned', description: '透明度' },

  // 历史/导出
  { name: 'undoAction', group: 'historyExport', phase: 4, status: 'implemented-v01', description: '撤销' },
  { name: 'redoAction', group: 'historyExport', phase: 4, status: 'planned', description: '重做' },
  { name: 'exportImage', group: 'historyExport', phase: 4, status: 'implemented-v01', description: '导出图片' },

  // 编排
  { name: 'groupElements', group: 'orchestration', phase: 6, status: 'planned', description: '元素编组' },
];

/** OpenAI-compatible schema for executeDrawingPlan (Phase 1 skeleton). */
export const EXECUTE_DRAWING_PLAN_DEFINITION: ToolDefinition = {
  type: 'function',
  function: {
    name: 'executeDrawingPlan',
    description:
      '批量执行绘图计划。当用户描述包含多个图形、图层或步骤时使用此工具，一次性提交所有步骤。' +
      '例如「画三个圆排成一行」「画一个包装盒分背景层和文字层」。',
    parameters: {
      type: 'object',
      properties: {
        planId: { type: 'string', description: '可选计划 ID，用于追踪' },
        atomic: {
          type: 'boolean',
          description: '是否原子执行：true 时任一步失败则整体回滚。默认 false',
        },
        steps: {
          type: 'array',
          description: '有序步骤列表',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string', description: '工具名，如 drawRect、createLayer' },
              args: { type: 'object', description: '该工具的参数对象' },
              label: { type: 'string', description: '步骤说明，可选' },
            },
            required: ['tool', 'args'],
          },
        },
      },
      required: ['steps'],
    },
  },
};

/**
 * Phase 1: only orchestration skeleton is exported as LLM-facing schema.
 * Full TOOL_DEFINITIONS_V2 array will be assembled in Phase 2.
 */
export const TOOL_DEFINITIONS_V2_SKELETON: ToolDefinition[] = [
  EXECUTE_DRAWING_PLAN_DEFINITION,
];

/** Type guard for parsed executeDrawingPlan arguments. */
export function isExecuteDrawingPlanInput(
  value: unknown,
): value is ExecuteDrawingPlanInput {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return Array.isArray(obj.steps);
}
