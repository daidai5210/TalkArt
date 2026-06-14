import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './index';

describe('Store (Leafer canvas slice)', () => {
  beforeEach(() => {
    useStore.setState({
      leaferStepIds: [],
      drawingPlan: null,
      drawingProgress: null,
      stepError: null,
      pendingRetry: null,
      agentState: 'idle',
      error: null,
      conversation: [],
    });
  });

  it('initializes with empty leafer steps', () => {
    const state = useStore.getState();
    expect(state.leaferStepIds).toEqual([]);
    expect(state.canvasWidth).toBe(800);
    expect(state.canvasHeight).toBe(600);
  });

  it('tracks leafer step ids', () => {
    useStore.getState().pushLeaferStepId('step-0');
    useStore.getState().pushLeaferStepId('step-1');
    expect(useStore.getState().leaferStepIds).toHaveLength(2);
  });

  it('clears canvas state', () => {
    useStore.getState().pushLeaferStepId('step-0');
    useStore.getState().setDrawingPlan({
      planId: 'p1',
      totalSteps: 1,
      steps: [{ index: 0, label: 'test', description: 'test' }],
    });
    useStore.getState().clearCanvas();
    const state = useStore.getState();
    expect(state.leaferStepIds).toEqual([]);
    expect(state.drawingPlan).toBeNull();
  });

  it('sets drawing progress', () => {
    useStore.getState().setDrawingProgress({
      isDrawing: true,
      progress: 50,
      currentStep: 1,
      totalSteps: 2,
      message: '画身体',
    });
    expect(useStore.getState().drawingProgress?.message).toBe('画身体');
  });
});
