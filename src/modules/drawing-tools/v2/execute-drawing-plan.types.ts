/**
 * @module drawing-tools/v2/execute-drawing-plan.types
 * Phase 1 deliverable: type contracts for executeDrawingPlan.
 * Full executor implementation planned for Phase 2.
 */

import type { ToolResult } from '../types';

/** A single step within a drawing plan. */
export interface DrawingPlanStep {
  /** Tool function name, e.g. 'drawRect', 'createLayer'. */
  tool: string;
  /** Arguments passed to the tool dispatcher. */
  args: Record<string, unknown>;
  /** Optional human-readable label for TTS / debugging. */
  label?: string;
}

/** Input to executeDrawingPlan. */
export interface ExecuteDrawingPlanInput {
  /** Optional client-generated plan id for tracing. */
  planId?: string;
  /** Ordered list of tool invocations. */
  steps: DrawingPlanStep[];
  /**
   * When true, roll back all steps if any step fails.
   * Default false in Phase 2 MVP (partial success allowed).
   */
  atomic?: boolean;
}

/** Per-step error detail. */
export interface PlanStepError {
  stepIndex: number;
  tool: string;
  error: string;
}

/** Result returned by executeDrawingPlan. */
export interface ExecuteDrawingPlanResult {
  success: boolean;
  planId: string;
  completedSteps: number;
  totalSteps: number;
  results: ToolResult[];
  errors?: PlanStepError[];
}

/**
 * Phase 2 executor interface (stub — not implemented in Phase 1).
 */
export interface DrawingPlanExecutor {
  execute(input: ExecuteDrawingPlanInput): ExecuteDrawingPlanResult;
}
