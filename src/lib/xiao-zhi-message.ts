/**
 * Derive Xiao Zhi teacher dialogue from app state.
 */

import type { AgentState } from '@/modules/ai-agent/types';
import type { ConversationMessage } from '@/store/agent-slice';
import type { StepProgress } from '@/modules/leafer-renderer/types';

/** Build a natural「先画 xxx」instruction from a step label. */
export function formatStepDrawGuide(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return '现在让我们开始画吧！';
  if (/^画/.test(trimmed)) return `现在让我们${trimmed}吧！`;
  if (/^添加|^加上|^画上/.test(trimmed)) return `现在让我们${trimmed}吧！`;
  return `现在让我们先画${trimmed}吧！`;
}

export function getXiaoZhiMessage(params: {
  agentState: AgentState;
  drawingProgress: StepProgress | null;
  confirmationText: string;
  currentTranscript: string;
  isListening: boolean;
  stepError: string | null;
  conversation: ConversationMessage[];
}): string {
  const {
    agentState,
    drawingProgress,
    confirmationText,
    currentTranscript,
    isListening,
    stepError,
    conversation,
  } = params;

  if (stepError) {
    return '这一步没画好，我们再试一次吧！';
  }

  if (agentState === 'confirming' && confirmationText) {
    return confirmationText;
  }

  if (drawingProgress?.isDrawing) {
    if (drawingProgress.message === '正在规划绘制步骤...') {
      return '小智正在想怎么教你画…';
    }
    if (drawingProgress.message) {
      const msg = drawingProgress.message;
      if (/^已完成：/.test(msg)) {
        const label = msg.replace(/^已完成：/, '').trim();
        return `太棒了！${label}画好了，我们继续下一步吧！`;
      }
      // Current step label (e.g. "头部", "耳朵")
      return formatStepDrawGuide(msg);
    }
  }

  if (isListening && currentTranscript) {
    return `我听到啦：「${currentTranscript}」`;
  }

  if (agentState === 'listening' || agentState === 'wake_word') {
    return '我在听，告诉我你想画什么～';
  }

  if (agentState === 'error') {
    return '哎呀，出了点小问题，我们再试一次吧！';
  }

  const lastAssistant = [...conversation].reverse().find((m) => m.role === 'assistant');
  if (lastAssistant && agentState === 'idle') {
    if (/规划 \d+ 个步骤/.test(lastAssistant.content)) {
      return '步骤准备好啦，跟着小智一步一步画吧！';
    }
    if (lastAssistant.content === '绘制完成！') {
      return '哇，你画完啦！快点击保存作品，把它放进作品集吧！';
    }
    if (lastAssistant.content.includes('已保存')) {
      return lastAssistant.content;
    }
    return lastAssistant.content;
  }

  return '你好！告诉我你想画什么，我们一起一步一步画出来吧！';
}
