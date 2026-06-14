/**
 * Modal panel — browse and restore saved drawings from history.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { MaterialIcon } from './MaterialIcon';
import {
  deleteDrawing,
  fetchDrawingList,
} from '@/modules/drawing-history/client';
import type { DrawingSummary } from '@/modules/drawing-history/types';

interface DrawingHistoryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => Promise<void>;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export const DrawingHistoryModal: React.FC<DrawingHistoryModalProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  const [items, setItems] = useState<DrawingSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchDrawingList();
      setItems(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void loadList();
  }, [open, loadList]);

  if (!open) return null;

  const handleSelect = async (id: string) => {
    setLoadingId(id);
    try {
      await onSelect(id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载作品失败');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('确定删除这幅作品吗？')) return;
    try {
      await deleteDrawing(id);
      setItems((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="我的作品集"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-[2rem] border-2 border-outline-variant ambient-float-shadow w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b-2 border-surface-container-high">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
              <MaterialIcon name="collections" className="text-on-secondary-container" filled />
            </div>
            <h2 className="font-headline-lg-mobile text-on-surface">我的作品集</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-high tactile-active text-on-surface-variant"
            aria-label="关闭"
          >
            <MaterialIcon name="close" className="text-2xl" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <p className="text-center text-on-surface-variant font-body-md py-8">加载中…</p>
          )}
          {error && (
            <p className="text-center text-error font-body-md py-4">{error}</p>
          )}
          {!loading && items.length === 0 && (
            <div className="text-center py-12">
              <MaterialIcon name="image" className="text-6xl text-outline-variant mb-4" />
              <p className="font-body-lg text-on-surface-variant">还没有保存的作品</p>
              <p className="font-body-md text-on-surface-variant/70 mt-2">
                画完简笔画后，点击「保存作品」就会出现在这里
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => void handleSelect(item.id)}
                disabled={loadingId === item.id}
                className="group text-left bg-surface-container-low rounded-2xl border-2 border-surface-container-high tactile-shadow-level-1 overflow-hidden tactile-active hover:border-secondary-container transition-colors disabled:opacity-60"
              >
                <div className="aspect-square bg-white p-2 flex items-center justify-center">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="p-3 relative">
                  <p className="font-label-bold text-on-surface text-sm truncate">{item.title}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{formatDate(item.createdAt)}</p>
                  <button
                    type="button"
                    onClick={(e) => void handleDelete(e, item.id)}
                    className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-error-container text-error transition-opacity"
                    aria-label={`删除 ${item.title}`}
                  >
                    <MaterialIcon name="delete" className="text-lg" />
                  </button>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
