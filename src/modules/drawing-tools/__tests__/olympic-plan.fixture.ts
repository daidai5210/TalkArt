import type { ExecuteDrawingPlanInput } from '../v2/execute-drawing-plan.types';

/** Simplified Olympic rings + China flag plan for integration testing. */
export const OLYMPIC_FLAG_PLAN_FIXTURE: ExecuteDrawingPlanInput = {
  steps: [
    {
      tool: 'drawCircle',
      args: { position: { semantic: 'center-left' }, radius: 25, unit: 'mm', style: { stroke: '#0081C8', strokeWidth: 3, fill: 'none' } },
    },
    {
      tool: 'drawCircle',
      args: { position: { x: 120, y: 150, unit: 'mm' }, radius: 25, unit: 'mm', style: { stroke: '#000000', strokeWidth: 3, fill: 'none' } },
    },
    {
      tool: 'drawCircle',
      args: { position: { x: 180, y: 150, unit: 'mm' }, radius: 25, unit: 'mm', style: { stroke: '#EE334E', strokeWidth: 3, fill: 'none' } },
    },
    {
      tool: 'drawCircle',
      args: { position: { x: 90, y: 120, unit: 'mm' }, radius: 25, unit: 'mm', style: { stroke: '#F4C300', strokeWidth: 3, fill: 'none' } },
    },
    {
      tool: 'drawCircle',
      args: { position: { x: 150, y: 120, unit: 'mm' }, radius: 25, unit: 'mm', style: { stroke: '#00A651', strokeWidth: 3, fill: 'none' } },
    },
    {
      tool: 'drawRect',
      args: {
        position: { x: 220, y: 80, unit: 'mm' },
        size: { width: 60, height: 40, unit: 'mm' },
        style: { fill: '#DE2910' },
      },
    },
    {
      tool: 'drawRect',
      args: {
        position: { x: 225, y: 85, unit: 'mm' },
        size: { width: 20, height: 15, unit: 'mm' },
        style: { fill: '#FFDE00' },
      },
    },
  ],
};
