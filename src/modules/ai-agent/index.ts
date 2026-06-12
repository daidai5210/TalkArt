/**
 * @module ai-agent
 * AI Agent module barrel export.
 *
 * The AI Agent is the core "brain" of TalkArt. It manages multi-turn
 * conversations with the LLM, handles the confirm-then-execute workflow,
 * and dispatches drawing tool calls.
 *
 * Module structure:
 * - `types` — Type definitions (AgentState, Message, LLMResponse)
 * - `llm-client` — Client for the BFF API route (/api/llm)
 * - `ConversationManager` — Multi-turn conversation flow manager
 * - `ToolDispatcher` — Executes LLM function calls as drawing operations
 */

// Type definitions
export type { AgentState, Message, LLMResponse } from './types';

// LLM client
export { sendToLLM } from './llm-client';

// Conversation manager
export { ConversationManager } from './ConversationManager';
export type { LLMRequest } from './ConversationManager';

// Tool dispatcher
export { ToolDispatcher } from './ToolDispatcher';
export type { ExtendedToolResult, OnExecuteCallback } from './ToolDispatcher';
