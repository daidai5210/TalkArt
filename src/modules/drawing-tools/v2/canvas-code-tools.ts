/**
 * @module drawing-tools/v2/canvas-code-tools
 * Canvas 代码生成工具定义
 *
 * 提供 executeCanvasCode 工具，
 * 支持 LLM 生成 JavaScript Canvas 绘图代码。
 */

import type { ToolDefinition } from '../tool-definitions';
import type { CanvasContext, ToolResult } from '../types';

/**
 * executeCanvasCode 工具定义
 *
 * 让 LLM 生成 Canvas 2D API 代码，
 * 用于绘制复杂图形（小猫、小狗、人物等）。
 */
export const EXECUTE_CANVAS_CODE_DEFINITION: ToolDefinition = {
  type: 'function',
  function: {
    name: 'executeCanvasCode',
    description:
      '执行 Canvas 2D 绘图代码。用于绘制复杂图形（如小猫、小狗、人物、建筑等）或需要自由绘制的场景。' +
      '使用 Canvas API（ctx.beginPath, ctx.arc, ctx.moveTo, ctx.lineTo, ctx.bezierCurveTo 等）绘制。' +
      '支持语义位置函数：center(), topLeft(), topRight(), bottomLeft(), bottomRight()。' +
      '支持中文颜色：color("红色"), color("蓝色") 等。' +
      '画布宽高可通过 width, height 变量获取。',
    parameters: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description:
            'JavaScript Canvas 绘图代码。使用 ctx（CanvasRenderingContext2D）绘制。' +
            '示例：\n' +
            '// 绘制红色圆形\n' +
            'const pos = center();\n' +
            'ctx.fillStyle = color("红色");\n' +
            'ctx.beginPath();\n' +
            'ctx.arc(pos.x, pos.y, 50, 0, Math.PI * 2);\n' +
            'ctx.fill();',
        },
        description: {
          type: 'string',
          description: '绘图内容描述（可选），用于确认对话和历史记录',
        },
      },
      required: ['code'],
    },
  },
};

/**
 * 执行 Canvas 绘图代码
 *
 * @param context - 画布上下文
 * @param params - 参数，包含 code 字段
 * @returns 工具执行结果
 */
export function executeCanvasCode(
  _context: CanvasContext,
  params: { code: string; description?: string },
): ToolResult {
  const { code, description } = params;

  if (!code || code.trim().length === 0) {
    return {
      success: false,
      error: '绘图代码为空',
    };
  }

  // 返回成功结果，实际执行由 CanvasLayer 组件完成
  // Store 会保存代码并触发重新渲染
  return {
    success: true,
    elementId: `canvas-code-${Date.now()}`,
    // 特殊标记，告诉 Store 这是 Canvas 代码
    element: {
      id: `canvas-code-${Date.now()}`,
      type: 'canvasCode',
      props: {
        code,
        description: description || 'Canvas 绘图',
      },
    },
  };
}

/**
 * 所有 Canvas 代码工具定义
 */
export const CANVAS_CODE_TOOL_DEFINITIONS: ToolDefinition[] = [
  EXECUTE_CANVAS_CODE_DEFINITION,
];