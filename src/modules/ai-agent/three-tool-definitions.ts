/**
 * LLM tool schemas for progressive minimal sketch drawing.
 */

import { SKETCH_MARK_KINDS } from '../three-renderer/sketch-catalog';

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
      '分析用户绘图需求，输出极简线稿分步计划（仅主体，不含背景）。简单对象 1~2 步，复杂主体 3~5 步。',
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
                  '本步详细绘制说明：使用哪些极简笔画 mark，以及它们与主体的相对位置。供 renderSketchStep 使用',
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

const POINT_SCHEMA = {
  type: 'array',
  description: '[x,y] 坐标点',
  items: { type: 'number' },
  minItems: 2,
  maxItems: 2,
};

const MARK_SCHEMA = {
  type: 'object',
  description: '单个极简笔画 mark，kind 决定必填字段',
  properties: {
    kind: { type: 'string', enum: SKETCH_MARK_KINDS, description: '笔画类型' },
    from: POINT_SCHEMA,
    to: POINT_SCHEMA,
    points: { type: 'array', items: POINT_SCHEMA, description: 'polyline/curve/polygon 的点列表' },
    center: POINT_SCHEMA,
    rx: { type: 'number', description: 'ellipse 横向半径' },
    ry: { type: 'number', description: 'ellipse 纵向半径' },
    r: { type: 'number', description: 'dot 半径' },
    stroke: { type: 'string', description: '描边颜色，默认 #222222' },
    fill: { type: 'string', description: '少量填充色；无填充用 none 或省略' },
    width: { type: 'number', description: '线宽，默认 3' },
    opacity: { type: 'number', description: '透明度 0~1' },
  },
  required: ['kind'],
};

export const RENDER_SKETCH_STEP_DEFINITION: ToolDefinition = {
  type: 'function',
  function: {
    name: 'renderSketchStep',
    description: `渲染单个极简线稿步骤：输出 marks 数组（${SKETCH_MARK_KINDS.join('|')}）。禁止背景、阴影、纹理和复杂装饰。`,
    parameters: {
      type: 'object',
      properties: {
        stepIndex: { type: 'number', description: '当前步骤序号' },
        label: { type: 'string', description: '步骤标签' },
        marks: {
          type: 'array',
          description:
            '本步笔画列表。每项是 line/polyline/curve/ellipse/polygon/dot。每步 1~8 个 mark，越少越好。',
          items: MARK_SCHEMA,
          minItems: 1,
          maxItems: 8,
        },
      },
      required: ['stepIndex', 'label', 'marks'],
    },
  },
};

/** @deprecated use RENDER_SKETCH_STEP_DEFINITION */
export const RENDER_THREE_STEP_DEFINITION = RENDER_SKETCH_STEP_DEFINITION;

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
  RENDER_SKETCH_STEP_DEFINITION,
  CLEAR_THREE_CANVAS_DEFINITION,
];
