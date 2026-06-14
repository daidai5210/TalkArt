/**
 * @module drawing-tools/v2/paper-tools
 * Paper.js 工具定义
 *
 * 提供 executePaperCode 工具和 renderTemplate 工具，
 * 支持 LLM 使用 Paper.js API 和预设模板绘图。
 */

import type { ToolDefinition } from '../tool-definitions';
import type { CanvasContext, ToolResult } from '../types';

/**
 * executePaperCode 工具定义
 * 让 LLM 生成 Paper.js 绘图代码
 */
export const EXECUTE_PAPER_CODE_DEFINITION: ToolDefinition = {
  type: 'function',
  function: {
    name: 'executePaperCode',
    description:
      '使用 Paper.js 矢量绘图库执行代码。Paper.js 提供高级绘图 API，' +
      '包括 Path、Circle、Rectangle、RegularPolygon、Line、PointText 等。' +
      '支持贝塞尔曲线 (cubicCurveTo)、圆弧、形状操作等。' +
      '使用 paper 变量访问 Paper.js API，例如：' +
      'paper.Path.Circle({ center: [400, 300], radius: 50, fillColor: "red" });',
    parameters: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description:
            'Paper.js 绘图代码。使用 paper.Path.Circle 等 API 绘制。\n' +
            '示例：\n' +
            '// 绘制红色圆形\n' +
            'paper.Path.Circle({ center: [400, 300], radius: 50, fillColor: "red" });\n' +
            '// 绘制矩形\n' +
            'paper.Path.Rectangle({ point: [300, 200], size: [200, 150], fillColor: "blue" });',
        },
        description: {
          type: 'string',
          description: '绘图内容描述（可选）',
        },
      },
      required: ['code'],
    },
  },
};

/**
 * renderTemplate 工具定义
 * 让 LLM 使用预设模板绘制复杂图形
 */
export const RENDER_TEMPLATE_DEFINITION: ToolDefinition = {
  type: 'function',
  function: {
    name: 'renderTemplate',
    description:
      '使用预设模板绘制图形。可用模板：cat(猫), dog(狗), tree(树), house(房子), ' +
      'person(人物), star(星星), heart(心形), cloud(云朵)。' +
      '可调整颜色、大小和位置。',
    parameters: {
      type: 'object',
      properties: {
        template: {
          type: 'string',
          enum: ['cat', 'dog', 'tree', 'house', 'person', 'star', 'heart', 'cloud'],
          description: '模板类型',
        },
        center: {
          type: 'object',
          description: '中心位置',
          properties: {
            x: { type: 'number', description: 'x 坐标' },
            y: { type: 'number', description: 'y 坐标' },
          },
        },
        size: {
          type: 'number',
          description: '大小（像素），默认 200',
        },
        color: {
          type: 'string',
          description: '填充颜色，默认黑色',
        },
        strokeColor: {
          type: 'string',
          description: '描边颜色（可选）',
        },
      },
      required: ['template'],
    },
  },
};

/**
 * 执行 Paper.js 绘图代码
 */
export function executePaperCode(
  _context: CanvasContext,
  params: { code: string; description?: string },
): ToolResult {
  const { code, description } = params;

  if (!code || code.trim().length === 0) {
    return {
      success: false,
      error: 'Paper.js 绘图代码为空',
    };
  }

  return {
    success: true,
    elementId: `paper-code-${Date.now()}`,
    element: {
      id: `paper-code-${Date.now()}`,
      type: 'paperCode',
      props: {
        code,
        description: description || 'Paper.js 绘图',
      },
    },
  };
}

/**
 * 渲染预设模板
 */
export function renderTemplate(
  _context: CanvasContext,
  params: {
    template: string;
    center?: { x: number; y: number };
    size?: number;
    color?: string;
    strokeColor?: string;
  },
): ToolResult {
  const { template, center, size, color, strokeColor } = params;

  return {
    success: true,
    elementId: `template-${template}-${Date.now()}`,
    element: {
      id: `template-${template}-${Date.now()}`,
      type: 'template',
      props: {
        template,
        center: center || { x: 400, y: 300 },
        size: size || 200,
        color: color || 'black',
        strokeColor,
      },
    },
  };
}

/** 所有 Paper.js 工具定义 */
export const PAPER_TOOL_DEFINITIONS: ToolDefinition[] = [
  EXECUTE_PAPER_CODE_DEFINITION,
  RENDER_TEMPLATE_DEFINITION,
];