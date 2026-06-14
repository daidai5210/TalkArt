/**
 * Xiao Zhi teacher speech bubble — Level 3 floating dialog.
 */

import React from 'react';
import { MaterialIcon } from './MaterialIcon';

interface XiaoZhiBubbleProps {
  message: string;
  animate?: boolean;
}

export const XiaoZhiBubble: React.FC<XiaoZhiBubbleProps> = ({ message, animate = true }) => {
  if (!message) return null;

  return (
    <div
      className={`bg-surface-container-lowest rounded-[2rem] p-6 ambient-float-shadow relative self-start md:self-center ml-4 md:ml-0 mb-2 z-30 max-w-md border-2 border-surface-container ${
        animate ? 'animate-gentle-bounce' : ''
      }`}
      role="status"
      aria-live="polite"
    >
      <div
        className="absolute -bottom-4 left-10 w-0 h-0 border-l-[16px] border-l-transparent border-t-[16px] border-t-surface-container-lowest border-r-[16px] border-r-transparent drop-shadow-sm"
        aria-hidden
      />
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-secondary-container rounded-full flex items-center justify-center shrink-0 border-[3px] border-surface-container-lowest tactile-shadow-level-1">
          <MaterialIcon
            name="smart_toy"
            className="text-on-secondary-container text-3xl"
            filled
          />
        </div>
        <p className="font-headline-lg-mobile text-on-surface leading-tight">{message}</p>
      </div>
    </div>
  );
};
