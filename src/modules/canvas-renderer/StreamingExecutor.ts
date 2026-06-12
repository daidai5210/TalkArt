/**
 * @module canvas-renderer/StreamingExecutor
 * 流式代码执行器 - 支持渐进式绘制
 *
 * 将代码分段执行，实现绘制过程的可视化。
 */

import type { CanvasContext } from '../drawing-tools/types';
import type { ExecuteResult } from './CodeExecutor';
import { CodeExecutor } from './CodeExecutor';

/** 绘制进度状态 */
export interface DrawingProgress {
  isDrawing: boolean;
  progress: number; // 0-100
  currentStep: number;
  totalSteps: number;
  message: string;
}

/** 流式执行器 */
export class StreamingExecutor {
  private executor: CodeExecutor;
  private onProgress?: (progress: DrawingProgress) => void;

  constructor() {
    this.executor = new CodeExecutor();
  }

  /**
   * 绑定 Canvas
   */
  attach(canvas: HTMLCanvasElement): void {
    this.executor.attach(canvas);
  }

  /**
   * 设置进度回调
   */
  setOnProgress(callback: (progress: DrawingProgress) => void): void {
    this.onProgress = callback;
  }

  /**
   * 分段执行代码，实现渐进式绘制
   *
   * @param code - 完整代码
   * @param canvasContext - 画布上下文
   * @param chunkSize - 每段代码行数（默认 5）
   */
  async executeStreamed(
    code: string,
    canvasContext: CanvasContext,
    chunkSize: number = 5,
  ): Promise<ExecuteResult> {
    if (!code || code.trim().length === 0) {
      return {
        success: false,
        error: '绘图代码为空',
      };
    }

    const lines = code.split('\n');
    const chunks: string[] = [];

    // 按 chunkSize 分组
    for (let i = 0; i < lines.length; i += chunkSize) {
      chunks.push(lines.slice(i, i + chunkSize).join('\n'));
    }

    const totalSteps = chunks.length;
    let completedSteps = 0;

    // 通知开始
    this.reportProgress({
      isDrawing: true,
      progress: 0,
      currentStep: 0,
      totalSteps,
      message: '开始绘制...',
    });

    // 逐段执行
    for (let i = 0; i < chunks.length; i++) {
      const chunkCode = chunks.slice(0, i + 1).join('\n');

      const result = this.executor.execute(chunkCode, canvasContext);

      if (!result.success) {
        this.reportProgress({
          isDrawing: false,
          progress: 0,
          currentStep: i,
          totalSteps,
          message: `绘制失败: ${result.error}`,
        });
        return result;
      }

      completedSteps = i + 1;
      const progress = Math.round((completedSteps / totalSteps) * 100);

      this.reportProgress({
        isDrawing: true,
        progress,
        currentStep: completedSteps,
        totalSteps,
        message: `绘制中... ${progress}%`,
      });

      // 短暂延迟，实现动画效果
      await this.delay(100);
    }

    this.reportProgress({
      isDrawing: false,
      progress: 100,
      currentStep: totalSteps,
      totalSteps,
      message: '绘制完成!',
    });

    return {
      success: true,
      executedCommands: lines.length,
    };
  }

  /**
   * 报告进度
   */
  private reportProgress(progress: DrawingProgress): void {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}