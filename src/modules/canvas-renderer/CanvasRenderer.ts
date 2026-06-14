/**
 * @module canvas-renderer/CanvasRenderer
 * Canvas 渲染管理器
 *
 * 管理 Canvas 渲染层的整体流程，
 * 包括代码执行、渲染更新、导出等。
 */

import { CodeExecutor, type ExecuteResult } from './CodeExecutor';
import type { CanvasContext } from '../drawing-tools/types';

/** 渲染状态 */
export interface RenderState {
  isRendering: boolean;
  lastResult: ExecuteResult | null;
  renderCount: number;
}

/**
 * Canvas 渲染管理器
 *
 * 单例模式，管理整个 Canvas 渲染流程。
 */
export class CanvasRenderer {
  private executor: CodeExecutor;
  private state: RenderState;
  private onStateChange?: (state: RenderState) => void;

  constructor() {
    this.executor = new CodeExecutor();
    this.state = {
      isRendering: false,
      lastResult: null,
      renderCount: 0,
    };
  }

  /**
   * 绑定 Canvas 元素
   */
  attach(canvas: HTMLCanvasElement): void {
    this.executor.attach(canvas);
  }

  /**
   * 执行绘图代码
   */
  render(code: string, canvasContext: CanvasContext): ExecuteResult {
    this.state.isRendering = true;
    this.notifyStateChange();

    const result = this.executor.execute(code, canvasContext);

    this.state.isRendering = false;
    this.state.lastResult = result;
    this.state.renderCount++;
    this.notifyStateChange();

    return result;
  }

  /**
   * 清空 Canvas
   */
  clear(): void {
    if (!this.state.lastResult) return;
    // 执行空代码清空画布
    this.executor.execute('', {
      width: 800,
      height: 600,
      elements: [],
      selectedId: null,
    });
    this.state.lastResult = null;
    this.state.renderCount = 0;
    this.notifyStateChange();
  }

  /**
   * 获取当前状态
   */
  getState(): RenderState {
    return { ...this.state };
  }

  /**
   * 设置状态变化回调
   */
  setOnStateChange(callback: (state: RenderState) => void): void {
    this.onStateChange = callback;
  }

  /**
   * 通知状态变化
   */
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  /**
   * 导出为 PNG
   */
  exportPNG(): string | null {
    return this.executor.toDataURL('png');
  }

  /**
   * 导出为 JPEG
   */
  exportJPEG(): string | null {
    return this.executor.toDataURL('jpeg');
  }

  /**
   * 设置执行超时
   */
  setTimeout(ms: number): void {
    this.executor.setTimeout(ms);
  }
}