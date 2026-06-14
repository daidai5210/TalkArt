/**
 * Drawings history API — persist saved artworks (JSON file store).
 * POST   /api/drawings       — save a drawing
 * GET    /api/drawings       — list summaries
 * GET    /api/drawings?id=   — get full drawing
 * DELETE /api/drawings?id=   — delete drawing
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'node:fs';
import path from 'node:path';

export interface SavedDrawingRecord {
  id: string;
  title: string;
  userIntent: string;
  createdAt: string;
  thumbnail: string;
  canvasWidth: number;
  canvasHeight: number;
  steps: Array<{ label: string; primitives: unknown[] }>;
  planSteps?: Array<{ label: string }>;
}

export interface DrawingSummary {
  id: string;
  title: string;
  userIntent: string;
  createdAt: string;
  thumbnail: string;
}

const DATA_DIR = path.join(process.cwd(), 'data', 'drawings');
const INDEX_FILE = path.join(DATA_DIR, 'index.json');
const MAX_DRAWINGS = 50;

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readIndex(): SavedDrawingRecord[] {
  ensureDataDir();
  if (!fs.existsSync(INDEX_FILE)) return [];
  try {
    const raw = fs.readFileSync(INDEX_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIndex(records: SavedDrawingRecord[]): void {
  ensureDataDir();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(records, null, 2), 'utf8');
}

function toSummary(r: SavedDrawingRecord): DrawingSummary {
  return {
    id: r.id,
    title: r.title,
    userIntent: r.userIntent,
    createdAt: r.createdAt,
    thumbnail: r.thumbnail,
  };
}

function sendError(res: VercelResponse, status: number, message: string): void {
  res.status(status).json({ error: message });
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const id = typeof req.query.id === 'string' ? req.query.id : undefined;

  try {
    if (req.method === 'GET') {
      const records = readIndex();
      if (id) {
        const found = records.find((r) => r.id === id);
        if (!found) {
          sendError(res, 404, '找不到该作品');
          return;
        }
        res.status(200).json(found);
        return;
      }
      res.status(200).json({ drawings: records.map(toSummary) });
      return;
    }

    if (req.method === 'POST') {
      const body = req.body as Partial<SavedDrawingRecord>;
      if (!body.title || !body.thumbnail || !Array.isArray(body.steps)) {
        sendError(res, 400, '缺少 title、thumbnail 或 steps');
        return;
      }

      const record: SavedDrawingRecord = {
        id: `draw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: String(body.title).slice(0, 80),
        userIntent: String(body.userIntent ?? body.title).slice(0, 200),
        createdAt: new Date().toISOString(),
        thumbnail: body.thumbnail,
        canvasWidth: typeof body.canvasWidth === 'number' ? body.canvasWidth : 800,
        canvasHeight: typeof body.canvasHeight === 'number' ? body.canvasHeight : 600,
        steps: body.steps,
        planSteps: body.planSteps,
      };

      let records = readIndex();
      records = [record, ...records].slice(0, MAX_DRAWINGS);
      writeIndex(records);

      res.status(201).json({ id: record.id, summary: toSummary(record) });
      return;
    }

    if (req.method === 'DELETE') {
      if (!id) {
        sendError(res, 400, '缺少 id 参数');
        return;
      }
      const records = readIndex().filter((r) => r.id !== id);
      writeIndex(records);
      res.status(200).json({ ok: true });
      return;
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    sendError(res, 405, '不支持的请求方法');
  } catch (err) {
    console.error('[drawings API]', err);
    sendError(res, 500, '作品存储服务出错');
  }
}
