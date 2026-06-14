/** Three.js declarative scene JSON (pixel coords, top-left origin). */
export type ThreeStepJSON = {
  tag: string;
  name?: string;
  children?: ThreeStepJSON[];
  [key: string]: unknown;
};

import type { StepLayoutSpec } from '../leafer-renderer/step-layout-aligner';

export interface DrawingPlanStep {
  index: number;
  label: string;
  description: string;
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

/** Primitives the LLM may emit for each step. */
export const ALLOWED_THREE_TAGS = new Set([
  'Group',
  'Rect',
  'Plane',
  'Ellipse',
  'Circle',
  'Box',
  'Sphere',
  'Cylinder',
  'Cone',
  'Torus',
  'Ring',
  'Line',
  'Text',
]);
