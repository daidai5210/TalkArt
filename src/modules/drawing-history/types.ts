import type { ThreePrimitive } from '../three-renderer/primitive-types';

export interface SavedDrawingStep {
  label: string;
  primitives: ThreePrimitive[];
}

export interface SavedDrawing {
  id: string;
  title: string;
  userIntent: string;
  createdAt: string;
  thumbnail: string;
  canvasWidth: number;
  canvasHeight: number;
  steps: SavedDrawingStep[];
  planSteps?: Array<{ label: string }>;
}

export interface DrawingSummary {
  id: string;
  title: string;
  userIntent: string;
  createdAt: string;
  thumbnail: string;
}
