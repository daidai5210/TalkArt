/**
 * @module ai-agent/types
 * Type definitions for the TalkArt AI Agent module.
 *
 * These types define the conversation state machine, message format,
 * and structured LLM response types used by ConversationManager
 * and ToolDispatcher.
 */

/**
 * State machine states for the AI Agent.
 *
 * State transitions:
 *   idle → listening      (user starts speaking)
 *   listening → confirming (LLM returns a confirmation response)
 *   listening → executing  (LLM returns a function_call directly)
 *   confirming → executing (user confirms, LLM calls a tool)
 *   confirming → idle      (user cancels / says "不对")
 *   executing → idle       (tool execution completes)
 *   any → error            (network error, timeout, etc.)
 *   error → idle           (user retries)
 */
export type AgentState =
  | 'idle'
  | 'wake_word'
  | 'listening'
  | 'confirming'
  | 'executing'
  | 'error';

/**
 * A single message in the conversation history.
 * Follows the OpenAI Chat Completion message format.
 */
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Structured response from the LLM, parsed by the BFF API route.
 *
 * - `confirmation`: The LLM is asking the user to confirm before
 *   executing a drawing action. The `content` field contains the
 *   confirmation text to display to the user.
 *
 * - `function_call`: The LLM has decided to call a drawing tool.
 *   The `function` field contains the tool name and parsed arguments.
 */
export interface LLMFunctionCall {
  name: string;
  arguments: Record<string, any>;
}

export interface LLMResponse {
  type: 'confirmation' | 'function_call' | 'tool_calls';
  content?: string;
  function?: LLMFunctionCall;
  /** Multiple tool calls from BFF (Phase 2+). */
  tool_calls?: LLMFunctionCall[];
}
