// api/stt.ts
// BFF route: browser-recorded audio -> cloud speech-to-text (Whisper)

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface STTRequestBody {
  audio?: string;
  mimeType?: string;
  language?: string;
}

const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

function sendError(res: VercelResponse, status: number, error: string, message: string): void {
  res.status(status).json({ error, message });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendError(res, 405, 'method_not_allowed', '仅支持 POST 请求');
    return;
  }

  const { audio, mimeType = 'audio/webm', language = 'zh' } = req.body as STTRequestBody;

  if (!audio || typeof audio !== 'string') {
    sendError(res, 400, 'invalid_request', 'audio 不能为空');
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY || '';
  if (!apiKey) {
    sendError(res, 401, 'api_key_missing', '语音转写需要在服务端配置 OPENAI_API_KEY');
    return;
  }

  let audioBuffer: Buffer;
  try {
    audioBuffer = Buffer.from(audio, 'base64');
  } catch {
    sendError(res, 400, 'invalid_request', 'audio 格式无效');
    return;
  }

  if (audioBuffer.length === 0) {
    sendError(res, 400, 'invalid_request', '音频数据为空');
    return;
  }

  if (audioBuffer.length > MAX_AUDIO_BYTES) {
    sendError(res, 413, 'payload_too_large', '音频文件过大');
    return;
  }

  const model = process.env.STT_MODEL || process.env.ASR_MODEL || 'whisper-1';
  const extension = mimeType.includes('mp4') ? 'm4a' : 'webm';

  try {
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: mimeType }), `audio.${extension}`);
    formData.append('model', model);
    formData.append('language', language);

    const response = await withTimeout(
      fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      }),
      20_000,
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.error(`STT API error: status=${response.status}, body=${errorBody}`);

      if (response.status === 401 || response.status === 403) {
        sendError(res, 500, 'stt_error', '语音转写服务认证失败，请检查 OPENAI_API_KEY');
        return;
      }

      sendError(res, 500, 'stt_error', '语音转写服务暂时不可用，请稍后重试');
      return;
    }

    const data = (await response.json()) as { text?: string };
    res.status(200).json({ text: data.text?.trim() ?? '' });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('timed out')) {
      sendError(res, 504, 'timeout', '语音转写超时，请重试');
      return;
    }

    console.error('STT proxy error:', err);
    sendError(res, 500, 'stt_error', '语音转写服务暂时不可用，请稍后重试');
  }
}
