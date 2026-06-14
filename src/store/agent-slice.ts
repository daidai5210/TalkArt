/**
 * @module store/agent-slice
 * Zustand slice for AI Agent + LeaferJS progressive drawing orchestration.
 */

import { StateCreator } from 'zustand';
import { AgentState, LLMResponse, ConversationManager } from '../modules/ai-agent';
import { LEAFER_TOOLS } from '../modules/ai-agent/llm-tool-selector';
import type { LLMFunctionCall } from '../modules/ai-agent/types';
import { isLLMServiceError } from '../modules/ai-agent/llm-response-utils';
import type { CanvasContext } from '../modules/ai-agent/canvas-context';
import type { CanvasSlice } from './canvas-slice';
import type { DrawingPlan } from '../modules/leafer-renderer/types';
import { getLeaferManager, stepDelayMs } from '../modules/leafer-renderer';
import {
  parseDrawingPlan,
  parseRenderLeaferStep,
} from '../modules/leafer-renderer/leafer-json-validator';
import {
  extractLeaferJsonBounds,
  summarizeLeaferJson,
} from '../modules/leafer-renderer/scene-bounds';
import {
  alignStepJsonToLayout,
  resolveStepLayoutTarget,
} from '../modules/leafer-renderer/step-layout-aligner';

/** Conversation message with metadata for UI display. */
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface AgentSlice {
  conversation: ConversationMessage[];
  agentState: AgentState;
  currentTranscript: string;
  confirmationText: string;
  error: string | null;

  setAgentState: (state: AgentState) => void;
  setTranscript: (text: string) => void;
  setConfirmation: (text: string) => void;
  setError: (error: string | null) => void;
  addMessage: (msg: Omit<ConversationMessage, 'id' | 'timestamp'>) => void;
  resetConversation: () => void;
  clearTranscript: () => void;

  processVoiceInput: (text: string) => Promise<void>;
  processConfirmation: (text: string) => Promise<void>;
  retryCurrentStep: () => Promise<void>;
}

let conversationManager: ConversationManager | null = null;

function getConversationManager(): ConversationManager {
  if (!conversationManager) {
    conversationManager = new ConversationManager('', LEAFER_TOOLS);
  }
  return conversationManager;
}

function buildCanvasContext(get: () => CanvasSlice & AgentSlice): CanvasContext {
  const state = get();
  return {
    width: state.canvasWidth,
    height: state.canvasHeight,
    elements: [],
    selectedId: null,
    element_count: state.leaferStepIds.length,
    completed_steps: state.completedStepLayouts.map((s) => ({
      stepIndex: s.stepIndex,
      label: s.label,
      bounds: s.bounds,
      summary: s.summary,
    })),
    plan_steps: state.drawingPlan?.steps.map((s) => ({
      index: s.index,
      label: s.label,
      description: s.description,
      layout: s.layout,
    })),
  };
}

function extractFunctionCall(response: LLMResponse): LLMFunctionCall | null {
  if (response.type === 'function_call' && response.function) {
    return response.function;
  }
  if (response.type === 'tool_calls' && response.tool_calls?.length) {
    return response.tool_calls[0];
  }
  return null;
}

const MAX_STEP_RETRIES = 2;

