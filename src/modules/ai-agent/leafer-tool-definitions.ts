/**
 * LLM tool schemas for progressive LeaferJS drawing.
 */

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
      '分析用户绘图需求，输出分步绘制计划。简单图形 1~3 步，复杂场景 5~15 步。必须先调用此工具再逐步渲染。',
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
              label: { type: 'string', description: '步骤简短标签，如「画背景」' },
              description: {
                type: 'string',
                description: '本步详细绘制说明，供下一步 renderLeaferStep 使用',
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

export const RENDER_LEAFER_STEP_DEFINITION: ToolDefinition = {
  type: 'function',
  function: {
    name: 'renderLeaferStep',
    description:
      '渲染单个绘制步骤：输出 Leafer JSON（tag + children），只画当前步骤内容，不要画其他步骤的图形。',
    parameters: {
      type: 'object',
      properties: {
        stepIndex: { type: 'number', description: '当前步骤序号' },
        label: { type: 'string', description: '步骤标签' },
        leaferJson: {
          type: 'object',
          description:
            'Leafer 场景 JSON。根节点建议 tag:Group，children 包含 Rect/Ellipse/Line/Polygon/Star/Path/Text 等',
          properties: {
            tag: {
              type: 'string',
              enum: ['Group', 'Box', 'Rect', 'Ellipse', 'Line', 'Polygon', 'Star', 'Path', 'Text'],
            },
            name: { type: 'string' },
            children: { type: 'array', items: { type: 'object' } },
          },
          required: ['tag'],
        },
      },
      required: ['stepIndex', 'label', 'leaferJson'],
    },
  },
};

export const CLEAR_LEAFER_CANVAS_DEFINITION: ToolDefinition = {
  type: 'function',
  function: {
    name: 'clearLeaferCanvas',
    description: '清空画布（用户要求重新绘制时使用）',
    parameters: { type: 'object', properties: {} },
  },
};

export const LEAFER_DRAWING_TOOLS = [
  PLAN_DRAWING_STEPS_DEFINITION,
  RENDER_LEAFER_STEP_DEFINITION,
  CLEAR_LEAFER_CANVAS_DEFINITION,
];
