import type { StepLayoutSpec } from '../leafer-renderer/step-layout-aligner';
import type { SceneLayer } from './scene-composition';

export interface ThreePrimitive {
  kind: import('./geometry-catalog').GeometryKind;
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

export interface ThreeStepSpec {
  stepIndex: number;
  label: string;
  primitives: ThreePrimitive[];
}

export interface DrawingPlanStep {
  index: number;
  label: string;
  description: string;
  layer: SceneLayer;
  grounded?: boolean;
  layout?: StepLayoutSpec;
}

export interface DrawingPlan {
  planId: string;
  totalSteps: number;
  scene: import('./scene-composition').SceneMeta;
  steps: DrawingPlanStep[];
}

export interface StepProgress {
  isDrawing: boolean;
  progress: number;
  currentStep: number;
  totalSteps: number;
  message: string;
}
