/**
 * @module canvas-renderer/__tests__/ErrorHandler.test
 * Tests for error classification and repair prompt generation
 */

import { describe, it, expect } from 'vitest';
import { analyzeError, buildRepairPrompt, type ErrorReport } from '../ErrorHandler';

describe('analyzeError', () => {
  it('classifies syntax errors', () => {
    const report = analyzeError('Unexpected token }');
    expect(report.type).toBe('syntax');
    expect(report.recoverable).toBe(true);
    expect(report.friendlyMessage).toContain('语法');
  });

  it('classifies undefined variable errors', () => {
    const report = analyzeError('foo is not defined');
    expect(report.type).toBe('runtime');
    expect(report.recoverable).toBe(true);
  });

  it('classifies Cannot read property errors', () => {
    const report = analyzeError("Cannot read property 'x' of undefined");
    expect(report.type).toBe('runtime');
    expect(report.recoverable).toBe(true);
  });

  it('classifies timeout errors', () => {
    const report = analyzeError('Execution timeout 超时');
    expect(report.type).toBe('timeout');
    expect(report.recoverable).toBe(true);
  });

  it('classifies canvas errors as uninitialized', () => {
    const report = analyzeError('canvas getContext failed');
    expect(report.type).toBe('uninitialized');
    expect(report.recoverable).toBe(false);
  });

  it('classifies unknown errors as runtime by default', () => {
    const report = analyzeError('some random error message');
    expect(report.type).toBe('runtime');
    expect(report.recoverable).toBe(true);
  });

  it('extracts error line number', () => {
    const report = analyzeError('Error at line 42');
    expect(report.errorLine).toBe(42);
  });

  it('returns undefined line when not present', () => {
    const report = analyzeError('Some error without line number');
    expect(report.errorLine).toBeUndefined();
  });
});

describe('buildRepairPrompt', () => {
  it('generates repair prompt for syntax errors', () => {
    const code = 'ctx.arc(pos.x, pos.y, 50, 0, Math.PI * 2);';
    const report: ErrorReport = {
      type: 'syntax',
      rawMessage: 'Unexpected token }',
      friendlyMessage: '代码语法有误',
      recoverable: true,
      suggestion: '检查括号',
    };

    const prompt = buildRepairPrompt(code, report);
    expect(prompt).toContain('语法错误');
    expect(prompt).toContain(code);
    expect(prompt).toContain('修复代码');
  });

  it('includes error line in prompt when available', () => {
    const code = 'line1\nline2\nline3';
    const report: ErrorReport = {
      type: 'runtime',
      rawMessage: 'foo is not defined',
      friendlyMessage: '执行错误',
      recoverable: true,
      suggestion: '检查变量',
      errorLine: 2,
    };

    const prompt = buildRepairPrompt(code, report);
    expect(prompt).toContain('第 2 行');
  });

  it('generates different instructions for different error types', () => {
    const code = 'test';
    const baseReport: Omit<ErrorReport, 'type'> = {
      rawMessage: 'error',
      friendlyMessage: '错误',
      recoverable: true,
      suggestion: '修复',
    };

    const syntaxPrompt = buildRepairPrompt(code, { ...baseReport, type: 'syntax' });
    const timeoutPrompt = buildRepairPrompt(code, { ...baseReport, type: 'timeout' });

    expect(syntaxPrompt).toContain('语法');
    expect(timeoutPrompt).toContain('超时');
    expect(syntaxPrompt).not.toBe(timeoutPrompt);
  });
});
