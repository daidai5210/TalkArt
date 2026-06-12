import { create } from 'zustand';
import { createCanvasSlice, CanvasSlice } from './canvas-slice';
import { createAgentSlice, AgentSlice } from './agent-slice';

export type StoreSlice = CanvasSlice & AgentSlice;

export const useStore = create<StoreSlice>()((...a) => ({
  ...createCanvasSlice(...a),
  ...createAgentSlice(...a),
}));
