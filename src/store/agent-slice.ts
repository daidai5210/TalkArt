/**
 * @module store/agent-slice
 * Zustand slice for the AI Agent state management.
 *
 * This slice manages:
 * - The agent's state machine (idle → listening → confirming → executing → idle)
 * - Conversation history with the LLM
 * - Current voice transcript
 * - Confirmation text to display to the user
 * - Error state
 *
 * Async actions (processVoiceInput, processConfirmation) coordinate with
 * ConversationManager and ToolDispatcher to handle the full
 * confirm-then-execute workflow.
 *
 * The handleFunctionCall helper dispatches tool results to the appropriate
 * Zustand store actions based on the tool type:
 * - Drawing tools → addElement
 * - Element operations → updateElement, deleteElement, selectElement
 * - Canvas operations → clearCanvas, undo
 */

import { StateCreator } from 'zustand';
import {
  AgentState,
  LLMResponse,
  ConversationManager,
  ToolDispatcher,
} from '../modules/ai-agent';
import type { ExtendedToolResult } from '../modules/ai-agent/ToolDispatcher';
import { TOOL_DEFINITIONS } from '../modules/drawing-tools';
import { EXECUTE_DRAWING_PLAN_DEFINITION } from '../modules/drawing-tools/v2/tool-schema-skeleton';
import type { LLMFunctionCall } from '../modules/ai-agent/types';
import type { CanvasContext } from '../modules/drawing-tools/types';
import type { CanvasSlice, SVGElement } from './canvas-slice';

/** Conversation message with metadata for UI display. */
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

/** The agent slice state and actions. */
export interface AgentSlice {
  // State
  /** Conversation history for UI display. */
  conversation: ConversationMessage[];
  /** Current state of the agent state machine. */
  agentState: AgentState;
  /** Current voice transcript (interim + final). */
  currentTranscript: string;
  /** Confirmation text from the LLM to display to the user. */
  confirmationText: string;
  /** Error message, or null if no error. */
  error: string | null;

  // Synchronous actions
  /** Set the agent state machine state. */
  setAgentState: (state: AgentState) => void;
  /** Update the current voice transcript. */
  setTranscript: (text: string) => void;
  /** Set the confirmation text to display. */
  setConfirmation: (text: string) => void;
  /** Set or clear the error message. */
  setError: (error: string | null) => void;
  /** Add a message to the conversation history. */
  addMessage: (msg: Omit<ConversationMessage, 'id' | 'timestamp'>) => void;
  /** Clear the conversation history and reset state. Also resets ConversationManager. */
  resetConversation: () => void;
  /** Clear the current transcript only. */
  clearTranscript: () => void;

  // Async actions
  /**
   * Process voice input from the user.
   *
   * Sends the user's text to the LLM via ConversationManager.
   * If the LLM returns a confirmation, updates agentState to 'confirming'
   * and displays the confirmation text.
   * If the LLM returns a function_call (rare on first message), executes
   * the tool and applies the result to the canvas.
   *
   * @param text - The user's spoken text (final transcript from ASR)
   */
  processVoiceInput: (text: string) => Promise<void>;

