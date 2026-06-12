/**
 * @component ConfirmationBubble
 * Chat-bubble style component for AI confirmation responses.
 *
 * Features:
 * - Purple-tinted background, left-aligned
 * - Shows during CONFIRMING state
 * - Smooth fade-in animation
 * - Displays the AI's confirmation question
 */

import React from 'react';

interface ConfirmationBubbleProps {
  /** The confirmation text from the AI. */
  confirmationText: string;
  /** Whether the agent is in the confirming state. */
  isVisible: boolean;
}

export const ConfirmationBubble: React.FC<ConfirmationBubbleProps> = ({
  confirmationText,
  isVisible,
}) => {
  if (!isVisible || !confirmationText) {
    return null;
  }

  return (
    <div
      className="flex items-start gap-2 animate-confirmationFadeIn"
      style={{ animation: 'confirmationFadeIn 0.4s ease-out' }}
      role="alert"
      aria-live="assertive"
    >
      {/* AI avatar indicator */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-talkart-primary/30 flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4 text-talkart-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <path d="M12 19v4" />
          <path d="M8 23h8" />
        </svg>
      </div>

      {/* Bubble content */}
      <div className="relative bg-talkart-primary/20 border border-talkart-primary/30 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-md">
        <p className="text-sm text-gray-100 leading-relaxed">
          {confirmationText}
        </p>
        {/* Subtle hint */}
        <p className="text-xs text-talkart-primary/60 mt-1.5">
          说「开始吧」确认，或「不对」修改
        </p>
      </div>

      <style>{`
        @keyframes confirmationFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};
