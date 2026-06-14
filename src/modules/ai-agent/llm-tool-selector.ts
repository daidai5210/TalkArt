/**
 * Select sketch drawing tools for LLM requests by phase.
 */

import {
  PLAN_DRAWING_STEPS_DEFINITION,
  RENDER_SKETCH_STEP_DEFINITION,
  CLEAR_THREE_CANVAS_DEFINITION,
} from './three-tool-definitions';

export const DRAWING_INTENT_PATTERN =
  /画|绘|绘制|帮我画|帮我做|做一|生成|圆|方|三角|猫|狗|鸟|花|树|人|车|五环|奥运|国旗|包装/i;

export const PLANNING_TOOLS = [PLAN_DRAWING_STEPS_DEFINITION];
export const RENDER_TOOLS = [RENDER_SKETCH_STEP_DEFINITION];
export const THREE_TOOLS = [
  PLAN_DRAWING_STEPS_DEFINITION,
  RENDER_SKETCH_STEP_DEFINITION,
  CLEAR_THREE_CANVAS_DEFINITION,
];

/** @deprecated use THREE_TOOLS */
export const LEAFER_TOOLS = THREE_TOOLS;

export function isDrawingRequest(text: string): boolean {
  return DRAWING_INTENT_PATTERN.test(text);
}

export function selectToolsForRequest(_allTools: unknown[], userText: string): unknown[] {
  if (isDrawingRequest(userText)) {
    return THREE_TOOLS;
  }
  return THREE_TOOLS;
}

export function isComplexDrawingRequest(text: string): boolean {
  return isDrawingRequest(text);
}

/** @deprecated use THREE_TOOLS */
export const COMPACT_DRAWING_TOOLS = THREE_TOOLS;
