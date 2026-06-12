/**
 * @module ai-agent/__tests__/ConversationManager.test
 * Tests for the ConversationManager class.
 *
 * Covers:
 * - Low-level API: addUserMessage, addAssistantMessage, buildRequest
 * - High-level API: processUserMessage, processConfirmation (with mocked sendToLLM)
 * - Message retrieval: getLastAssistantMessage, getLastUserMessage
 * - Canvas context management: updateCanvasContext
 * - Conversation reset
 * - History trimming
 * - Request building with system prompt and canvas context
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConversationManager } from '../ConversationManager';
import type { LLMRequest } from '../ConversationManager';
import type { CanvasContext } from '../../drawing-tools/types';
import { TOOL_DEFINITIONS } from '../../drawing-tools/tool-definitions';

// Mock the llm-client module so we don't make real HTTP requests
vi.mock('../llm-client', () => ({
  sendToLLM: vi.fn(),
}));

import { sendToLLM } from '../llm-client';

const mockSendToLLM = vi.mocked(sendToLLM);

/** Helper: create a default canvas context for testing. */
function createCanvasContext(overrides?: Partial<CanvasContext>): CanvasContext {
  return {
    width: 800,
    height: 600,
    elements: [],
    selectedId: null,
    ...overrides,
  };
}

