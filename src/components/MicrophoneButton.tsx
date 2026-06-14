/**
 * Large circular voice button — mint green with pulse halo.
 */

import React from 'react';
import type { AgentState } from '@/modules/ai-agent/types';
import { MaterialIcon } from './MaterialIcon';

interface MicrophoneButtonProps {
  agentState: AgentState;
  isListening: boolean;
  isSupported: boolean;
  disabled?: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  agentState,
  isListening,
  isSupported,
  disabled = false,
  onStartListening,
  onStopListening,
}) => {
  const handleClick = () => {
    if (disabled) return;
    if (isListening) onStopListening();
    else onStartListening();
  };

  const isListeningState = agentState === 'listening' || isListening;
  const isExecuting = agentState === 'executing';

  const getAriaLabel = (): string => {
    if (disabled) return '小智思考或绘制中，请稍候';
    if (!isSupported) return '语音识别不可用';
    if (isExecuting) return '正在绘制中';
    if (isListeningState) return '正在聆听，点击停止';
    return '点击开始语音输入';
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || (!isSupported && agentState !== 'error')}
      aria-label={getAriaLabel()}
      className={`
        fixed z-50 transition-all
        bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-12
        right-margin-mobile md:right-margin-desktop
        w-24 h-24 rounded-full flex items-center justify-center
        border-4 border-surface-container-lowest
        ${disabled ? 'bg-surface-variant text-on-surface-variant opacity-50 cursor-not-allowed shadow-none' : 'tactile-active shadow-[#005e2d] tactile-button-shadow'}
        ${!disabled && isSupported && !isListeningState && !isExecuting ? 'bg-primary-container text-on-primary-container pulse-halo' : ''}
        ${!disabled && isListeningState ? 'bg-tertiary text-on-tertiary pulse-halo' : ''}
        ${!disabled && isExecuting ? 'bg-secondary-container text-on-secondary-container' : ''}
      `}
    >
      {disabled ? (
        <MaterialIcon name="hourglass_top" className="text-4xl animate-pulse" />
      ) : isExecuting ? (
        <MaterialIcon name="brush" className="text-5xl animate-pulse" filled />
      ) : isListeningState ? (
        <MaterialIcon name="stop" className="text-5xl" filled />
      ) : (
        <MaterialIcon name="mic" className="text-5xl" filled />
      )}
    </button>
  );
};
