import type { GeometryKind } from './geometry-catalog';
import type { StepLayoutSpec } from '../leafer-renderer/step-layout-aligner';

/** Single Three.js primitive emitted by LLM via renderThreeStep tool. */
export interface ThreePrimitive {
  kind: GeometryKind;
  x: number;
  y: number;
  z?: number;
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  radiusTop?: number;
  radiusBottom?: number;
  tube?: number;
  innerRadius?: number;
  outerRadius?: number;
  toX?: number;
  toY?: number;
  rotation?: number;
  color?: string;
  opacity?: number;
  roughness?: number;
  metalness?: number;
  strokeWidth?: number;
}

/** Parsed renderThreeStep tool output. */
export interface ThreeStepSpec {
  stepIndex: number;
  label: string;
  primitives: ThreePrimitive[];
}

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
