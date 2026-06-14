/**
 * LLM tool schemas for progressive Three.js drawing (structured primitives API).
 */

import {
  GEOMETRY_KINDS,
  buildPrimitiveItemSchema,
} from '../three-renderer/geometry-catalog';

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export const PLAN_DRAWING_STEPS_DEFINITION: ToolDefinition = {
  type: 'function',
  function: {
    name: 'planDrawingSteps',
    description:
      '分析用户绘图需求，输出分步绘制计划（仅主体，不含背景）。简单图形 1~3 步，复杂主体 5~15 步。必须先调用此工具再逐步渲染。',
    parameters: {
      type: 'object',
      properties: {
        planId: { type: 'string', description: '计划唯一 ID' },
        totalSteps: { type: 'number', description: '总步骤数' },
        steps: {
          type: 'array',
          description: '有序绘制步骤列表',
          items: {
            type: 'object',
            properties: {
              index: { type: 'number', description: '步骤序号，从 0 开始' },
              label: { type: 'string', description: '步骤简短标签，如「画身体」「画头部」' },
              description: {
                type: 'string',
                description:
                  '本步详细绘制说明：用哪些 kind 图元、颜色、相对位置。供 renderThreeStep 使用',
              },
              layout: {
                type: 'object',
                description:
                  '本步空间锚点（必填）。主体用 centerX/centerY/width/height；依附部件用 attachTo+attachEdge+offsetX/offsetY',
                properties: {
                  centerX: { type: 'number', description: '主图形中心 X（px）' },
                  centerY: { type: 'number', description: '主图形中心 Y（px）' },
                  width: { type: 'number', description: '目标宽度（px）' },
                  height: { type: 'number', description: '目标高度（px）' },
                  attachTo: { type: 'number', description: '依附的步骤 index（0 起）' },
                  attachEdge: {
                    type: 'string',
                    enum: ['top', 'bottom', 'left', 'right', 'center'],
                    description: '依附到参考步骤的哪条边',
                  },
                  offsetX: { type: 'number', description: '相对锚点 X 偏移（px）' },
                  offsetY: { type: 'number', description: '相对锚点 Y 偏移（px）' },
                },
              },
            },
            required: ['index', 'label', 'description', 'layout'],
          },
        },
      },
      required: ['totalSteps', 'steps'],
    },
  },
};

export const RENDER_THREE_STEP_DEFINITION: ToolDefinition = {
  type: 'function',
  function: {
    name: 'renderThreeStep',
    description: `渲染单个绘制步骤的主体部件：输出 primitives 图元数组（${GEOMETRY_KINDS.join('|')}）。禁止画背景/天空/草地/全屏底色，白纸画布由系统提供。`,
    parameters: {
      type: 'object',
      properties: {
        stepIndex: { type: 'number', description: '当前步骤序号' },
        label: { type: 'string', description: '步骤标签' },
        primitives: {
          type: 'array',
          description:
            '本步图元列表。每项含 kind + 坐标 + 尺寸 + color。系统校验后渲染为 Three.js Mesh',
          items: buildPrimitiveItemSchema(),
          minItems: 1,
        },
      },
      required: ['stepIndex', 'label', 'primitives'],
    },
  },
};

export const CLEAR_THREE_CANVAS_DEFINITION: ToolDefinition = {
  type: 'function',
  function: {
    name: 'clearThreeCanvas',
    description: '清空画布（用户要求重新绘制时使用）',
    parameters: { type: 'object', properties: {} },
  },
};

export const THREE_DRAWING_TOOLS = [
  PLAN_DRAWING_STEPS_DEFINITION,
  RENDER_THREE_STEP_DEFINITION,
  CLEAR_THREE_CANVAS_DEFINITION,
];
