/**
 * @component MicrophoneButton
 * Large circular button with microphone icon for voice control.
 *
 * Visual states:
 * - idle: Green background, static mic icon
 * - listening: Red pulsing background, animated mic icon
 * - confirming: Purple background, question mark overlay
 * - executing: Spinning animation, gear icon
 *
 * Click to manually start/stop listening (fallback to wake word).
 * Accessible: aria-label, role="button", keyboard support (Enter/Space).
 */

import React from 'react';
import type { AgentState } from '@/modules/ai-agent/types';

interface MicrophoneButtonProps {
  /** Current agent state, determines button appearance. */
  agentState: AgentState;
  /** Whether the microphone is currently active. */
  isListening: boolean;
  /** Whether the browser supports microphone STT input. */
  isSupported: boolean;
  /** Callback to start listening. */
  onStartListening: () => void;
  /** Callback to stop listening. */
  onStopListening: () => void;
  /** Optional error message to display. */
  error?: string | null;
}

/** SVG microphone icon path. */
const MIC_ICON_PATH = 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8';

/** SVG stop icon (square). */
const STOP_ICON_PATH = 'M6 6h12v12H6z';

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  agentState,
  isListening,
  isSupported,
  onStartListening,
  onStopListening,
  error,
}) => {
  const handleClick = () => {
    if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Determine visual state
  const isIdle = agentState === 'idle' || agentState === 'wake_word';
  const isListeningState = agentState === 'listening';
  const isConfirmingState = agentState === 'confirming';
  const isExecutingState = agentState === 'executing';
  const isError = agentState === 'error';

  // Build class names based on state
  const buttonClasses = [
    'relative w-16 h-16 rounded-full flex items-center justify-center',
    'transition-all duration-300 ease-in-out',
    'focus:outline-none focus:ring-4 focus:ring-talkart-primary/50',
    'cursor-pointer select-none',
    // State-specific styles
    isIdle && !error && 'bg-talkart-success hover:bg-talkart-success/80 shadow-lg shadow-talkart-success/30',
    isListeningState && 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/40 animate-pulse',
    isConfirmingState && 'bg-talkart-primary hover:bg-talkart-primary/80 shadow-lg shadow-talkart-primary/30',
    isExecutingState && 'bg-talkart-warning hover:bg-talkart-warning/80 shadow-lg shadow-talkart-warning/30',
    isError && 'bg-talkart-error hover:bg-talkart-error/80 shadow-lg shadow-talkart-error/30',
    !isSupported && 'bg-gray-600 cursor-not-allowed opacity-50',
  ]
    .filter(Boolean)
    .join(' ');

  // Determine aria label
  const getAriaLabel = (): string => {
    if (!isSupported) return '语音识别不可用';
    if (isError) return `出错: ${error || '未知错误'}，点击重试`;
    if (isExecutingState) return '正在执行绘图...';
    if (isConfirmingState) return '等待确认，点击停止';
    if (isListeningState) return '正在聆听，点击停止';
    return '点击开始语音输入';
  };

  // Determine icon color
  const iconColor = 'white';

  return (
    <button
      type="button"
      className={buttonClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={getAriaLabel()}
      disabled={!isSupported && !isError}
      tabIndex={0}
    >
      {/* Executing state: spinning ring */}
      {isExecutingState && (
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white border-r-white animate-spin" />
      )}

      {/* Icon */}
      <svg
        viewBox="0 0 24 24"
        className={`w-7 h-7 fill-none stroke-current ${isExecutingState ? 'animate-spin' : ''}`}
        stroke={iconColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {isListeningState || isConfirmingState ? (
          // Stop icon when listening
          <path d={STOP_ICON_PATH} fill={iconColor} stroke="none" />
        ) : isExecutingState ? (
          // Gear-like icon for executing
          <>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </>
        ) : (
          // Microphone icon for idle/error
          <path d={MIC_ICON_PATH} />
        )}
      </svg>

      {/* Listening pulse ring */}
      {isListeningState && (
        <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-75" />
      )}
    </button>
  );
};
