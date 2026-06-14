/**
 * Desktop pill control bar — undo / reset / save / download.
 */

import React from 'react';
import { MaterialIcon } from './MaterialIcon';

interface DesktopControlBarProps {
  canUndo: boolean;
  hasContent: boolean;
  onUndo: () => void;
  onClear: () => void;
  onSave: () => void;
  onDownload: () => void;
}

export const DesktopControlBar: React.FC<DesktopControlBarProps> = ({
  canUndo,
  hasContent,
  onUndo,
  onClear,
  onSave,
  onDownload,
}) => (
  <div className="hidden md:flex items-center gap-6 lg:gap-8 mt-8 bg-surface-container-lowest px-6 lg:px-8 py-4 rounded-full border-2 border-outline-variant tactile-shadow-level-1 flex-wrap justify-center">
    <button
      type="button"
      onClick={onUndo}
      disabled={!canUndo}
      className="flex items-center gap-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high px-4 py-2 rounded-2xl transition-all font-label-bold tactile-active disabled:opacity-40 disabled:pointer-events-none"
    >
      <MaterialIcon name="undo" className="text-3xl" />
      撤销这一步
    </button>
    <div className="w-px h-8 bg-surface-container-highest" aria-hidden />
    <button
      type="button"
      onClick={onClear}
      disabled={!hasContent}
      className="flex items-center gap-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high px-4 py-2 rounded-2xl transition-all font-label-bold tactile-active disabled:opacity-40 disabled:pointer-events-none"
    >
      <MaterialIcon name="restart_alt" className="text-3xl" />
      重画
    </button>
    <div className="w-px h-8 bg-surface-container-highest" aria-hidden />
    <button
      type="button"
      onClick={onSave}
      disabled={!hasContent}
      className="flex items-center gap-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high px-4 py-2 rounded-2xl transition-all font-label-bold tactile-active disabled:opacity-40 disabled:pointer-events-none"
    >
      <MaterialIcon name="save" className="text-3xl" />
      保存作品
    </button>
    <div className="w-px h-8 bg-surface-container-highest" aria-hidden />
    <button
      type="button"
      onClick={onDownload}
      disabled={!hasContent}
      className="flex items-center gap-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high px-4 py-2 rounded-2xl transition-all font-label-bold tactile-active disabled:opacity-40 disabled:pointer-events-none"
    >
      <MaterialIcon name="download" className="text-3xl" />
      下载图片
    </button>
  </div>
);
