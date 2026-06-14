/**
 * Top navigation bar — TalkArt brand + status + profile.
 */

import React from 'react';
import type { AgentState } from '@/modules/ai-agent/types';
import { MaterialIcon } from './MaterialIcon';

interface AppHeaderProps {
  agentState: AgentState;
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

export const AppHeader: React.FC<AppHeaderProps> = ({ agentState }) => {
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

        <button
          type="button"
          className="text-on-surface-variant hover:bg-surface-container-high transition-colors p-2 rounded-full tactile-active flex items-center justify-center"
          aria-label="用户账户"
        >
          <MaterialIcon name="account_circle" className="text-3xl" />
        </button>
      </div>
    </header>
  );
};
