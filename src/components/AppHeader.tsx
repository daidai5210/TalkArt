/**
 * Top navigation bar — TalkArt brand + status + portfolio.
 */

import React from 'react';
import type { AgentState } from '@/modules/ai-agent/types';
import { MaterialIcon } from './MaterialIcon';

interface AppHeaderProps {
  agentState: AgentState;
  onOpenHistory?: () => void;
}

function getStatusLabel(agentState: AgentState): string {
  switch (agentState) {
    case 'listening':
    case 'wake_word':
      return '小智在听你说…';
    case 'confirming':
      return '小智想确认一下';
    case 'executing':
      return '小智老师正在教你画画';
    case 'error':
      return '遇到了一点小问题';
    default:
      return '小智老师正在教你画画';
  }
}

export const AppHeader: React.FC<AppHeaderProps> = ({ agentState, onOpenHistory }) => {
  const statusLabel = getStatusLabel(agentState);
  const isActive =
    agentState === 'executing' ||
    agentState === 'listening' ||
    agentState === 'wake_word' ||
    agentState === 'confirming';

  return (
    <header className="bg-surface-container-low shadow-tactile-header w-full relative z-20 shrink-0">
      <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4">
        <div className="flex items-center gap-3">
          <MaterialIcon name="draw" className="text-primary text-4xl" filled />
          <span className="font-headline-xl text-primary tracking-tight text-[32px] md:text-headline-xl leading-none">
            TalkArt
          </span>
        </div>

        <div
          className={`hidden md:flex items-center px-6 py-2 rounded-full font-label-bold tactile-shadow-level-1 border-2 border-surface-container-lowest transition-colors ${
            isActive
              ? 'bg-secondary-container text-on-secondary-container'
              : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <MaterialIcon name="face_4" className="mr-2 text-xl" filled />
          {statusLabel}
        </div>

        {onOpenHistory ? (
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 text-on-secondary-container bg-secondary-container hover:bg-secondary hover:text-on-secondary transition-colors px-4 py-2 rounded-full tactile-active font-label-bold text-sm border-2 border-surface-container-lowest tactile-shadow-level-1"
            aria-label="我的作品集"
          >
            <MaterialIcon name="collections" className="text-2xl" filled />
            <span className="hidden sm:inline">作品集</span>
          </button>
        ) : (
          <div className="w-10" aria-hidden />
        )}
      </div>
    </header>
  );
};