async function renderSingleStep(
  manager: ConversationManager,
  get: () => CanvasSlice & AgentSlice,
  userIntent: string,
  step: { index: number; label: string; description: string; layout?: DrawingPlan['steps'][0]['layout'] },
  totalSteps: number,
): Promise<{ success: boolean; error?: string }> {
  const {
    setDrawingProgress,
    pushLeaferStepId,
    setStepError,
    setPendingRetry,
  } = get();

  setStepError(null);
  setPendingRetry({
    userIntent,
    stepIndex: step.index,
    stepLabel: step.label,
    stepDescription: step.description,
  });

  setDrawingProgress({
    isDrawing: true,
    progress: Math.round((step.index / totalSteps) * 100),
    currentStep: step.index + 1,
    totalSteps,
    message: step.label,
  });

  for (let attempt = 0; attempt <= MAX_STEP_RETRIES; attempt++) {
    const canvasContext = buildCanvasContext(get);
    const response = await manager.renderStep(
      {
        userIntent,
        stepIndex: step.index,
        totalSteps,
        stepLabel: step.label,
        stepDescription: step.description,
        stepLayout: step.layout,
        completedSteps: canvasContext.completed_steps ?? [],
        planSteps: canvasContext.plan_steps ?? [],
      },
      canvasContext,
    );

    if (response.type === 'error' || isLLMServiceError(response.content)) {
      if (attempt < MAX_STEP_RETRIES) continue;
      return { success: false, error: response.content || 'AI 服务出错' };
    }

    const call = extractFunctionCall(response);
    if (!call) {
      if (attempt < MAX_STEP_RETRIES) continue;
      return { success: false, error: '模型未返回 renderLeaferStep' };
    }

    if (call.name === 'clearLeaferCanvas') {
      get().clearCanvas();
      return { success: true };
    }

    if (call.name !== 'renderLeaferStep') {
      if (attempt < MAX_STEP_RETRIES) continue;
      return { success: false, error: `意外的工具调用: ${call.name}` };
    }

    const parsed = parseRenderLeaferStep(call.arguments);
    if (!parsed) {
      if (attempt < MAX_STEP_RETRIES) continue;
      return { success: false, error: 'Leafer JSON 格式无效' };
    }

    const layoutTarget = resolveStepLayoutTarget(
      step.layout,
      get().completedStepLayouts,
    );
    const leaferJson = layoutTarget
      ? alignStepJsonToLayout(parsed.leaferJson, layoutTarget)
      : parsed.leaferJson;

    try {
      const stepId = await getLeaferManager().addStepWithFadeIn(
        leaferJson,
        step.index,
      );
      pushLeaferStepId(stepId);

      const bounds = extractLeaferJsonBounds(leaferJson);
      if (bounds) {
        get().pushStepLayout({
          stepIndex: step.index,
          label: step.label,
          bounds,
          summary: summarizeLeaferJson(leaferJson),
        });
      }

      setDrawingProgress({
        isDrawing: true,
        progress: Math.round(((step.index + 1) / totalSteps) * 100),
        currentStep: step.index + 1,
        totalSteps,
        message: `已完成：${step.label}`,
      });

      await new Promise((r) => setTimeout(r, stepDelayMs()));
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : '渲染失败';
      if (attempt < MAX_STEP_RETRIES) continue;
      return { success: false, error: msg };
    }
  }

  return { success: false, error: '步骤渲染失败' };
}

async function processProgressiveDrawing(
  get: () => CanvasSlice & AgentSlice,
  userIntent: string,
  addMessage: AgentSlice['addMessage'],
): Promise<{ success: boolean; error?: string }> {
  const {
    setDrawingPlan,
    setDrawingProgress,
    setStepError,
    setPendingRetry,
    clearCanvas,
    leaferStepIds,
  } = get();

  const manager = getConversationManager();
  const canvasContext = buildCanvasContext(get);

  if (/重新来|不对|不要了|清空/.test(userIntent) && leaferStepIds.length > 0) {
    clearCanvas();
  }

  setDrawingProgress({
    isDrawing: true,
    progress: 0,
    currentStep: 0,
    totalSteps: 0,
    message: '正在规划绘制步骤...',
  });

  const planResponse = await manager.planDrawing(userIntent, canvasContext, leaferStepIds.length);

  if (planResponse.type === 'error' || isLLMServiceError(planResponse.content)) {
    return { success: false, error: planResponse.content || '规划步骤失败' };
  }

  const planCall = extractFunctionCall(planResponse);
  if (!planCall || planCall.name !== 'planDrawingSteps') {
    return { success: false, error: '模型未返回绘制计划' };
  }

  const planData = parseDrawingPlan(planCall.arguments);
  if (!planData) {
    return { success: false, error: '绘制计划格式无效' };
  }

  const plan: DrawingPlan = {
    planId: planData.planId,
    totalSteps: planData.totalSteps,
    steps: planData.steps,
  };
  setDrawingPlan(plan);
  addMessage({
    role: 'assistant',
    content: `规划 ${plan.totalSteps} 个步骤：${plan.steps.map((s) => s.label).join(' → ')}`,
  });

  for (const step of plan.steps) {
    const result = await renderSingleStep(manager, get, userIntent, step, plan.totalSteps);
    if (!result.success) {
      setStepError(result.error || '步骤渲染失败');
      return result;
    }
  }

  setDrawingProgress(null);
  setStepError(null);
  setPendingRetry(null);
  addMessage({ role: 'assistant', content: '绘制完成！' });
  return { success: true };
}

