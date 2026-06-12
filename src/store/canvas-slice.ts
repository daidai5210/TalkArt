import { StateCreator } from 'zustand';

export interface SVGElement {
  id: string;
  type: 'rect' | 'circle' | 'ellipse' | 'line' | 'text' | 'triangle';
  props: Record<string, unknown>;
}

export interface CanvasState {
  elements: SVGElement[];
  selectedId: string | null;
  history: { elements: SVGElement[]; selectedId: string | null }[];
  historyIndex: number;
}

export interface CanvasSlice extends CanvasState {
  addElement: (el: SVGElement) => void;
  updateElement: (id: string, props: Record<string, unknown>) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
  getSelectedElement: () => SVGElement | null;
}

export const createCanvasSlice: StateCreator<CanvasSlice> = (set, get) => ({
  elements: [],
  selectedId: null,
  history: [],
  historyIndex: -1,

  addElement: (el: SVGElement) => {
    set((state) => {
      const newElements = [...state.elements, el];
      const newHistory = [
        ...state.history.slice(0, state.historyIndex + 1),
        { elements: newElements, selectedId: state.selectedId },
      ];
      return {
        elements: newElements,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  updateElement: (id: string, props: Record<string, unknown>) => {
    set((state) => {
      const newElements = state.elements.map((el) =>
        el.id === id ? { ...el, props: { ...el.props, ...props } } : el
      );
      const newHistory = [
        ...state.history.slice(0, state.historyIndex + 1),
        { elements: newElements, selectedId: state.selectedId },
      ];
      return {
        elements: newElements,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  deleteElement: (id: string) => {
    set((state) => {
      const newElements = state.elements.filter((el) => el.id !== id);
      const newSelectedId = state.selectedId === id ? null : state.selectedId;
      const newHistory = [
        ...state.history.slice(0, state.historyIndex + 1),
        { elements: newElements, selectedId: newSelectedId },
      ];
      return {
        elements: newElements,
        selectedId: newSelectedId,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  selectElement: (id: string | null) => {
    set({ selectedId: id });
  },

  undo: () => {
    set((state) => {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        const snapshot = state.history[newIndex];
        return {
          elements: snapshot.elements,
          selectedId: snapshot.selectedId,
          historyIndex: newIndex,
        };
      }
      return state;
    });
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        const snapshot = state.history[newIndex];
        return {
          elements: snapshot.elements,
          selectedId: snapshot.selectedId,
          historyIndex: newIndex,
        };
      }
      return state;
    });
  },

  clearCanvas: () => {
    set((state) => {
      const newHistory = [
        ...state.history.slice(0, state.historyIndex + 1),
        { elements: [], selectedId: null },
      ];
      return {
        elements: [],
        selectedId: null,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  getSelectedElement: () => {
    const state = get();
    return state.elements.find((el) => el.id === state.selectedId) || null;
  },
});
