import { StateCreator } from 'zustand';
import type { DrawingPlan, StepProgress } from '../modules/leafer-renderer/types';
import { getLeaferManager } from '../modules/leafer-renderer';

export interface CanvasState {
  canvasWidth: number;
  canvasHeight: number;
  drawingPlan: DrawingPlan | null;
  drawingProgress: StepProgress | null;
  leaferStepIds: string[];
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
  stepError: null,
  pendingRetry: null,

  setDrawingPlan: (drawingPlan) => set({ drawingPlan }),

  setDrawingProgress: (drawingProgress) => set({ drawingProgress }),

  pushLeaferStepId: (stepId) => {
    set((state) => ({ leaferStepIds: [...state.leaferStepIds, stepId] }));
  },

  setStepError: (stepError) => set({ stepError }),

  setPendingRetry: (pendingRetry) => set({ pendingRetry }),

  undoLastStep: () => {
    const removed = getLeaferManager().undoLastStep();
    if (removed) {
      set((state) => ({
        leaferStepIds: state.leaferStepIds.slice(0, -1),
      }));
    }
  },

  clearCanvas: () => {
    getLeaferManager().clear();
    set({
      leaferStepIds: [],
      drawingPlan: null,
      drawingProgress: null,
      stepError: null,
      pendingRetry: null,
    });
  },

  getStepCount: () => get().leaferStepIds.length,
});
