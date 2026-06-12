/**
 * Vite dev-only middleware: proxies POST /api/llm to the Vercel API handler
 * so local development can use .env without `vercel dev`.
 */

import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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

export function apiDevPlugin(env: Record<string, string>): Plugin {
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return {
    name: 'talkart-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url !== '/api/llm' && url !== '/api/stt') {
          return next();
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Allow', 'POST');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'method_not_allowed', message: '仅支持 POST 请求' }));
          return;
        }

        try {
          const body = await readBody(req);
          const handler = url === '/api/stt'
            ? (await import('../api/stt')).default
            : (await import('../api/llm')).default;
          const vercelReq = Object.assign(req, {
            body,
            method: 'POST',
            query: {},
          }) as VercelRequest;
          const vercelRes = createVercelResponse(res);
          await handler(vercelReq, vercelRes);
        } catch (err) {
          console.error('[talkart-api-dev]', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          const errorType = url === '/api/stt' ? 'stt_error' : 'llm_error';
          const message = url === '/api/stt'
            ? '语音转写服务暂时不可用，请稍后重试'
            : 'AI 服务暂时不可用，请稍后重试';
          res.end(JSON.stringify({ error: errorType, message }));
        }
      });
    },
  };
}
