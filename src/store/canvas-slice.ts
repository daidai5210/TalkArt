import { StateCreator } from 'zustand';
import type { StepLayoutRecord } from '../modules/three-renderer/scene-bounds';
import type { DrawingPlan, StepProgress } from '../modules/three-renderer/primitive-types';
import type { SavedDrawingStep } from '../modules/drawing-history/types';
import { getThreeManager } from '../modules/three-renderer';

export interface CanvasState {
  canvasWidth: number;
  canvasHeight: number;
  drawingPlan: DrawingPlan | null;
  drawingProgress: StepProgress | null;
  leaferStepIds: string[];
  /** Spatial records for completed render steps (for LLM alignment). */
  completedStepLayouts: StepLayoutRecord[];
  /** Serialized primitives per step — for save/restore. */
  savedStepData: SavedDrawingStep[];
  /** Original user request for current session. */
  currentUserIntent: string;
  /** All steps rendered and idle — show save/undo controls. */
  drawingSessionComplete: boolean;
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
  pushStepData: (step: SavedDrawingStep) => void;
  setCurrentUserIntent: (intent: string) => void;
  setDrawingSessionComplete: (complete: boolean) => void;
  loadSavedDrawingOnCanvas: (steps: SavedDrawingStep[], planLabels?: string[]) => void;
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
  savedStepData: [],
  currentUserIntent: '',
  drawingSessionComplete: false,
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

  pushStepData: (step) => {
    set((state) => ({
      savedStepData: [...state.savedStepData, step],
    }));
  },

  setCurrentUserIntent: (currentUserIntent) => set({ currentUserIntent }),

  setDrawingSessionComplete: (drawingSessionComplete) => set({ drawingSessionComplete }),

  loadSavedDrawingOnCanvas: (steps, planLabels) => {
    getThreeManager().loadFromSavedSteps(steps);
    const stepIds = steps.map((_, i) => `step-${i}`);
    const layouts = steps.map((s, i) => ({
      stepIndex: i,
      label: s.label,
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
      summary: s.label,
    }));
    set({
      leaferStepIds: stepIds,
      savedStepData: steps,
      completedStepLayouts: layouts,
      drawingSessionComplete: true,
      drawingProgress: null,
      stepError: null,
      pendingRetry: null,
      drawingPlan: planLabels
        ? {
            planId: `restored-${Date.now()}`,
            totalSteps: planLabels.length,
            scene: { groundLineY: 492 },
            steps: planLabels.map((label, index) => ({
              index,
              label,
              description: label,
              layer: 'structure' as const,
            })),
          }
        : null,
    });
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
      savedStepData: [],
      drawingPlan: null,
      drawingProgress: null,
      drawingSessionComplete: false,
      stepError: null,
      pendingRetry: null,
    });
  },

  getStepCount: () => get().leaferStepIds.length,
});
