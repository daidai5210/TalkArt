/**
 * @module paper-renderer/PaperCanvas
 * Paper.js Canvas 管理器
 *
 * 管理 Paper.js 项目和视图，提供高级绘图 API。
 */

import paper from 'paper';
import type { CanvasContext } from '../drawing-tools/types';

/** Paper.js 项目状态 */
export interface PaperState {
  isInitialized: boolean;
  project: paper.Project | null;
  view: paper.View | null;
}

/**
 * Paper.js Canvas 管理器
 *
 * 单例模式，管理 Paper.js 项目实例。
 */
export class PaperCanvas {
  private state: PaperState = {
    isInitialized: false,
    project: null,
    view: null,
  };

  private canvas: HTMLCanvasElement | null = null;

  /**
   * 初始化 Paper.js 项目
   *
   * @param canvas - Canvas 元素
   */
  initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    paper.setup(canvas);
    this.state.project = paper.project;
    this.state.view = paper.view;
    this.state.isInitialized = true;
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.state.isInitialized;
  }

  /**
   * 获取 Paper.js 项目
   */
  getProject(): paper.Project | null {
    return this.state.project;
  }

  /**
   * 获取 Paper.js 视图
   */
  getView(): paper.View | null {
    return this.state.view;
  }

  /**
   * 清空画布
   */
  clear(): void {
    if (this.state.project) {
      this.state.project.clear();
    }
  }

  /**
   * 获取画布尺寸
   */
  getSize(): { width: number; height: number } {
    if (this.canvas) {
      return {
        width: this.canvas.width,
        height: this.canvas.height,
      };
    }
    return { width: 800, height: 600 };
  }

  /**
   * 导出为 SVG 字符串
   */
  exportSVG(): string | null {
    if (this.state.project) {
      return this.state.project.exportSVG({ asString: true }) as string;
    }
    return null;
  }

  /**
   * 导出为 PNG DataURL
   */
  exportPNG(): string | null {
    if (this.canvas) {
      return this.canvas.toDataURL('image/png');
    }
    return null;
  }

  /**
   * 更新视图
   */
  updateView(): void {
    if (this.state.view) {
      this.state.view.update();
    }
  }

  /**
   * 获取当前 Paper.js scope（用于执行代码）
   */
  getScope(): paper.PaperScope {
    return paper;
  }
}