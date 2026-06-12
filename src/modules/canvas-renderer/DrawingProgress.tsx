/**
 * @module canvas-renderer/DrawingProgress
 * 绘制进度指示器组件
 *
 * 显示当前绘制进度，包括进度条和状态信息。
 */

import React from 'react';
import type { DrawingProgress } from './StreamingExecutor';

interface DrawingProgressProps {
  progress: DrawingProgress | null;
}

/**
 * 绘制进度指示器
 */
export const DrawingProgressIndicator: React.FC<DrawingProgressProps> = ({ progress }) => {
  if (!progress || !progress.isDrawing) return null;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
      <div className="flex items-center gap-3">
        {/* 进度条 */}
        <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-talkart-primary transition-all duration-300 ease-out"
            style={{ width: `${progress.progress}%` }}
          />
        </div>

        {/* 进度文本 */}
        <span className="text-white text-xs font-medium whitespace-nowrap">
          {progress.message}
        </span>
      </div>
    </div>
  );
};