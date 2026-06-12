/**
 * Phase 6: Kangshifu package plan fixture for integration-style tests.
 */

import type { ExecuteDrawingPlanInput } from '../v2/execute-drawing-plan.types';

export const KANGSHIFU_PLAN_FIXTURE: ExecuteDrawingPlanInput = {
  description: '方便面包装正面示意',
  steps: [
    {
      tool: 'setCanvasSize',
      args: { width: 90, height: 120, unit: 'mm' },
    },
    {
      tool: 'drawRect',
      args: {
        position: { x: 0, y: 0 },
        size: { width: 90, height: 40 },
        unit: 'mm',
        style: { fill: '红色' },
      },
    },
    {
      tool: 'drawRect',
      args: {
        position: { x: 0, y: 40 },
        size: { width: 90, height: 80 },
        unit: 'mm',
        style: { fill: '#FFF8E0' },
      },
    },
    {
      tool: 'insertImage',
      args: {
        position: { x: 25, y: 45 },
        width: 40,
        height: 28,
        unit: 'mm',
        presetId: 'bowl',
      },
    },
    {
      tool: 'drawText',
      args: {
        position: { x: 30, y: 95 },
        text: '红烧牛肉面',
        style: { fill: '黄色', fontSize: 16 },
      },
    },
  ],
};
