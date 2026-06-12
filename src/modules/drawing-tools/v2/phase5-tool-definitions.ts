/**
 * Phase 5 tool definitions for LLM function calling.
 */

import type { ToolDefinition } from '../tool-definitions';

export const PHASE5_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'insertImage',
      description:
        '在画布插入图片素材（预设占位图或 URL）。用于包装插图区、logo 占位等。非文生图，仅插入已有素材。',
      parameters: {
        type: 'object',
        properties: {
          position: {
            type: 'object',
            description: '位置：语义或精确 x,y',
          },
          width: { type: 'number', description: '宽度' },
          height: { type: 'number', description: '高度' },
          unit: { type: 'string', enum: ['mm', 'px'], description: '尺寸单位，默认 mm' },
          presetId: {
            type: 'string',
            enum: ['bowl', 'logo-placeholder'],
            description: '预设素材 id',
          },
          src: { type: 'string', description: '图片 URL 或 data URL' },
          layerId: { type: 'string', description: '目标图层 id' },
        },
        required: ['position', 'width', 'height'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'setFillGradient',
      description: '为矩形、圆、椭圆、三角形等设置线性渐变填充（如红到橙）。',
      parameters: {
        type: 'object',
        properties: {
          elementId: { type: 'string', description: '元素 id' },
          description: { type: 'string', description: '元素描述，用于选中' },
          gradient: {
            type: 'object',
            properties: {
              from: { type: 'string', description: '起始色（中文或十六进制）' },
              to: { type: 'string', description: '结束色' },
              direction: {
                type: 'string',
                enum: ['horizontal', 'vertical'],
                description: '渐变方向，默认 vertical',
              },
            },
            required: ['from', 'to'],
          },
        },
        required: ['gradient'],
      },
    },
  },
];