  /**
   * Process a user confirmation.
   *
   * Called when the user confirms a drawing intent (e.g., "开始吧", "可以了").
   * Sends the confirmation to the LLM, which should return a function_call.
   * Executes the tool and applies the result to the canvas store.
   *
   * @param text - The user's confirmation text
   */
  processConfirmation: (text: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Singleton instances
// ---------------------------------------------------------------------------

/**
 * Singleton ConversationManager instance.
 * Created lazily on first use to avoid import-time side effects.
 */
let conversationManager: ConversationManager | null = null;

/**
 * Singleton ToolDispatcher instance.
 * Created lazily on first use.
 */
let toolDispatcher: ToolDispatcher | null = null;

/**
 * Get or create the singleton ConversationManager.
 */
function getConversationManager(): ConversationManager {
  if (!conversationManager) {
    // The BFF injects the main system prompt with canvas context,
    // so we pass an empty supplementary prompt here.
    conversationManager = new ConversationManager('', [
      ...TOOL_DEFINITIONS,
      EXECUTE_DRAWING_PLAN_DEFINITION,
    ]);
  }
  return conversationManager;
}

/**
 * Get or create the singleton ToolDispatcher.
 * Updates the canvas context from the current store state.
 */
function getToolDispatcher(canvasContext: CanvasContext): ToolDispatcher {
  if (!toolDispatcher) {
    toolDispatcher = new ToolDispatcher(canvasContext);
  } else {
    // Always update context to reflect current canvas state
    toolDispatcher.updateContext(canvasContext);
  }
  return toolDispatcher;
}

// ---------------------------------------------------------------------------
// Canvas context builder
// ---------------------------------------------------------------------------

/**
 * Build a CanvasContext from the current store state.
 */
function buildCanvasContext(get: () => CanvasSlice & AgentSlice): CanvasContext {
  const state = get();
  return {
    width: state.canvasWidth,
    height: state.canvasHeight,
    widthMm: state.widthMm,
    heightMm: state.heightMm,
    defaultUnit: state.defaultUnit,
    layers: state.layers,
    elements: state.elements.map((el) => ({
      id: el.id,
      type: el.type,
      ...el.props,
    })),
    selectedId: state.selectedId,
  };
}

// ---------------------------------------------------------------------------
// Tool result handler
// ---------------------------------------------------------------------------

/**
 * Handle a function_call response from the LLM.
 *
 * Dispatches the tool call via ToolDispatcher, then applies the result
 * to the Zustand canvas store based on the tool type:
 *
 * - Drawing tools (drawCircle, drawRect, etc.):
 *   Add the new element to the canvas.
 *
 * - Element operations (selectElement, updateElement, deleteElement,
 *   moveElement, scaleElement, duplicateElement):
 *   Apply the appropriate store action (select, update, delete, add).
 *
 * - Canvas operations (clearCanvas, undoAction, exportImage):
 *   Apply the appropriate store action (clear, undo) or trigger export.
 *
 * @param functionName - The tool name to call
 * @param args - The parsed arguments
 * @param dispatcher - The ToolDispatcher instance
 * @param get - Zustand getter for accessing canvas store
 * @returns The ExtendedToolResult from execution
 */
function handleFunctionCall(
  functionName: string,
  args: Record<string, any>,
  dispatcher: ToolDispatcher,
  get: () => CanvasSlice & AgentSlice,
): ExtendedToolResult {
  const result = dispatcher.execute(functionName, args);

  if (!result.success) {
    return result;
  }

  const store = get();
  const elementId = result.elementId;
  const element = result.element;

  // Determine if this is an "update existing element" operation.
  // updateElement, moveElement, and scaleElement return result.element
  // with the updated props — we apply these via store.updateElement().
  const isUpdateOperation =
    functionName === 'updateElement' ||
    functionName === 'moveElement' ||
    functionName === 'scaleElement';

  // --- Element update operations: update existing element ---
  if (isUpdateOperation && elementId && element) {
    store.updateElement(elementId, element.props);
    return result;
  }

  // --- executeDrawingPlan: batch add elements ---
  if (functionName === 'executeDrawingPlan' && result.elements?.length) {
    store.addElements(
      result.elements.map((el) => ({
        id: el.id,
        type: el.type as SVGElement['type'],
        layerId: (el.props.layerId as string) ?? 'layer-default',
        props: el.props,
      })),
    );
    return result;
  }

  // --- Layer operations ---
  if (result.action === 'createLayer' && result.layer) {
    store.createLayer(result.layer);
    return result;
  }
  if (result.action === 'deleteLayer' && result.layerId) {
    store.deleteLayer(result.layerId);
    return result;
  }
  if (result.action === 'renameLayer' && result.layerId && result.layerName) {
    store.renameLayer(result.layerId, result.layerName);
    return result;
  }
  if (result.action === 'setLayerVisibility' && result.layerId !== undefined) {
    store.setLayerVisibility(result.layerId, result.layerVisible ?? true);
    return result;
  }
  if (result.action === 'setLayerOrder' && result.layerId !== undefined) {
    store.setLayerOrder(result.layerId, result.layerZIndex ?? 0);
    return result;
  }
  if (result.action === 'moveElementToLayer' && result.elementId && result.layerId) {
    store.moveElementToLayer(result.elementId, result.layerId);
    return result;
  }

  // --- Drawing tools and duplicateElement: add new element to canvas ---
  // These return result.element with a NEW id that doesn't exist in the store yet.
  if (element) {
    store.addElement({
      id: element.id,
      type: element.type as SVGElement['type'],
      layerId: (element.props.layerId as string) ?? 'layer-default',
      props: element.props,
    });
    return result;
  }

  // --- Canvas size / unit operations ---
  if (result.action === 'setCanvasSize' && result.canvasSize) {
    store.setCanvasDimensions(
      result.canvasSize.width,
      result.canvasSize.height,
      result.canvasSize.widthMm,
      result.canvasSize.heightMm,
    );
    return result;
  }

  if (result.action === 'setCanvasUnit' && result.defaultUnit) {
    store.setDefaultUnit(result.defaultUnit);
    return result;
  }

  // --- Canvas operations ---
  if (result.action === 'clear') {
    store.clearCanvas();
    return result;
  }

  if (result.action === 'undo') {
    store.undo();
    return result;
  }

  if (result.action === 'export') {
    // Export is handled by the UI layer (e.g., serialize SVG DOM).
    // For now, we just acknowledge success; the UI can read the
    // format and filename from the result.
    // TODO: Trigger actual export via a callback or event
    return result;
  }

  // --- Element operations (no element data, just elementId) ---
  // selectElement: select the element
  if (functionName === 'selectElement' && elementId) {
    store.selectElement(elementId);
    return result;
  }

  // deleteElement: remove the element
  if (functionName === 'deleteElement' && elementId) {
    store.deleteElement(elementId);
    return result;
  }

  return result;
}

/**
 * Handle multiple tool calls from a single LLM response.
 */
function handleToolCalls(
  calls: LLMFunctionCall[],
  dispatcher: ToolDispatcher,
  get: () => CanvasSlice & AgentSlice,
): ExtendedToolResult[] {
  return calls.map((call) => handleFunctionCall(call.name, call.arguments, dispatcher, get));
}

/**
 * Process an LLM response that may contain single or multiple tool calls.
 */
function processLLMToolResponse(
  response: LLMResponse,
  dispatcher: ToolDispatcher,
  get: () => CanvasSlice & AgentSlice,
  addMessage: (msg: Omit<ConversationMessage, 'id' | 'timestamp'>) => void,
): { success: boolean; error?: string } {
  if (response.type === 'tool_calls' && response.tool_calls?.length) {
    const names = response.tool_calls.map((c) => c.name).join(', ');
    addMessage({ role: 'assistant', content: `[执行: ${names}]` });
    const results = handleToolCalls(response.tool_calls, dispatcher, get);
    const failed = results.find((r) => !r.success);
    if (failed) {
      return { success: false, error: failed.error || '绘图执行失败' };
    }
    return { success: true };
  }

  if (response.type === 'function_call' && response.function) {
    const { name, arguments: args } = response.function;
    addMessage({ role: 'assistant', content: `[执行: ${name}]` });
    const result = handleFunctionCall(name, args, dispatcher, get);
    if (!result.success) {
      return { success: false, error: result.error || '绘图执行失败' };
    }
    return { success: true };
  }

  return { success: false, error: '未收到有效的工具调用' };
}

// ---------------------------------------------------------------------------
// Agent slice creation
// ---------------------------------------------------------------------------

/**
 * Create the agent slice for the Zustand store.
 */
export const createAgentSlice: StateCreator<CanvasSlice & AgentSlice, [], [], AgentSlice> = (set, get) => ({
  // Initial state
  conversation: [],
  agentState: 'idle',
  currentTranscript: '',
  confirmationText: '',
  error: null,

  // Synchronous actions
  setAgentState: (agentState: AgentState) => {
    set({ agentState });
  },

  setTranscript: (currentTranscript: string) => {
    set({ currentTranscript });
  },

  setConfirmation: (confirmationText: string) => {
    set({ confirmationText });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  addMessage: (message) => {
    set((state) => ({
      conversation: [
        ...state.conversation,
        {
          ...message,
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          timestamp: Date.now(),
        },
      ],
    }));
  },

  resetConversation: () => {
    // Reset the ConversationManager as well
    if (conversationManager) {
      conversationManager.reset();
    }
    set({ conversation: [], confirmationText: '', error: null, currentTranscript: '' });
  },

  clearTranscript: () => {
    set({ currentTranscript: '' });
  },

  // Async actions
  processVoiceInput: async (text: string) => {
    const { addMessage, setAgentState, setConfirmation, setError } = get();

    // Add user message to UI conversation
    addMessage({ role: 'user', content: text });

    // Transition to listening state
    setAgentState('listening');
    setError(null);

    try {
      const manager = getConversationManager();
      const canvasContext = buildCanvasContext(get);
      const dispatcher = getToolDispatcher(canvasContext);

      // Send user message to LLM
      const response: LLMResponse = await manager.processUserMessage(text, canvasContext);

      if (response.type === 'confirmation') {
        // LLM is asking the user to confirm
        const content = response.content || '请确认是否继续？';
        addMessage({ role: 'assistant', content });
        setConfirmation(content);
        setAgentState('confirming');
      } else if (
        response.type === 'function_call' ||
        response.type === 'tool_calls'
      ) {
        const outcome = processLLMToolResponse(response, dispatcher, get, addMessage);
        if (outcome.success) {
          setAgentState('idle');
          setConfirmation('');
        } else {
          setError(outcome.error || '绘图执行失败');
          setAgentState('error');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '处理语音输入时出错';
      setError(message);
      setAgentState('error');
    }
  },

  processConfirmation: async (text: string) => {
    const { addMessage, setAgentState, setConfirmation, setError } = get();

    // Add user confirmation to UI conversation
    addMessage({ role: 'user', content: text });

    // Transition to executing state
    setAgentState('executing');
    setError(null);

    try {
      const manager = getConversationManager();
      const canvasContext = buildCanvasContext(get);
      const dispatcher = getToolDispatcher(canvasContext);

      // Send confirmation to LLM
      const response: LLMResponse = await manager.processConfirmation(text, canvasContext);

      if (response.type === 'function_call' || response.type === 'tool_calls') {
        const outcome = processLLMToolResponse(response, dispatcher, get, addMessage);
        if (outcome.success) {
          setAgentState('idle');
          setConfirmation('');
        } else {
          setError(outcome.error || '绘图执行失败');
          setAgentState('error');
        }
      } else if (response.type === 'confirmation') {
        // LLM returned another confirmation instead of a function call.
        // This can happen if the LLM needs more information.
        const content = response.content || '请提供更多信息。';
        addMessage({ role: 'assistant', content });
        setConfirmation(content);
        setAgentState('confirming');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '处理确认时出错';
      setError(message);
      setAgentState('error');
    }
  },
});
