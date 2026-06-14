/**
 * Mobile bottom navigation — undo / reset / save.
 */

import React from 'react';
import { MaterialIcon } from './MaterialIcon';

interface MobileBottomNavProps {
  canUndo: boolean;
  hasContent: boolean;
  onUndo: () => void;
  onClear: () => void;
  onSave: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  canUndo,
  hasContent,
  onUndo,
  onClear,
  onSave,
}) => (
  <nav
    className="fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-margin-mobile py-4 pb-safe md:hidden bg-surface-container-lowest border-t-2 border-outline-variant shadow-nav-top rounded-t-[2rem]"
    aria-label="画布操作"
  >
    <button
      type="button"
      onClick={onUndo}
      disabled={!canUndo}
      className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-2 hover:bg-surface-container-high rounded-2xl transition-colors tactile-active disabled:opacity-40"
    >
      <MaterialIcon name="undo" className="text-3xl mb-1" />
      <span className="font-label-bold text-sm">撤销</span>
    </button>
    <button
      type="button"
      onClick={onClear}
      disabled={!hasContent}
      className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-2 hover:bg-surface-container-high rounded-2xl transition-colors tactile-active disabled:opacity-40"
    >
      <MaterialIcon name="restart_alt" className="text-3xl mb-1" />
      <span className="font-label-bold text-sm">重画</span>
    </button>
    <button
      type="button"
      onClick={onSave}
      disabled={!hasContent}
      className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-2 hover:bg-surface-container-high rounded-2xl transition-colors tactile-active disabled:opacity-40"
    >
      <MaterialIcon name="save" className="text-3xl mb-1" />
      <span className="font-label-bold text-sm">保存</span>
    </button>
  </nav>
);
