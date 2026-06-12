import type { ExecuteDrawingPlanInput } from '../v2/execute-drawing-plan.types';

/** Well-spaced yellow cat plan — regression baseline for drawing quality (iter R1). */
export const YELLOW_CAT_PLAN_FIXTURE: ExecuteDrawingPlanInput = {
  steps: [
    {
      tool: 'drawEllipse',
      label: '1.黄色身体',
      args: {
        position: { x: 75, y: 85, unit: 'mm' },
        size: { width: 55, height: 40, unit: 'mm' },
        style: { fill: '#FFD700', stroke: '#333333', strokeWidth: 1 },
      },
    },
    {
      tool: 'drawCircle',
      label: '2.头部',
      args: {
        position: { x: 88, y: 45, unit: 'mm' },
        r: 18,
        unit: 'mm',
        style: { fill: '#FFD700', stroke: '#333333', strokeWidth: 1 },
      },
    },
    {
      tool: 'drawTriangle',
      label: '3.左耳',
      args: {
        position: { x: 82, y: 32, unit: 'mm' },
        size: { width: 12, height: 14, unit: 'mm' },
        style: { fill: '#FFD700', stroke: '#333333', strokeWidth: 1 },
      },
    },
    {
      tool: 'drawTriangle',
      label: '4.右耳',
      args: {
        position: { x: 108, y: 32, unit: 'mm' },
        size: { width: 12, height: 14, unit: 'mm' },
        style: { fill: '#FFD700', stroke: '#333333', strokeWidth: 1 },
      },
    },
    {
      tool: 'drawCircle',
      label: '5.左眼',
      args: {
        position: { x: 92, y: 52, unit: 'mm' },
        r: 3,
        unit: 'mm',
        style: { fill: '#000000' },
      },
    },
    {
      tool: 'drawCircle',
      label: '6.右眼',
      args: {
        position: { x: 108, y: 52, unit: 'mm' },
        r: 3,
        unit: 'mm',
        style: { fill: '#000000' },
      },
    },
    {
      tool: 'drawTriangle',
      label: '7.鼻子',
      args: {
        position: { x: 100, y: 60, unit: 'mm' },
        size: { width: 6, height: 5, unit: 'mm' },
        style: { fill: '#FF69B4' },
      },
    },
    {
      tool: 'drawLine',
      label: '8.尾巴',
      args: {
        start: { x: 125, y: 95, unit: 'mm' },
        end: { x: 145, y: 75, unit: 'mm' },
        stroke: '#333333',
        strokeWidth: 2,
      },
    },
  ],
};
