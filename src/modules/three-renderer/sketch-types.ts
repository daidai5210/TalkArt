import type { StepLayoutSpec } from '../leafer-renderer/step-layout-aligner';

export type SketchPoint = [number, number];

export type SketchMark =
  | {
      kind: 'line';
      from: SketchPoint;
      to: SketchPoint;
      stroke?: string;
      width?: number;
      opacity?: number;
    }
  | {
      kind: 'polyline';
      points: SketchPoint[];
      stroke?: string;
      width?: number;
      opacity?: number;
    }
  | {
      kind: 'curve';
      points: SketchPoint[];
      stroke?: string;
      width?: number;
      opacity?: number;
    }
  | {
      kind: 'ellipse';
      center: SketchPoint;
      rx: number;
      ry: number;
      stroke?: string;
      fill?: string;
      width?: number;
      opacity?: number;
    }
  | {
      kind: 'polygon';
      points: SketchPoint[];
      stroke?: string;
      fill?: string;
      width?: number;
      opacity?: number;
    }
  | {
      kind: 'dot';
      center: SketchPoint;
      r: number;
      fill?: string;
      opacity?: number;
    };

export interface SketchStepSpec {
  stepIndex: number;
  label: string;
  marks: SketchMark[];
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
