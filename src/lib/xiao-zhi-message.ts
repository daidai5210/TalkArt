/**
 * Derive Xiao Zhi teacher dialogue from app state.
 */

import type { AgentState } from '@/modules/ai-agent/types';
import type { ConversationMessage } from '@/store/agent-slice';
import type { StepProgress } from '@/modules/leafer-renderer/types';

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
        return '太棒了！我们继续下一步吧！';
      }
      if (/^第 \d+/.test(msg) || msg.includes('步')) {
        return `现在让我们${msg.replace(/^第 \d+\/\d+ 步[：:]?\s*/, '')}吧！`;
      }
      return `现在让我们${msg}吧！`;
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
      return '哇，你画完啦！要不要保存起来？';
    }
    return lastAssistant.content;
  }

  return '你好！告诉我你想画什么，我们一起一步一步画出来吧！';
}
