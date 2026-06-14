/**
 * LLM tool schemas — two-phase: plan scene composition → render local components → assemble.
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
      '分析用户需求，规划场景组件清单与平面组装关系。先确定有哪些组件、层次、地面线，再分步渲染。',
    parameters: {
      type: 'object',
      properties: {
        planId: { type: 'string', description: '计划唯一 ID' },
        totalSteps: { type: 'number', description: '总步骤数' },
        scene: {
          type: 'object',
          description: '场景平面参数（必填）',
          properties: {
            groundLineY: {
              type: 'number',
              description: '地面线 Y（px），建筑/道路底边必须落在此线',
            },
            skyBottomY: {
              type: 'number',
              description: '天空与地景分界 Y（px），背景层应在此之上',
            },
          },
          required: ['groundLineY'],
        },
        steps: {
          type: 'array',
          description: '有序组件步骤：每步一个组件，含 layer + layout 组装关系',
          items: {
            type: 'object',
            properties: {
              index: { type: 'number', description: '步骤序号，从 0 开始' },
              label: { type: 'string', description: '组件名称，如「地面」「牌坊」' },
              description: {
                type: 'string',
                description: '组件形状说明：用哪些 kind 图元、颜色（局部坐标，不含画布位置）',
              },
              layer: {
                type: 'string',
                enum: ['background', 'ground', 'structure', 'detail', 'foreground'],
                description: '层次：background 天空 → ground 地面 → structure 主体 → detail 细节',
              },
              grounded: {
                type: 'boolean',
                description: 'true=底边必须落地面线或依附组件顶面（建筑/道路必填）',
              },
              layout: {
                type: 'object',
                description:
                  '平面组装位置。背景/地面用 centerX+centerY+尺寸；上层用 attachTo+attachEdge 链式拼合',
                properties: {
                  centerX: { type: 'number', description: '组件中心 X（px）' },
                  centerY: { type: 'number', description: '组件中心 Y（px），grounded 时可为 groundLineY' },
                  width: { type: 'number', description: '目标宽度（px）' },
                  height: { type: 'number', description: '目标高度（px）' },
                  attachTo: { type: 'number', description: '依附的步骤 index（0 起）' },
                  attachEdge: {
                    type: 'string',
                    enum: ['top', 'bottom', 'left', 'right', 'center'],
                    description: '依附到参考组件的哪条边',
                  },
                  offsetX: { type: 'number', description: '相对锚点 X 偏移（px）' },
                  offsetY: { type: 'number', description: '相对锚点 Y 偏移（px）' },
                },
              },
            },
            required: ['index', 'label', 'description', 'layer', 'layout'],
          },
        },
      },
      required: ['totalSteps', 'scene', 'steps'],
    },
  },
};

export const RENDER_THREE_STEP_DEFINITION: ToolDefinition = {
  type: 'function',
  function: {
    name: 'renderThreeStep',
    description: `设计单个组件的图元（${GEOMETRY_KINDS.join('|')}）。使用局部坐标 (0,0) 为组件中心，系统负责组装到画布。`,
    parameters: {
      type: 'object',
      properties: {
        stepIndex: { type: 'number', description: '当前步骤序号' },
        label: { type: 'string', description: '组件标签' },
        coordinateMode: {
          type: 'string',
          enum: ['local', 'absolute'],
          description: 'local=局部坐标(推荐)；absolute=画布绝对坐标',
        },
        primitives: {
          type: 'array',
          description:
            '组件图元列表（局部坐标：原点在组件中心，x/y 约 -150~150，y 向下为正）。不要设 z，系统按 layer 设置',
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
