/**
 * @component TranscriptPanel
 * Displays the current ASR transcript and AI conversation text.
 *
 * Shows:
 * - User speech: "你说：「...」"
 * - AI response: "小智：「...」"
 *
 * Features:
 * - Auto-scrolls to latest text
 * - Animated entrance for new messages
 * - Dark semi-transparent background
 */

import React, { useEffect, useRef } from 'react';
import type { ConversationMessage } from '@/store/agent-slice';

interface TranscriptPanelProps {
  /** Current interim/final ASR transcript. */
  currentTranscript: string;
  /** Conversation history messages. */
  conversation: ConversationMessage[];
  /** Whether the agent is currently listening. */
  isListening: boolean;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  currentTranscript,
  conversation,
  isListening,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation, currentTranscript]);

  // Only show the panel when there is content or we are listening
  const hasContent = conversation.length > 0 || currentTranscript.length > 0;

  if (!hasContent && !isListening) {
    return null;
  }

  return (
    <div
      className="bg-black/40 backdrop-blur-sm rounded-lg px-4 py-3 max-h-40 overflow-y-auto"
      ref={scrollRef}
      role="log"
      aria-label="对话记录"
      aria-live="polite"
    >
      {/* Conversation history */}
      {conversation.map((msg) => (
        <div
          key={msg.id}
          className="animate-fadeIn mb-2 last:mb-0"
          style={{
            animation: 'fadeIn 0.3s ease-in-out',
          }}
        >
          {msg.role === 'user' ? (
            <p className="text-sm text-talkart-success/90">
              <span className="font-semibold text-talkart-success">你说：</span>
              <span className="text-gray-200">「{msg.content}」</span>
            </p>
          ) : msg.role === 'assistant' ? (
            <p className="text-sm text-talkart-primary/90">
              <span className="font-semibold text-talkart-primary">小智：</span>
              <span className="text-gray-200">「{msg.content}」</span>
            </p>
          ) : null}
        </div>
      ))}

      {/* Current interim transcript */}
      {currentTranscript && (
        <div
          className="animate-fadeIn"
          style={{ animation: 'fadeIn 0.2s ease-in-out' }}
        >
          <p className="text-sm text-talkart-success/70">
            <span className="font-semibold text-talkart-success/80">你说：</span>
            <span className="text-gray-300/70">「{currentTranscript}」</span>
            {isListening && (
              <span className="inline-block w-1.5 h-4 bg-talkart-success/70 ml-1 animate-blink align-middle" />
            )}
          </p>
        </div>
      )}

      {/* Inline style for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </div>
  );
};
