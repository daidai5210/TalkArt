import { StateCreator } from 'zustand';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  zIndex: number;
}

export const DEFAULT_LAYER: Layer = {
  id: 'layer-default',
  name: '默认层',
  visible: true,
  zIndex: 0,
};

export interface SVGElement {
  id: string;
  type: 'rect' | 'circle' | 'ellipse' | 'line' | 'text' | 'triangle' | 'path' | 'polyline' | 'polygon' | 'image';
  layerId?: string;
  props: Record<string, unknown>;
}

export interface CanvasState {
  elements: SVGElement[];
  layers: Layer[];
  selectedId: string | null;
  canvasWidth: number;
  canvasHeight: number;
  widthMm: number;
  heightMm: number;
  defaultUnit: 'mm' | 'px';
  history: { elements: SVGElement[]; selectedId: string | null }[];
  historyIndex: number;
  // Canvas 代码生成状态
  canvasCode: string | null;
  canvasCodeVersion: number;
  // Paper.js 状态
  paperCode: string | null;
  paperCodeVersion: number;
  paperTemplates: Array<{
    template: string;
    center?: { x: number; y: number };
    size?: number;
    color?: string;
    strokeColor?: string;
  }>;
}

export interface CanvasSlice extends CanvasState {
  addElement: (el: SVGElement) => void;
  addElements: (els: SVGElement[]) => void;
  updateElement: (id: string, props: Record<string, unknown>) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  createLayer: (layer: Layer) => void;
  deleteLayer: (layerId: string) => void;
  renameLayer: (layerId: string, name: string) => void;
  setLayerVisibility: (layerId: string, visible: boolean) => void;
  setLayerOrder: (layerId: string, zIndex: number) => void;
  moveElementToLayer: (elementId: string, layerId: string) => void;
  setCanvasDimensions: (width: number, height: number, widthMm?: number, heightMm?: number) => void;
  setDefaultUnit: (unit: 'mm' | 'px') => void;
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
  getSelectedElement: () => SVGElement | null;
  // Canvas 代码生成
  setCanvasCode: (code: string | null) => void;
  clearCanvasCode: () => void;
  // Paper.js
  setPaperCode: (code: string | null) => void;
  clearPaperCode: () => void;
  addPaperTemplate: (template: {
    template: string;
    center?: { x: number; y: number };
    size?: number;
    color?: string;
    strokeColor?: string;
  }) => void;
  clearPaperTemplates: () => void;
}

export const createCanvasSlice: StateCreator<CanvasSlice> = (set, get) => ({
  elements: [],
  layers: [DEFAULT_LAYER],
  selectedId: null,
  canvasWidth: 800,
  canvasHeight: 600,
  widthMm: 211.67,
  heightMm: 158.75,
  defaultUnit: 'px',
  history: [],
  historyIndex: -1,
  // Canvas 代码生成初始状态
  canvasCode: null,
  canvasCodeVersion: 0,
  // Paper.js 初始状态
  paperCode: null,
  paperCodeVersion: 0,
  paperTemplates: [],

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

  addElements: (els: SVGElement[]) => {
    if (els.length === 0) return;
    set((state) => {
      const newElements = [...state.elements, ...els];
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

  setCanvasDimensions: (width, height, widthMm, heightMm) => {
    set((state) => ({
      canvasWidth: width,
      canvasHeight: height,
      widthMm: widthMm ?? state.widthMm,
      heightMm: heightMm ?? state.heightMm,
    }));
  },

  setDefaultUnit: (unit) => {
    set({ defaultUnit: unit });
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

  createLayer: (layer) => {
    set((state) => ({
      layers: [...state.layers, layer],
    }));
  },

  deleteLayer: (layerId) => {
    set((state) => ({
      layers: state.layers.filter((l) => l.id !== layerId),
      elements: state.elements.map((el) =>
        (el.layerId ?? el.props.layerId) === layerId
          ? { ...el, layerId: 'layer-default', props: { ...el.props, layerId: 'layer-default' } }
          : el,
      ),
    }));
  },

  renameLayer: (layerId, name) => {
    set((state) => ({
      layers: state.layers.map((l) => (l.id === layerId ? { ...l, name } : l)),
    }));
  },

  setLayerVisibility: (layerId, visible) => {
    set((state) => ({
      layers: state.layers.map((l) => (l.id === layerId ? { ...l, visible } : l)),
    }));
  },

  setLayerOrder: (layerId, zIndex) => {
    set((state) => ({
      layers: state.layers.map((l) => (l.id === layerId ? { ...l, zIndex } : l)),
    }));
  },

  moveElementToLayer: (elementId, layerId) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === elementId
          ? { ...el, layerId, props: { ...el.props, layerId } }
          : el,
      ),
    }));
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

  setCanvasCode: (code: string | null) => {
    set((state) => ({
      canvasCode: code,
      canvasCodeVersion: state.canvasCodeVersion + 1,
    }));
  },

  clearCanvasCode: () => {
    set({
      canvasCode: null,
      canvasCodeVersion: 0,
    });
  },

  // Paper.js 方法
  setPaperCode: (code: string | null) => {
    set((state) => ({
      paperCode: code,
      paperCodeVersion: state.paperCodeVersion + 1,
    }));
  },

  clearPaperCode: () => {
    set({
      paperCode: null,
      paperCodeVersion: 0,
    });
  },

  addPaperTemplate: (template) => {
    set((state) => ({
      paperTemplates: [...state.paperTemplates, template],
    }));
  },

  clearPaperTemplates: () => {
    set({
      paperTemplates: [],
    });
  },
});
