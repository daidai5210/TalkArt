/** Leafer JSON node (declarative scene graph). */
export type LeaferStepJSON = {
  tag: string;
  name?: string;
  children?: LeaferStepJSON[];
  [key: string]: unknown;
};

export interface DrawingPlanStep {
  index: number;
  label: string;
  description: string;
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
