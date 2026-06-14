/**
 * Client for /api/drawings history endpoints.
 */

import type { DrawingSummary, SavedDrawing, SavedDrawingStep } from './types';

export async function fetchDrawingList(): Promise<DrawingSummary[]> {
  const res = await fetch('/api/drawings');
  if (!res.ok) throw new Error('加载历史作品失败');
  const data = (await res.json()) as { drawings: DrawingSummary[] };
  return data.drawings ?? [];
}

export async function fetchDrawingById(id: string): Promise<SavedDrawing> {
  const res = await fetch(`/api/drawings?id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('加载作品详情失败');
  return (await res.json()) as SavedDrawing;
}

export async function saveDrawing(payload: {
  title: string;
  userIntent: string;
  thumbnail: string;
  canvasWidth: number;
  canvasHeight: number;
  steps: SavedDrawingStep[];
  planSteps?: Array<{ label: string }>;
}): Promise<{ id: string; summary: DrawingSummary }> {
  const res = await fetch('/api/drawings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? '保存作品失败');
  }
  return (await res.json()) as { id: string; summary: DrawingSummary };
}

export async function deleteDrawing(id: string): Promise<void> {
  const res = await fetch(`/api/drawings?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('删除作品失败');
}
