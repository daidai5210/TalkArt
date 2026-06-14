/**
 * Canvas context passed to LLM BFF for LeaferJS drawing.
 */

export interface CompletedStepContext {
  stepIndex: number;
  label: string;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  summary: string;
}

export interface PlanStepContext {
  index: number;
  label: string;
  description: string;
}

export interface CanvasContext {
  width: number;
  height: number;
  elements: Array<{ id: string; type: string; [key: string]: unknown }>;
  selectedId: string | null;
  /** Number of completed Leafer render steps on canvas. */
  element_count?: number;
  /** Spatial layout of steps already rendered on canvas. */
  completed_steps?: CompletedStepContext[];
  /** Full drawing plan for cross-step alignment. */
  plan_steps?: PlanStepContext[];
}
