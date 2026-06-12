/**
 * @module ai-agent/ConversationManager
 * Manages multi-turn conversation flow between the user and the LLM.
 *
 * The ConversationManager is the core "brain" of the TalkArt AI Agent.
 * It maintains conversation history, coordinates with the LLM client,
 * and handles the confirm-then-execute workflow:
 *
 *   1. User describes a drawing intent → LLM returns a confirmation
 *   2. User confirms ("开始吧"/"可以了") → LLM calls a drawing tool
 *
 * The manager also trims conversation history to avoid token overflow
 * and injects canvas context into every request.
 *
 * Two usage patterns are supported:
 *
 * **Low-level API** (caller controls HTTP):
 * ```ts
 * const manager = new ConversationManager(systemPrompt, tools);
 * manager.addUserMessage('画一个红色的圆');
 * manager.updateCanvasContext(canvasCtx);
 * const request = manager.buildRequest();
 * // Caller sends request via llm-client, then:
 * manager.addAssistantMessage('好的，我将在画布中央画一个红色圆形，可以吗？');
 * ```
 *
 * **High-level async API** (manager handles HTTP):
 * ```ts
 * const manager = new ConversationManager(systemPrompt, tools);
 * const response1 = await manager.processUserMessage('画一个红色的圆', canvasCtx);
 * // response1.type === 'confirmation'
 * const response2 = await manager.processConfirmation('开始吧', canvasCtx);
 * // response2.type === 'function_call'
 * ```
 */

import type { Message, LLMResponse } from './types';
import type { CanvasContext } from '../drawing-tools/types';
import { sendToLLM } from './llm-client';

/** Maximum number of messages to keep in conversation history. */
const MAX_HISTORY_LENGTH = 20;

/**
 * Structured request object for the LLM, built by buildRequest().
 * Includes messages, tool definitions, tool choice, and canvas context.
 */
export interface LLMRequest {
  messages: Message[];
  tools: any[];
  tool_choice: 'auto' | 'none';
  canvas_context: CanvasContext;
}

/**
 * Manages multi-turn conversations with the LLM.
 *
 * Designed to be used as a singleton (or stored in a React ref)
 * to maintain conversation state across the application lifecycle.
 */
export class ConversationManager {
  /** Conversation history, including user and assistant messages. */
  private messages: Message[];

  /** OpenAI-compatible tool definitions for function calling. */
  private tools: any[];

  /** The system prompt injected at the start of each request. */
  private systemPrompt: string;

  /** Current canvas context for request building. */
  private canvasContext: CanvasContext;

  /**
   * Create a new ConversationManager.
   *
   * @param systemPrompt - The system prompt that defines the AI's role and behavior.
   *   Note: the BFF also injects a system prompt with canvas context, so this
   *   should be a supplementary prompt or left empty.
   * @param tools - OpenAI-compatible tool definitions for the LLM to call.
   */
  constructor(systemPrompt: string, tools: any[]) {
    this.systemPrompt = systemPrompt;
    this.tools = tools;
    this.messages = [];
    // Default canvas context; should be updated before each request
    this.canvasContext = { width: 800, height: 600, elements: [], selectedId: null };
  }

  // ---------------------------------------------------------------------------
  // Low-level API: message management + request building
  // ---------------------------------------------------------------------------

  /**
   * Add a user message to the conversation history.
   *
   * Use this when the caller wants to control the HTTP request cycle
   * (e.g., for custom error handling or request interceptors).
   *
   * @param text - The user's spoken text (from ASR transcript)
   */
  addUserMessage(text: string): void {
    this.messages.push({ role: 'user', content: text });
  }

  /**
   * Add an assistant message to the conversation history.
   *
   * Call this after receiving a response from the LLM to keep
   * the conversation history in sync.
   *
   * @param text - The assistant's response text
   */
  addAssistantMessage(text: string): void {
    this.messages.push({ role: 'assistant', content: text });
  }

  /**
   * Build the LLM request with current messages, tools, and canvas context.
   *
   * Returns a structured LLMRequest object that can be sent directly
   * via the llm-client's sendToLLM function.
   *
   * @returns A complete LLMRequest ready for sending
   */
  buildRequest(): LLMRequest {
    return {
      messages: this.buildRequestMessages(),
      tools: this.tools,
      tool_choice: 'auto',
      canvas_context: this.canvasContext,
    };
  }

