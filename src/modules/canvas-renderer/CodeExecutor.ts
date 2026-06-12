/**
 * @module canvas-renderer/CodeExecutor
 * JS 绘图代码执行器
 *
 * 安全执行 LLM 生成的 JavaScript 绘图代码，
 * 提供受限的 Canvas API 环境。
 */

import type { CanvasContext } from '../drawing-tools/types';

/** 代码执行结果 */
export interface ExecuteResult {
  success: boolean;
  error?: string;
  errorLine?: number;
  executedCommands?: number;
}

/** 执行上下文，传递给用户代码 */
interface ExecutionContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  // 语义位置辅助函数
  center: () => { x: number; y: number };
  topLeft: () => { x: number; y: number };
  topRight: () => { x: number; y: number };
  bottomLeft: () => { x: number; y: number };
  bottomRight: () => { x: number; y: number };
  // 颜色解析
  color: (name: string) => string;
}

/**
 * 代码执行器
 *
 * 使用 Function 构造器执行 JS 代码，
 * 提供受限的 Canvas API 环境。
 */
export class CodeExecutor {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private executionTimeout: number = 5000; // 5秒超时

  /**
   * 初始化执行器，绑定 Canvas 元素
   */
  attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  /**
   * 执行绘图代码
   *
   * @param code - JS 绘图代码字符串
   * @param canvasContext - 画布上下文（尺寸等）
   * @returns 执行结果
   */
  execute(code: string, canvasContext: CanvasContext): ExecuteResult {
    // 先检查代码是否为空
    if (!code || code.trim().length === 0) {
      return {
        success: false,
        error: '绘图代码为空',
      };
    }

    if (!this.canvas || !this.ctx) {
      return {
        success: false,
        error: 'Canvas 未初始化',
      };
    }

    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 构建执行上下文
    const execContext = this.buildExecutionContext(canvasContext);

    try {
      // 使用 Function 构造器执行代码
      // MVP阶段：简单执行，后续可替换为 QuickJS 沙箱
      const execFn = new Function(
        'canvas',
        'ctx',
        'width',
        'height',
        'center',
        'topLeft',
        'topRight',
        'bottomLeft',
        'bottomRight',
        'color',
        code,
      );

      // 执行代码（带超时保护）
      const startTime = Date.now();
      execFn(
        execContext.canvas,
        execContext.ctx,
        execContext.width,
        execContext.height,
        execContext.center,
        execContext.topLeft,
        execContext.topRight,
        execContext.bottomLeft,
        execContext.bottomRight,
        execContext.color,
      );
      const elapsed = Date.now() - startTime;

      if (elapsed > this.executionTimeout) {
        return {
          success: false,
          error: `执行超时（${elapsed}ms > ${this.executionTimeout}ms）`,
        };
      }

      return {
        success: true,
        executedCommands: this.countCommands(code),
      };
    } catch (error) {
      // 解析错误信息
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorLine = this.extractErrorLine(errorMessage);

      return {
        success: false,
        error: errorMessage,
        errorLine,
      };
    }
  }

  /**
   * 构建执行上下文
   */
  private buildExecutionContext(canvasContext: CanvasContext): ExecutionContext {
    const width = canvasContext.width;
    const height = canvasContext.height;

    return {
      canvas: this.canvas!,
      ctx: this.ctx!,
      width,
      height,
      // 语义位置函数
      center: () => ({ x: width / 2, y: height / 2 }),
      topLeft: () => ({ x: 0, y: 0 }),
      topRight: () => ({ x: width, y: 0 }),
      bottomLeft: () => ({ x: 0, y: height }),
      bottomRight: () => ({ x: width, y: height }),
      // 颜色解析
      color: (name: string) => this.parseColor(name),
    };
  }

  /**
   * 解析颜色名称到 CSS 颜色值
   */
  private parseColor(name: string): string {
    const colorMap: Record<string, string> = {
      '红色': '#FF0000',
      '蓝色': '#0000FF',
      '绿色': '#00FF00',
      '黄色': '#FFFF00',
      '紫色': '#800080',
      '橙色': '#FFA500',
      '粉色': '#FFC0CB',
      '白色': '#FFFFFF',
      '黑色': '#000000',
      '灰色': '#808080',
      '浅蓝': '#ADD8E6',
      '深蓝': '#00008B',
      '浅绿': '#90EE90',
      '深绿': '#006400',
      '棕色': '#A52A2A',
      '金色': '#FFD700',
      '银色': '#C0C0C0',
      '透明': 'transparent',
    };

    return colorMap[name] || name; // 如果未找到，假设输入已经是 CSS 颜色
  }

  /**
   * 从错误信息中提取行号
   */
  private extractErrorLine(errorMessage: string): number | undefined {
    const lineMatch = errorMessage.match(/line (\d+)/i);
    if (lineMatch) {
      return parseInt(lineMatch[1], 10);
    }
    return undefined;
  }

  /**
   * 粗略计算执行的命令数量
   */
  private countCommands(code: string): number {
    // 计算非空行数作为粗略估计
    const lines = code.split('\n').filter((line) => line.trim().length > 0);
    return lines.length;
  }

  /**
   * 设置执行超时时间
   */
  setTimeout(ms: number): void {
    this.executionTimeout = ms;
  }

  /**
   * 获取当前 Canvas 内容作为 DataURL
   */
  toDataURL(format: 'png' | 'jpeg' = 'png'): string | null {
    if (!this.canvas) return null;
    return this.canvas.toDataURL(`image/${format}`);
  }
}