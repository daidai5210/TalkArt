import { describe, it, expect } from 'vitest';
import { useStore } from '@/store';

describe('Store', () => {
  it('should initialize with default canvas state', () => {
    const state = useStore.getState();
    expect(state.elements).toEqual([]);
    expect(state.selectedId).toBeNull();
    expect(state.history).toEqual([]);
    expect(state.historyIndex).toBe(-1);
  });

  it('should initialize with default agent state', () => {
    const state = useStore.getState();
    expect(state.conversation).toEqual([]);
    expect(state.agentState).toBe('idle');
    expect(state.currentTranscript).toBe('');
    expect(state.confirmationText).toBe('');
  });

  it('should add an element', () => {
    const element = {
      id: 'rect-test-123',
      type: 'rect' as const,
      props: { x: 10, y: 20, width: 100, height: 50, fill: '#ff0000' },
    };

    useStore.getState().addElement(element);

    const state = useStore.getState();
    expect(state.elements).toHaveLength(1);
    expect(state.elements[0].id).toBe('rect-test-123');
    expect(state.elements[0].type).toBe('rect');

    // History should have been pushed
    expect(state.history).toHaveLength(1);
    expect(state.historyIndex).toBe(0);

    // Clean up
    useStore.getState().clearCanvas();
  });

  it('should select an element', () => {
    const element = {
      id: 'circle-test-456',
      type: 'circle' as const,
      props: { cx: 100, cy: 100, r: 40, fill: '#00ff00' },
    };

    useStore.getState().addElement(element);
    useStore.getState().selectElement('circle-test-456');

    const state = useStore.getState();
    expect(state.selectedId).toBe('circle-test-456');

    // Clean up
    useStore.getState().clearCanvas();
  });

  it('should deselect when selectElement(null)', () => {
    const element = {
      id: 'ellipse-test-789',
      type: 'ellipse' as const,
      props: { cx: 200, cy: 200, rx: 60, ry: 30, fill: '#0000ff' },
    };

    useStore.getState().addElement(element);
    useStore.getState().selectElement('ellipse-test-789');
    useStore.getState().selectElement(null);

    const state = useStore.getState();
    expect(state.selectedId).toBeNull();

    // Clean up
    useStore.getState().clearCanvas();
  });

  it('should update an element', () => {
    const element = {
      id: 'rect-update-test',
      type: 'rect' as const,
      props: { x: 10, y: 20, width: 100, height: 50, fill: '#ff0000' },
    };

    useStore.getState().addElement(element);
    useStore.getState().updateElement('rect-update-test', { fill: '#00ff00' });

    const state = useStore.getState();
    expect(state.elements[0].props.fill).toBe('#00ff00');

    // Clean up
    useStore.getState().clearCanvas();
  });

  it('should delete an element', () => {
    const element = {
      id: 'rect-delete-test',
      type: 'rect' as const,
      props: { x: 10, y: 20, width: 100, height: 50, fill: '#ff0000' },
    };

    useStore.getState().addElement(element);
    useStore.getState().deleteElement('rect-delete-test');

    const state = useStore.getState();
    expect(state.elements).toHaveLength(0);

    // Clean up
    useStore.getState().clearCanvas();
  });

  it('should undo and redo', () => {
    const element1 = {
      id: 'rect-undo-1',
      type: 'rect' as const,
      props: { x: 10, y: 20, width: 100, height: 50, fill: '#ff0000' },
    };
    const element2 = {
      id: 'rect-undo-2',
      type: 'rect' as const,
      props: { x: 200, y: 200, width: 80, height: 60, fill: '#0000ff' },
    };

    useStore.getState().addElement(element1);
    useStore.getState().addElement(element2);

    let state = useStore.getState();
    expect(state.elements).toHaveLength(2);

    // Undo: should go back to 1 element
    useStore.getState().undo();
    state = useStore.getState();
    expect(state.elements).toHaveLength(1);
    expect(state.elements[0].id).toBe('rect-undo-1');

    // Redo: should go forward to 2 elements
    useStore.getState().redo();
    state = useStore.getState();
    expect(state.elements).toHaveLength(2);

    // Clean up
    useStore.getState().clearCanvas();
  });

  it('should clear the canvas', () => {
    const element = {
      id: 'rect-clear-test',
      type: 'rect' as const,
      props: { x: 10, y: 20, width: 100, height: 50, fill: '#ff0000' },
    };

    useStore.getState().addElement(element);
    useStore.getState().clearCanvas();

    const state = useStore.getState();
    expect(state.elements).toHaveLength(0);
    expect(state.selectedId).toBeNull();
  });

  it('should get selected element', () => {
    const element = {
      id: 'rect-selected-test',
      type: 'rect' as const,
      props: { x: 10, y: 20, width: 100, height: 50, fill: '#ff0000' },
    };

    useStore.getState().addElement(element);
    useStore.getState().selectElement('rect-selected-test');

    const selected = useStore.getState().getSelectedElement();
    expect(selected).not.toBeNull();
    expect(selected?.id).toBe('rect-selected-test');

    // Clean up
    useStore.getState().clearCanvas();
  });

  it('should set agent state', () => {
    useStore.getState().setAgentState('listening');
    expect(useStore.getState().agentState).toBe('listening');

    useStore.getState().setAgentState('idle');
    expect(useStore.getState().agentState).toBe('idle');
  });

  it('should add conversation message', () => {
    useStore.getState().addMessage({ role: 'user', content: 'Draw a circle' });

    const state = useStore.getState();
    expect(state.conversation).toHaveLength(1);
    expect(state.conversation[0].role).toBe('user');
    expect(state.conversation[0].content).toBe('Draw a circle');
    expect(state.conversation[0].id).toBeTruthy();
    expect(state.conversation[0].timestamp).toBeGreaterThan(0);

    // Clean up
    useStore.getState().resetConversation();
  });
});
