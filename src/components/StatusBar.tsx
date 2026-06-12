/**
 * @component StatusBar
 * Bottom status bar showing the current agent state and canvas info.
 *
 * Displays:
 * - Current state with Chinese label: "等待唤醒..." / "我在听..." / "确认中..." / "正在画..."
 * - Color-coded indicator dot
 * - Element count on canvas
 */

import React from 'react';
import type { AgentState } from '@/modules/ai-agent/types';

interface StatusBarProps {
  /** Current agent state. */
  agentState: AgentState;
  /** Number of elements on the canvas. */
  elementCount: number;
  /** Optional error message. */
  error?: string | null;
}

/** Map agent states to display labels. */
const STATE_LABELS: Record<AgentState, string> = {
  idle: '等待唤醒...',
  wake_word: '我在听...',
  listening: '我在听...',
  confirming: '确认中...',
  executing: '正在画...',
  error: '出错了',
};

/** Map agent states to indicator dot colors. */
const STATE_DOT_COLORS: Record<AgentState, string> = {
  idle: 'bg-gray-400',
  wake_word: 'bg-talkart-success',
  listening: 'bg-talkart-success animate-pulse',
  confirming: 'bg-talkart-primary animate-pulse',
  executing: 'bg-talkart-warning animate-pulse',
  error: 'bg-talkart-error',
};

export const StatusBar: React.FC<StatusBarProps> = ({
  agentState,
  elementCount,
  error,
}) => {
  const showError = agentState === 'error' && error;
  const label = showError ? STATE_LABELS.error : STATE_LABELS[agentState];
  const dotColor = showError ? STATE_DOT_COLORS.error : STATE_DOT_COLORS[agentState];

  return (
    <div
      className="flex items-center justify-between px-4 py-2 bg-talkart-surface/80 backdrop-blur-sm border-t border-gray-700/30"
      role="status"
      aria-live="polite"
      aria-label={`状态: ${label}`}
    >
      {/* State indicator */}
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
        <span className="text-sm text-gray-300">{label}</span>
        {showError && (
          <span className="text-xs text-talkart-error ml-1">({error})</span>
        )}
      </div>

      {/* Element count */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <svg
          viewBox="0 0 24 24"
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
        <span>
          {elementCount} 个元素
        </span>
      </div>
    </div>
  );
};
