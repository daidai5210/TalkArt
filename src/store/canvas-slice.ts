import { StateCreator } from 'zustand';
import type { StepLayoutRecord } from '../modules/three-renderer/scene-bounds';
import type { DrawingPlan, StepProgress } from '../modules/three-renderer/primitive-types';
import { getThreeManager } from '../modules/three-renderer';

export interface CanvasState {
  canvasWidth: number;
  canvasHeight: number;
  drawingPlan: DrawingPlan | null;
  drawingProgress: StepProgress | null;
  leaferStepIds: string[];
  /** Spatial records for completed render steps (for LLM alignment). */
  completedStepLayouts: StepLayoutRecord[];
  stepError: string | null;
  /** Context for retrying the failed step */
  pendingRetry: {
    userIntent: string;
    stepIndex: number;
    stepLabel: string;
    stepDescription: string;
  } | null;
}

export interface CanvasSlice extends CanvasState {
  setDrawingPlan: (plan: DrawingPlan | null) => void;
  setDrawingProgress: (progress: StepProgress | null) => void;
  pushLeaferStepId: (stepId: string) => void;
  pushStepLayout: (layout: StepLayoutRecord) => void;
  setStepError: (error: string | null) => void;
  setPendingRetry: (ctx: CanvasState['pendingRetry']) => void;
  undoLastStep: () => void;
  clearCanvas: () => void;
  getStepCount: () => number;
}

export const createCanvasSlice: StateCreator<CanvasSlice> = (set, get) => ({
  canvasWidth: 800,
  canvasHeight: 600,
  drawingPlan: null,
  drawingProgress: null,
  leaferStepIds: [],
  completedStepLayouts: [],
  stepError: null,
  pendingRetry: null,

  setDrawingPlan: (drawingPlan) => set({ drawingPlan }),

  setDrawingProgress: (drawingProgress) => set({ drawingProgress }),

  pushLeaferStepId: (stepId) => {
    set((state) => ({ leaferStepIds: [...state.leaferStepIds, stepId] }));
  },

  pushStepLayout: (layout) => {
    set((state) => ({
      completedStepLayouts: [...state.completedStepLayouts, layout],
    }));
  },

  setStepError: (stepError) => set({ stepError }),

  setPendingRetry: (pendingRetry) => set({ pendingRetry }),

  undoLastStep: () => {
    const removed = getThreeManager().undoLastStep();
    if (removed) {
      set((state) => ({
        leaferStepIds: state.leaferStepIds.slice(0, -1),
        completedStepLayouts: state.completedStepLayouts.slice(0, -1),
      }));
    }
  },

  clearCanvas: () => {
    getThreeManager().clear();
    set({
      leaferStepIds: [],
      completedStepLayouts: [],
      drawingPlan: null,
      drawingProgress: null,
      stepError: null,
      pendingRetry: null,
    });
  },

  getStepCount: () => get().leaferStepIds.length,
});
