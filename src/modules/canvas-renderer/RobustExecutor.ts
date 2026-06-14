/**
 * @module canvas-renderer/RobustExecutor
 * 健壮执行器 - 带自动重试和错误恢复的代码执行器
 */

import type { CanvasContext } from '../drawing-tools/types';
import { CodeExecutor, type ExecuteResult } from './CodeExecutor';
import { analyzeError, type ErrorReport } from './ErrorHandler';

/** 重试配置 */
export interface RetryConfig {
  maxRetries: number;        // 最大重试次数（默认 2）
  backoffMs: number;         // 初始退避时间（默认 500ms）
  backoffMultiplier: number; // 退避倍率（默认 2）
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  backoffMs: 500,
  backoffMultiplier: 2,
};

/** 健壮执行结果 */
export interface RobustExecuteResult extends ExecuteResult {
  /** 尝试次数 */
  attempts: number;
  /** 错误分析报告（仅失败时） */
  errorReport?: ErrorReport;
}

/**
 * 健壮执行器
 *
 * 在 CodeExecutor 之上添加：
 * - 自动重试（指数退避）
 * - 错误分类分析
 * - 修复回调支持
 */
export class RobustExecutor {
  private executor: CodeExecutor;
  private config: RetryConfig;
  private onRepairRequest?: (code: string, errorReport: ErrorReport) => Promise<string>;

  constructor(config?: Partial<RetryConfig>) {
    this.executor = new CodeExecutor();
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * 绑定 Canvas
   */
  attach(canvas: HTMLCanvasElement): void {
    this.executor.attach(canvas);
  }

  /**
   * 设置修复回调（当代码执行失败且可修复时调用）
   */
  setOnRepairRequest(callback: (code: string, errorReport: ErrorReport) => Promise<string>): void {
    this.onRepairRequest = callback;
  }

  /**
   * 执行代码，带自动重试和修复
   */
  async execute(code: string, canvasContext: CanvasContext): Promise<RobustExecuteResult> {
    if (!code || code.trim().length === 0) {
      return {
        success: false,
        error: '绘图代码为空',
        attempts: 0,
        errorReport: analyzeError('绘图代码为空'),
      };
    }

    let currentCode = code;
    let lastResult: ExecuteResult | null = null;
    let lastErrorReport: ErrorReport | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      const result = this.executor.execute(currentCode, canvasContext);
      lastResult = result;

      if (result.success) {
        return {
          ...result,
          attempts: attempt + 1,
        };
      }

      // 分析错误
      const errorReport = analyzeError(result.error || '', result.errorLine);
      lastErrorReport = errorReport;

      // 不可恢复的错误，直接返回
      if (!errorReport.recoverable) {
        return {
          ...result,
          attempts: attempt + 1,
          errorReport,
        };
      }

      // 还有重试机会，尝试修复
      if (attempt < this.config.maxRetries) {
        // 先尝试等待重试（指数退避）
        const waitTime = this.config.backoffMs * Math.pow(this.config.backoffMultiplier, attempt);
        await this.delay(waitTime);

        // 如果有修复回调，先尝试修复代码
        if (this.onRepairRequest) {
          try {
            const repairedCode = await this.onRepairRequest(currentCode, errorReport);
            if (repairedCode && repairedCode.trim().length > 0) {
              currentCode = repairedCode;
              continue; // 用修复后的代码重试
            }
          } catch {
            // 修复失败，继续用原代码重试
          }
        }

        // 没有修复回调或修复失败，用原代码重试
        continue;
      }
    }

    // 所有重试失败
    return {
      ...lastResult!,
      attempts: this.config.maxRetries + 1,
      errorReport: lastErrorReport!,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
