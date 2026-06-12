/**
 * @module canvas-renderer/ErrorHandler
 * 错误分类、用户友好提示和恢复策略
 */

/** 错误类型枚举 */
export type ErrorType =
  | 'syntax'        // 语法错误（解析失败）
  | 'runtime'       // 运行时错误（执行中异常）
  | 'timeout'       // 超时错误
  | 'empty'         // 空代码
  | 'uninitialized'  // Canvas 未初始化
  | 'unknown';       // 未知错误

/** 错误分析报告 */
export interface ErrorReport {
  type: ErrorType;
  rawMessage: string;
  friendlyMessage: string;
  recoverable: boolean;
  suggestion: string;
  errorLine?: number;
}

/** 错误分类规则表 */
const ERROR_PATTERNS: Array<{
  match: (msg: string) => boolean;
  type: ErrorType;
  friendly: string;
  suggestion: string;
  recoverable: boolean;
}> = [
  {
    match: (msg) => /unexpected token|unexpected end|Unterminated string|missing \)|Unexpected end/i.test(msg),
    type: 'syntax',
    friendly: '代码语法有误，正在尝试修复...',
    suggestion: '检查括号是否匹配、字符串是否正确闭合',
    recoverable: true,
  },
  {
    match: (msg) => /is not defined|Cannot read propert|undefined|null is not/i.test(msg),
    type: 'runtime',
    friendly: '执行时遇到未定义的变量，正在调整...',
    suggestion: '确保使用的变量和函数已正确定义',
    recoverable: true,
  },
  {
    match: (msg) => /timeout|超时/i.test(msg),
    type: 'timeout',
    friendly: '绘图代码执行时间过长，正在简化...',
    suggestion: '减少循环次数或简化图形复杂度',
    recoverable: true,
  },
  {
    match: (msg) => /canvas/i.test(msg),
    type: 'uninitialized',
    friendly: '画布未准备好，请稍后再试',
    suggestion: '等待画布初始化完成后重试',
    recoverable: false,
  },
  {
    match: () => true,
    type: 'runtime',
    friendly: '绘图过程中遇到一些问题，正在尝试修复...',
    suggestion: '请稍后重试或简化绘图内容',
    recoverable: true,
  },
];

/**
 * 分析错误并生成友好报告
 */
export function analyzeError(errorMessage: string, errorLine?: number): ErrorReport {
  // Auto-extract line number if not provided
  let resolvedLine = errorLine;
  if (resolvedLine === undefined) {
    const lineMatch = errorMessage.match(/line (\d+)/i);
    if (lineMatch) {
      resolvedLine = parseInt(lineMatch[1], 10);
    }
  }

  const pattern = ERROR_PATTERNS.find((p) => p.match(errorMessage));

  if (!pattern) {
    return {
      type: 'unknown',
      rawMessage: errorMessage,
      friendlyMessage: '绘图遇到未知错误',
      recoverable: false,
      suggestion: '请检查代码后重试',
      errorLine: resolvedLine,
    };
  }

  return {
    type: pattern.type,
    rawMessage: errorMessage,
    friendlyMessage: pattern.friendly,
    recoverable: pattern.recoverable,
    suggestion: pattern.suggestion,
    errorLine: resolvedLine,
  };
}

/**
 * 根据错误类型生成 LLM 修复提示
 */
export function buildRepairPrompt(code: string, errorReport: ErrorReport): string {
  const repairInstructions: Record<ErrorType, string> = {
    syntax: '代码存在语法错误，请修复语法问题。确保所有括号匹配、字符串正确闭合、语句以分号结束。',
    runtime: '代码执行时出现运行时错误。请检查使用的变量是否已定义，函数调用是否正确。',
    timeout: '代码执行超时，请简化代码逻辑，减少循环次数或优化算法。',
    empty: '代码为空，请重新生成完整的绘图代码。',
    uninitialized: '画布未初始化，请在代码开头确保 Canvas 已准备好。',
    unknown: '代码执行出错，请检查并修复问题。',
  };

  let errorLocation = '';
  if (errorReport.errorLine !== undefined) {
    errorLocation = `\n错误大约出现在第 ${errorReport.errorLine} 行。`;
  }

  return `绘图代码执行失败。

错误类型：${errorReport.type}
错误信息：${errorReport.rawMessage}${errorLocation}

${repairInstructions[errorReport.type]}

原始代码：
\`\`\`javascript
${code}
\`\`\`

请修复代码后返回完整的新代码。`;
}
