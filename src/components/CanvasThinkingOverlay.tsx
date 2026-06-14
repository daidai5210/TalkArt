/**
 * Canvas overlay — shown while Xiao Zhi is planning/thinking.
 * Pure CSS/SVG animation (no extra animation library).
 */

import React from 'react';

interface CanvasThinkingOverlayProps {
  visible: boolean;
  message?: string;
}

export const CanvasThinkingOverlay: React.FC<CanvasThinkingOverlayProps> = ({
  visible,
  message = '小智思考中…',
}) => {
  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface-container-lowest/85 backdrop-blur-[2px] rounded-[3rem]"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="thinking-scene relative w-48 h-24 mb-6">
        {/* Ground line */}
        <div className="absolute bottom-2 left-0 right-0 h-1 bg-outline-variant/40 rounded-full" />

        {/* Running character */}
        <svg
          className="thinking-runner absolute bottom-3 left-0 w-16 h-16 text-primary"
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden
        >
          <circle cx="32" cy="14" r="10" fill="#74B9FF" stroke="#0060ac" strokeWidth="2" />
          <rect x="24" y="24" width="16" height="18" rx="4" fill="#FFD93D" stroke="#FF9F43" strokeWidth="2" />
          <path
            className="thinking-leg-left"
            d="M28 42 L22 54"
            stroke="#006d36"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            className="thinking-leg-right"
            d="M36 42 L42 54"
            stroke="#006d36"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            className="thinking-arm-left"
            d="M24 28 L16 36"
            stroke="#006d36"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            className="thinking-arm-right"
            d="M40 28 L48 36"
            stroke="#006d36"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>

        {/* Pencil trail dots */}
        <div className="thinking-dots absolute bottom-6 left-20 flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-secondary-container"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>

      <p className="font-headline-lg-mobile text-primary mb-2">{message}</p>
      <p className="font-body-md text-on-surface-variant animate-pulse">正在想怎么教你画…</p>

      <style>{`
        .thinking-runner {
          animation: runner-move 1.6s ease-in-out infinite;
        }
        @keyframes runner-move {
          0%, 100% { transform: translateX(20px); }
          50% { transform: translateX(120px); }
        }
        .thinking-leg-left {
          transform-origin: 28px 42px;
          animation: leg-swing 0.4s ease-in-out infinite alternate;
        }
        .thinking-leg-right {
          transform-origin: 36px 42px;
          animation: leg-swing 0.4s ease-in-out infinite alternate-reverse;
        }
        .thinking-arm-left {
          transform-origin: 24px 28px;
          animation: arm-swing 0.4s ease-in-out infinite alternate-reverse;
        }
        .thinking-arm-right {
          transform-origin: 40px 28px;
          animation: arm-swing 0.4s ease-in-out infinite alternate;
        }
        @keyframes leg-swing {
          from { transform: rotate(-18deg); }
          to { transform: rotate(18deg); }
        }
        @keyframes arm-swing {
          from { transform: rotate(-22deg); }
          to { transform: rotate(22deg); }
        }
        .thinking-dots span {
          animation: dot-bounce 0.6s ease-in-out infinite;
        }
        @keyframes dot-bounce {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};