export const createAgentSlice: StateCreator<CanvasSlice & AgentSlice, [], [], AgentSlice> = (
  set,
  get,
) => ({
  conversation: [],
  agentState: 'idle',
  currentTranscript: '',
  confirmationText: '',
  error: null,

  setAgentState: (agentState) => set({ agentState }),
  setTranscript: (currentTranscript) => set({ currentTranscript }),
  setConfirmation: (confirmationText) => set({ confirmationText }),
  setError: (error) => set({ error }),

  addMessage: (message) => {
    set((state) => ({
      conversation: [
        ...state.conversation,
        {
          ...message,
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          timestamp: Date.now(),
        },
      ],
    }));
  },

  resetConversation: () => {
    if (conversationManager) conversationManager.reset();
    set({ conversation: [], confirmationText: '', error: null, currentTranscript: '' });
  },

  clearTranscript: () => set({ currentTranscript: '' }),

  processVoiceInput: async (text: string) => {
    const { addMessage, setAgentState, setConfirmation, setError } = get();
    addMessage({ role: 'user', content: text });
    setAgentState('executing');
    setError(null);
    setConfirmation('');

    try {
      const outcome = await processProgressiveDrawing(get, text, addMessage);
      if (outcome.success) {
        setAgentState('idle');
      } else {
        setError(outcome.error || '绘图失败');
        setAgentState('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理语音输入时出错');
      setAgentState('error');
    }
  },

  processConfirmation: async (text: string) => {
    const { addMessage, setAgentState, setConfirmation, setError } = get();
    addMessage({ role: 'user', content: text });
    setAgentState('executing');
    setError(null);

    try {
      const outcome = await processProgressiveDrawing(get, text, addMessage);
      if (outcome.success) {
        setAgentState('idle');
        setConfirmation('');
      } else {
        setError(outcome.error || '绘图失败');
        setAgentState('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理确认时出错');
      setAgentState('error');
    }
  },

  retryCurrentStep: async () => {
    const {
      pendingRetry,
      drawingPlan,
      addMessage,
      setAgentState,
      setError,
      setStepError,
    } = get();

    if (!pendingRetry || !drawingPlan) {
      setError('没有可重试的步骤');
      return;
    }

    setAgentState('executing');
    setError(null);
    setStepError(null);

    const manager = getConversationManager();
    const step = {
      index: pendingRetry.stepIndex,
      label: pendingRetry.stepLabel,
      description: pendingRetry.stepDescription,
    };

    try {
      const result = await renderSingleStep(
        manager,
        get,
        pendingRetry.userIntent,
        step,
        drawingPlan.totalSteps,
      );

      if (result.success) {
        get().setDrawingProgress(null);
        setAgentState('idle');
        addMessage({ role: 'assistant', content: `重试成功：${step.label}` });
      } else {
        setStepError(result.error || '重试失败');
        setError(result.error || '重试失败');
        setAgentState('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '重试时出错');
      setAgentState('error');
    }
  },
});