describe('ConversationManager', () => {
  let manager: ConversationManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new ConversationManager('', [...TOOL_DEFINITIONS]);
  });

  // =========================================================================
  // Low-level API
  // =========================================================================

  describe('addUserMessage', () => {
    it('should add a user message to the conversation history', () => {
      manager.addUserMessage('画一个红色的圆');
      const history = manager.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual({ role: 'user', content: '画一个红色的圆' });
    });

    it('should add multiple user messages in order', () => {
      manager.addUserMessage('画一个红色的圆');
      manager.addUserMessage('再画一个蓝色的矩形');
      const history = manager.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].content).toBe('画一个红色的圆');
      expect(history[1].content).toBe('再画一个蓝色的矩形');
    });
  });

  describe('addAssistantMessage', () => {
    it('should add an assistant message to the conversation history', () => {
      manager.addAssistantMessage('好的，我将在画布中央画一个红色圆形，可以吗？');
      const history = manager.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual({
        role: 'assistant',
        content: '好的，我将在画布中央画一个红色圆形，可以吗？',
      });
    });

    it('should interleave user and assistant messages', () => {
      manager.addUserMessage('画一个红色的圆');
      manager.addAssistantMessage('好的，我将在画布中央画一个红色圆形，可以吗？');
      manager.addUserMessage('开始吧');
      const history = manager.getHistory();
      expect(history).toHaveLength(3);
      expect(history[0].role).toBe('user');
      expect(history[1].role).toBe('assistant');
      expect(history[2].role).toBe('user');
    });
  });

  describe('buildRequest', () => {
    it('should build a request with messages, tools, and canvas context', () => {
      manager.addUserMessage('画一个红色的圆');
      const ctx = createCanvasContext();
      manager.updateCanvasContext(ctx);

      const request: LLMRequest = manager.buildRequest();

      expect(request.messages).toHaveLength(1);
      expect(request.messages[0]).toEqual({ role: 'user', content: '画一个红色的圆' });
      expect(request.tools).toEqual([...TOOL_DEFINITIONS]);
      expect(request.tool_choice).toBe('auto');
      expect(request.canvas_context).toEqual(ctx);
    });

    it('should include system prompt in request messages when provided', () => {
      const managerWithPrompt = new ConversationManager(
        'You are a drawing assistant.',
        [...TOOL_DEFINITIONS],
      );
      managerWithPrompt.addUserMessage('画一个圆');

      const request = managerWithPrompt.buildRequest();

      expect(request.messages).toHaveLength(2);
      expect(request.messages[0]).toEqual({
        role: 'system',
        content: 'You are a drawing assistant.',
      });
      expect(request.messages[1]).toEqual({
        role: 'user',
        content: '画一个圆',
      });
    });

    it('should not include system prompt when it is empty', () => {
      manager.addUserMessage('画一个圆');
      const request = manager.buildRequest();

      const systemMessages = request.messages.filter((m) => m.role === 'system');
      expect(systemMessages).toHaveLength(0);
    });

    it('should include the current canvas context in the request', () => {
      const ctx = createCanvasContext({
        elements: [{ id: 'circle-1', type: 'circle', cx: 400, cy: 300, r: 50, fill: '#FF0000' }],
        selectedId: 'circle-1',
      });
      manager.updateCanvasContext(ctx);
      manager.addUserMessage('画一个矩形');

      const request = manager.buildRequest();

      expect(request.canvas_context.width).toBe(800);
      expect(request.canvas_context.height).toBe(600);
      expect(request.canvas_context.elements).toHaveLength(1);
      expect(request.canvas_context.selectedId).toBe('circle-1');
    });
  });

  // =========================================================================
  // Message retrieval
  // =========================================================================

  describe('getLastUserMessage', () => {
    it('should return the last user message', () => {
      manager.addUserMessage('第一条消息');
      manager.addAssistantMessage('好的');
      manager.addUserMessage('第二条消息');

      expect(manager.getLastUserMessage()).toBe('第二条消息');
    });

    it('should return null when there are no user messages', () => {
      expect(manager.getLastUserMessage()).toBeNull();
    });

    it('should return null when there are only assistant messages', () => {
      manager.addAssistantMessage('你好');
      expect(manager.getLastUserMessage()).toBeNull();
    });
  });

  describe('getLastAssistantMessage', () => {
    it('should return the last assistant message', () => {
      manager.addUserMessage('画一个圆');
      manager.addAssistantMessage('好的，我将在画布中央画一个圆形，可以吗？');

      expect(manager.getLastAssistantMessage()).toBe('好的，我将在画布中央画一个圆形，可以吗？');
    });

    it('should return null when there are no assistant messages', () => {
      expect(manager.getLastAssistantMessage()).toBeNull();
    });

    it('should return null when there are only user messages', () => {
      manager.addUserMessage('画一个圆');
      expect(manager.getLastAssistantMessage()).toBeNull();
    });
  });

  // =========================================================================
  // Canvas context management
  // =========================================================================

  describe('updateCanvasContext', () => {
    it('should update the canvas context used in buildRequest', () => {
      const ctx1 = createCanvasContext({ width: 1024, height: 768 });
      manager.updateCanvasContext(ctx1);

      let request = manager.buildRequest();
      expect(request.canvas_context.width).toBe(1024);
      expect(request.canvas_context.height).toBe(768);

      const ctx2 = createCanvasContext({ width: 640, height: 480 });
      manager.updateCanvasContext(ctx2);

      request = manager.buildRequest();
      expect(request.canvas_context.width).toBe(640);
      expect(request.canvas_context.height).toBe(480);
    });
  });

  // =========================================================================
  // Conversation reset
  // =========================================================================

  describe('reset', () => {
    it('should clear all conversation history', () => {
      manager.addUserMessage('画一个圆');
      manager.addAssistantMessage('好的');
      manager.addUserMessage('再画一个矩形');

      manager.reset();

      expect(manager.getHistory()).toHaveLength(0);
      expect(manager.getLastUserMessage()).toBeNull();
      expect(manager.getLastAssistantMessage()).toBeNull();
    });

    it('should allow adding messages after reset', () => {
      manager.addUserMessage('旧消息');
      manager.reset();
      manager.addUserMessage('新消息');

      const history = manager.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].content).toBe('新消息');
    });
  });

  // =========================================================================
  // History trimming
  // =========================================================================

  describe('history trimming', () => {
    it('should trim conversation history when it exceeds 20 messages (via processUserMessage)', async () => {
      mockSendToLLM.mockResolvedValue({
        type: 'confirmation',
        content: '好的',
      });

      // Add 20+ messages via the high-level API
      const ctx = createCanvasContext();
      for (let i = 0; i < 11; i++) {
        await manager.processUserMessage(`消息 ${i}`, ctx);
      }

      // Each processUserMessage adds a user message + assistant confirmation = 22 messages
      // But trimming should cap at 20
      const history = manager.getHistory();
      expect(history.length).toBeLessThanOrEqual(20);
    });
  });

  // =========================================================================
  // High-level async API (with mocked sendToLLM)
  // =========================================================================

  describe('processUserMessage', () => {
    it('should send user message to LLM and return confirmation response', async () => {
      const confirmationText = '好的，我将在画布中央画一个红色圆形，可以吗？';
      mockSendToLLM.mockResolvedValue({
        type: 'confirmation',
        content: confirmationText,
      });

      const ctx = createCanvasContext();
      const response = await manager.processUserMessage('画一个红色的圆', ctx);

      expect(response.type).toBe('confirmation');
      expect(response.content).toBe(confirmationText);

      // Should have called sendToLLM once
      expect(mockSendToLLM).toHaveBeenCalledTimes(1);

      // Should have added both user and assistant messages to history
      const history = manager.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].role).toBe('user');
      expect(history[0].content).toBe('画一个红色的圆');
      expect(history[1].role).toBe('assistant');
      expect(history[1].content).toBe(confirmationText);
    });

    it('should handle function_call response from LLM', async () => {
      mockSendToLLM.mockResolvedValue({
        type: 'function_call',
        function: {
          name: 'drawCircle',
          arguments: {
            position: { semantic: 'center' },
            size: { semantic: 'medium' },
            style: { fill: '红色' },
          },
        },
      });

      const ctx = createCanvasContext();
      const response = await manager.processUserMessage('画一个红色的圆', ctx);

      expect(response.type).toBe('function_call');
      expect(response.function?.name).toBe('drawCircle');
      expect(response.function?.arguments).toEqual({
        position: { semantic: 'center' },
        size: { semantic: 'medium' },
        style: { fill: '红色' },
      });

      // Should store a summary of the function call as assistant message
      const history = manager.getHistory();
      expect(history).toHaveLength(2);
      expect(history[1].role).toBe('assistant');
      expect(history[1].content).toContain('drawCircle');
    });

    it('should update canvas context before sending request', async () => {
      mockSendToLLM.mockResolvedValue({
        type: 'confirmation',
        content: '好的',
      });

      const ctx = createCanvasContext({ width: 1024, height: 768 });
      await manager.processUserMessage('画一个圆', ctx);

      // Verify sendToLLM was called with the provided canvas context
      expect(mockSendToLLM).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Array),
        expect.objectContaining({ width: 1024, height: 768 }),
      );
    });
  });

  describe('processConfirmation', () => {
    it('should send confirmation to LLM and return function_call response', async () => {
      mockSendToLLM.mockResolvedValue({
        type: 'function_call',
        function: {
          name: 'drawCircle',
          arguments: {
            position: { semantic: 'center' },
            size: { semantic: 'medium' },
            style: { fill: '红色' },
          },
        },
      });

      const ctx = createCanvasContext();
      const response = await manager.processConfirmation('开始吧', ctx);

      expect(response.type).toBe('function_call');
      expect(response.function?.name).toBe('drawCircle');

      // Should have added both user confirmation and assistant function summary
      const history = manager.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].role).toBe('user');
      expect(history[0].content).toBe('开始吧');
      expect(history[1].role).toBe('assistant');
    });

    it('should handle another confirmation response from LLM', async () => {
      mockSendToLLM.mockResolvedValue({
        type: 'confirmation',
        content: '请告诉我您想要什么颜色？',
      });

      const ctx = createCanvasContext();
      const response = await manager.processConfirmation('嗯', ctx);

      expect(response.type).toBe('confirmation');
      expect(response.content).toBe('请告诉我您想要什么颜色？');
    });
  });

  // =========================================================================
  // Full conversation flow
  // =========================================================================

  describe('full conversation flow', () => {
    it('should support a complete confirm-then-execute workflow', async () => {
      // First turn: user describes intent
      mockSendToLLM.mockResolvedValueOnce({
        type: 'confirmation',
        content: '好的，我将在画布中央画一个红色圆形，可以吗？',
      });

      const ctx = createCanvasContext();
      const response1 = await manager.processUserMessage('画一个红色的圆', ctx);

      expect(response1.type).toBe('confirmation');

      // Second turn: user confirms
      mockSendToLLM.mockResolvedValueOnce({
        type: 'function_call',
        function: {
          name: 'drawCircle',
          arguments: {
            position: { semantic: 'center' },
            size: { semantic: 'medium' },
            style: { fill: '红色' },
          },
        },
      });

      const response2 = await manager.processConfirmation('开始吧', ctx);

      expect(response2.type).toBe('function_call');
      expect(response2.function?.name).toBe('drawCircle');

      // History should have 4 messages: user, assistant, user, assistant
      const history = manager.getHistory();
      expect(history).toHaveLength(4);
      expect(history[0].role).toBe('user');
      expect(history[1].role).toBe('assistant');
      expect(history[2].role).toBe('user');
      expect(history[3].role).toBe('assistant');
    });

    it('should support low-level API for a complete workflow', () => {
      // Using low-level API: the caller manages the HTTP request cycle
      manager.addUserMessage('画一个红色的圆');
      const ctx = createCanvasContext();
      manager.updateCanvasContext(ctx);

      const request = manager.buildRequest();
      expect(request.messages).toHaveLength(1);
      expect(request.messages[0].content).toBe('画一个红色的圆');

      // Simulate receiving a response from the LLM
      manager.addAssistantMessage('好的，我将在画布中央画一个红色圆形，可以吗？');

      expect(manager.getLastAssistantMessage()).toBe('好的，我将在画布中央画一个红色圆形，可以吗？');
      expect(manager.getLastUserMessage()).toBe('画一个红色的圆');

      // User confirms
      manager.addUserMessage('开始吧');

      const secondRequest = manager.buildRequest();
      expect(secondRequest.messages).toHaveLength(3);
    });
  });

  // =========================================================================
  // Tool management
  // =========================================================================

  describe('setTools', () => {
    it('should update the tool definitions used in buildRequest', () => {
      const customTools = [
        {
          type: 'function' as const,
          function: {
            name: 'customTool',
            description: 'A custom tool',
            parameters: { type: 'object', properties: {} },
          },
        },
      ];

      manager.setTools(customTools);

      const request = manager.buildRequest();
      expect(request.tools).toEqual(customTools);
    });
  });

  describe('getHistory', () => {
    it('should return a copy of the history (not a reference)', () => {
      manager.addUserMessage('测试');
      const history1 = manager.getHistory();
      const history2 = manager.getHistory();

      // Modifying the returned array should not affect the manager
      history1.push({ role: 'user', content: '额外的消息' });

      expect(history2).toHaveLength(1);
      expect(manager.getHistory()).toHaveLength(1);
    });
  });
});