  /**
   * Get the last assistant message from the conversation history.
   *
   * Useful for displaying the current confirmation text in the UI.
   *
   * @returns The last assistant message content, or null if none exists
   */
  getLastAssistantMessage(): string | null {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      if (this.messages[i].role === 'assistant') {
        return this.messages[i].content;
      }
    }
    return null;
  }

  /**
   * Get the last user message from the conversation history.
   *
   * Useful for showing what the user last said in the UI.
   *
   * @returns The last user message content, or null if none exists
   */
  getLastUserMessage(): string | null {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      if (this.messages[i].role === 'user') {
        return this.messages[i].content;
      }
    }
    return null;
  }

  /**
   * Update the canvas context used when building requests.
   *
   * Should be called before each LLM request to ensure the LLM
   * has accurate information about the current canvas state.
   *
   * @param context - The current canvas context
   */
  updateCanvasContext(context: CanvasContext): void {
    this.canvasContext = context;
  }

  // ---------------------------------------------------------------------------
  // High-level async API: full request cycle
  // ---------------------------------------------------------------------------

  /**
   * Process a user message and get the LLM's response.
   *
   * This is the main entry point for the first turn of a conversation.
   * The user describes their drawing intent, and the LLM typically
   * returns a confirmation asking the user to verify.
   *
   * In rare cases, the LLM may directly return a function_call
   * (e.g., if the user's intent is very clear and doesn't need confirmation).
   *
   * @param userText - The user's spoken text (from ASR)
   * @param canvasContext - Current canvas state for context injection
   * @returns The LLM's response (confirmation or function_call)
   */
  async processUserMessage(
    userText: string,
    canvasContext: CanvasContext,
  ): Promise<LLMResponse> {
    // Add the user message to history
    this.messages.push({ role: 'user', content: userText });

    // Update canvas context
    this.canvasContext = canvasContext;

    // Send to LLM with auto tool choice
    const response = await sendToLLM(
      this.buildRequestMessages(),
      this.tools,
      canvasContext,
    );

    // Add the assistant's response to history
    this.addAssistantResponse(response);

    // Trim history if it exceeds the maximum length
    this.trimHistory();

    return response;
  }

  /**
   * Process a user confirmation and get the LLM to execute a tool call.
   *
   * Called after the user confirms a drawing intent (e.g., "开始吧", "可以了", "好的").
   * This adds the confirmation to history and re-sends to the LLM with
   * `tool_choice` set to encourage function calling.
   *
   * @param userText - The user's confirmation text
   * @param canvasContext - Current canvas state for context injection
   * @returns The LLM's response (typically a function_call)
   */
  async processConfirmation(
    userText: string,
    canvasContext: CanvasContext,
  ): Promise<LLMResponse> {
    // Add the user's confirmation to history
    this.messages.push({ role: 'user', content: userText });

    // Update canvas context
    this.canvasContext = canvasContext;

    // Send to LLM — the system prompt instructs the LLM to call a tool
    // after user confirmation, so we use 'auto' tool_choice.
    // The BFF handles adding the system prompt that instructs the LLM
    // to call tools when the user confirms.
    const response = await sendToLLM(
      this.buildRequestMessages(),
      this.tools,
      canvasContext,
    );

    // Add the assistant's response to history
    this.addAssistantResponse(response);

    // Trim history if it exceeds the maximum length
    this.trimHistory();

    return response;
  }

  /**
   * Reset the conversation history.
   *
   * Call this when starting a new drawing session or when the user
   * explicitly asks to start over.
   */
  reset(): void {
    this.messages = [];
  }

  /**
   * Get a copy of the conversation history.
   *
   * @returns An array of messages in chronological order
   */
  getHistory(): Message[] {
    return [...this.messages];
  }

  /**
   * Update the tool definitions (e.g., if tools change at runtime).
   *
   * @param tools - New tool definitions
   */
  setTools(tools: any[]): void {
    this.tools = tools;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Build the messages array for the LLM request.
   *
   * Includes any supplementary system prompt and the current conversation
   * history. The BFF will prepend its own system prompt with canvas context.
   */
  private buildRequestMessages(): Message[] {
    const result: Message[] = [];

    // Add supplementary system prompt if provided
    if (this.systemPrompt) {
      result.push({ role: 'system', content: this.systemPrompt });
    }

    // Add conversation history
    result.push(...this.messages);

    return result;
  }

  /**
   * Add the LLM's response to conversation history.
   *
   * For confirmation responses, the assistant's text is stored as-is.
   * For function_call responses, a summary is stored so the conversation
   * maintains context about what was drawn.
   */
  private addAssistantResponse(response: LLMResponse): void {
    if (response.type === 'confirmation' && response.content) {
      this.messages.push({
        role: 'assistant',
        content: response.content,
      });
    } else if (response.type === 'function_call' && response.function) {
      this.messages.push({
        role: 'assistant',
        content: `[调用工具: ${response.function.name}]`,
      });
    } else if (response.type === 'tool_calls' && response.tool_calls?.length) {
      const names = response.tool_calls.map((c) => c.name).join(', ');
      this.messages.push({
        role: 'assistant',
        content: `[调用工具: ${names}]`,
      });
    }
  }

  /**
   * Trim conversation history to avoid token overflow.
   *
   * Keeps the most recent messages, preserving pairs of user/assistant
   * messages when possible. Never trims below 2 messages to maintain
   * at least one exchange of context.
   */
  private trimHistory(): void {
    if (this.messages.length <= MAX_HISTORY_LENGTH) {
      return;
    }

    // Keep the last MAX_HISTORY_LENGTH messages
    // This may cut mid-exchange, but the LLM can handle that
    const excess = this.messages.length - MAX_HISTORY_LENGTH;
    this.messages = this.messages.slice(excess);
  }
}
