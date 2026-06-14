/**
 * Vite dev-only middleware: proxies /api/llm and /api/stt to Vercel handlers.
 */

import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_ROUTES: Record<string, () => Promise<{ default: (req: VercelRequest, res: VercelResponse) => Promise<void> }>> = {
  '/api/llm': () => import('../api/llm'),
  '/api/stt': () => import('../api/stt'),
  '/api/drawings': () => import('../api/drawings'),
};

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function createVercelResponse(res: ServerResponse): VercelResponse {
  let statusCode = 200;
  const response = {
    status(code: number) {
      statusCode = code;
      res.statusCode = code;
      return response;
    },
    setHeader(name: string, value: string) {
      res.setHeader(name, value);
      return response;
    },
    json(body: unknown) {
      if (!res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', 'application/json');
      }
      res.statusCode = statusCode;
      res.end(JSON.stringify(body));
      return response;
    },
  } as VercelResponse;
  return response;
}

/** Env keys that must always sync from .env when Vite reloads (not stick to stale process.env). */
const REFRESH_ENV_KEYS = new Set([
  'LLM_BASE_URL',
  'LLM_API_KEY',
  'LLM_MODEL',
  'LLM_PROVIDER',
  'OPENAI_API_KEY',
  'DEEPSEEK_API_KEY',
  'MIMO_API_KEY',
  'MIMO_BASE_URL',
  'STT_MODEL',
]);

export function apiDevPlugin(env: Record<string, string>): Plugin {
  for (const [key, value] of Object.entries(env)) {
    if (REFRESH_ENV_KEYS.has(key) || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return {
    name: 'talkart-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];
        const loader = url ? API_ROUTES[url] : undefined;
        if (!loader) {
          return next();
        }

        const method = req.method ?? 'GET';
        const urlObj = new URL(req.url ?? '/', 'http://localhost');
        const query: Record<string, string | string[]> = {};
        urlObj.searchParams.forEach((value, key) => {
          query[key] = value;
        });

        if (method !== 'POST' && url !== '/api/drawings') {
          res.statusCode = 405;
          res.setHeader('Allow', 'POST');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'method_not_allowed', message: '仅支持 POST 请求' }));
          return;
        }

        if (method === 'GET' && url === '/api/drawings') {
          // GET allowed for drawings list/detail
        } else if (method === 'DELETE' && url === '/api/drawings') {
          // DELETE allowed for drawings
        } else if (method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Allow', 'POST');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'method_not_allowed', message: '仅支持 POST 请求' }));
          return;
        }

        try {
          const body = method === 'POST' ? await readBody(req) : {};
          const handler = (await loader()).default;
          const vercelReq = Object.assign(req, {
            body,
            method,
            query,
          }) as VercelRequest;
          const vercelRes = createVercelResponse(res);
          await handler(vercelReq, vercelRes);
        } catch (err) {
          console.error(`[talkart-api-dev] ${url}`, err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          const isStt = url === '/api/stt';
          res.end(JSON.stringify({
            error: isStt ? 'stt_error' : 'llm_error',
            message: isStt ? '语音转写服务暂时不可用，请稍后重试' : 'AI 服务暂时不可用，请稍后重试',
          }));
        }
      });
    },
  };
}
