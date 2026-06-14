/**
 * LLM tool schemas — compact for Xunfei/MiMo (≤100 schema params).
 * Details live in system prompts; schemas stay minimal.
 */

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

const LAYOUT_SCHEMA = {
  type: 'object',
  properties: {
    centerX: { type: 'number' },
    centerY: { type: 'number' },
    width: { type: 'number' },
    height: { type: 'number' },
    attachTo: { type: 'number' },
    attachEdge: { type: 'string' },
    offsetX: { type: 'number' },
    offsetY: { type: 'number' },
  },
};

const PRIMITIVE_SCHEMA = {
  type: 'object',
  properties: {
    kind: { type: 'string' },
    x: { type: 'number' },
    y: { type: 'number' },
    width: { type: 'number' },
    height: { type: 'number' },
    radius: { type: 'number' },
    depth: { type: 'number' },
    color: { type: 'string' },
    toX: { type: 'number' },
    toY: { type: 'number' },
  },
  required: ['kind', 'x', 'y'],
};

export const PLAN_DRAWING_STEPS_DEFINITION: ToolDefinition = {
  type: 'function',
  function: {
    name: 'planDrawingSteps',
    description: '规划主体绘制步骤（不含背景），每步含 layout 锚点',
    parameters: {
      type: 'object',
      properties: {
        totalSteps: { type: 'number' },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              index: { type: 'number' },
              label: { type: 'string' },
              description: { type: 'string' },
              layout: LAYOUT_SCHEMA,
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
    description: '渲染单步主体图元（primitives 数组，画布像素坐标）',
    parameters: {
      type: 'object',
      properties: {
        stepIndex: { type: 'number' },
        label: { type: 'string' },
        primitives: {
          type: 'array',
          items: PRIMITIVE_SCHEMA,
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
    description: '清空画布',
    parameters: { type: 'object', properties: {} },
  },
};

export const THREE_DRAWING_TOOLS = [
  PLAN_DRAWING_STEPS_DEFINITION,
  RENDER_THREE_STEP_DEFINITION,
  CLEAR_THREE_CANVAS_DEFINITION,
];
