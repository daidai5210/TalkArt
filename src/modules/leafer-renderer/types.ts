/** Leafer JSON node (declarative scene graph). */
export type LeaferStepJSON = {
  tag: string;
  name?: string;
  children?: LeaferStepJSON[];
  [key: string]: unknown;
};

import type { StepLayoutSpec } from './step-layout-aligner';

export interface DrawingPlanStep {
  index: number;
  label: string;
  description: string;
  /** Planned spatial anchor — enforced by code-side aligner after LLM render. */
  layout?: StepLayoutSpec;
}

export interface DrawingPlan {
  planId: string;
  totalSteps: number;
  steps: DrawingPlanStep[];
}

export interface StepProgress {
  isDrawing: boolean;
  progress: number;
  currentStep: number;
  totalSteps: number;
  message: string;
}

export const ALLOWED_LEAFER_TAGS = new Set([
  'Group',
  'Box',
  'Frame',
  'Rect',
  'Ellipse',
  'Line',
  'Polygon',
  'Star',
  'Path',
  'Pen',
  'Text',
  'Image',
  'Canvas',
]);
