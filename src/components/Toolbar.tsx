/**
 * @component Toolbar
 * Canvas toolbar for LeaferJS drawing.
 */

import React from 'react';

interface ToolbarProps {
  stepCount: number;
  canUndo: boolean;
  onUndo: () => void;
  onClear: () => void;
  onExportSVG: () => void;
  onExportPNG: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  stepCount,
  canUndo,
  onUndo,
  onClear,
  onExportSVG,
  onExportPNG,
}) => {
  const hasContent = stepCount > 0;

  return (
    <div
      className="flex items-center justify-between px-4 py-2 bg-talkart-surface/60 border-t border-gray-700/30"
      role="toolbar"
      aria-label="画布工具栏"
    >
      <div className="flex items-center gap-2">
        <ToolbarButton
          onClick={onUndo}
          disabled={!canUndo}
          label="撤销上一步"
          icon={
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          }
        />
        <div className="w-px h-5 bg-gray-700/50 mx-1" />
        <ToolbarButton
          onClick={onClear}
          disabled={!hasContent}
          label="清空"
          danger
          icon={
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          }
        />
      </div>

      <div className="flex items-center gap-2">
        <ToolbarButton
          onClick={onExportSVG}
          disabled={!hasContent}
          label="导出 SVG"
          icon={
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          }
        />
        <ToolbarButton
          onClick={onExportPNG}
          disabled={!hasContent}
          label="导出 PNG"
          icon={
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          }
        />
      </div>
    </div>
  );
};

interface ToolbarButtonProps {
  onClick: () => void;
  disabled: boolean;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  disabled,
  label,
  icon,
  danger = false,
}) => {
  const baseClasses = 'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-talkart-primary/50';
  const enabledClasses = danger
    ? 'bg-red-900/30 hover:bg-red-900/50 text-talkart-error'
    : 'bg-gray-700/50 hover:bg-gray-700/70 text-gray-300';
  const disabledClasses = 'bg-gray-800/30 text-gray-600 cursor-not-allowed';

  return (
    <button
      type="button"
      className={`${baseClasses} ${disabled ? disabledClasses : enabledClasses}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};
