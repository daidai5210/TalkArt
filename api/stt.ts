// api/stt.ts
// BFF route: browser-recorded audio -> Xiaomi MiMo ASR (mimo-v2.5-asr)

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface STTRequestBody {
  audio?: string;
  language?: string;
}

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

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

function getMimoConfig() {
  return {
    apiKey: process.env.MIMO_API_KEY || '',
    baseUrl: (process.env.MIMO_BASE_URL || 'https://api.xiaomimimo.com/v1').replace(/\/$/, ''),
    model: process.env.STT_MODEL || 'mimo-v2.5-asr',
  };
}

function normalizeAudioDataUrl(audio: string): string {
  const trimmed = audio.trim();
  if (trimmed.startsWith('data:')) {
    return trimmed;
  }
  return `data:audio/wav;base64,${trimmed}`;
}

function estimateBase64Bytes(dataUrl: string): number {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  return Math.floor((base64.length * 3) / 4);
}

function extractTranscript(data: Record<string, unknown>): string {
  const choices = data.choices as Array<Record<string, unknown>> | undefined;
  const message = choices?.[0]?.message as Record<string, unknown> | undefined;
  const content = message?.content;
  if (typeof content === 'string' && content.trim()) {
    return content.trim();
  }
  const reasoning = message?.reasoning_content;
  if (typeof reasoning === 'string' && reasoning.trim()) {
    return reasoning.trim();
  }
  return '';
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendError(res, 405, 'method_not_allowed', '仅支持 POST 请求');
    return;
  }

  const { audio, language = 'zh' } = req.body as STTRequestBody;

  if (!audio || typeof audio !== 'string') {
    sendError(res, 400, 'invalid_request', 'audio 不能为空');
    return;
  }

  const config = getMimoConfig();
  if (!config.apiKey) {
    sendError(res, 401, 'api_key_missing', '语音转写需要在服务端配置 MIMO_API_KEY');
    return;
  }

  const audioDataUrl = normalizeAudioDataUrl(audio);
  if (estimateBase64Bytes(audioDataUrl) > MAX_AUDIO_BYTES) {
    sendError(res, 413, 'payload_too_large', '音频文件过大（上限 10MB）');
    return;
  }

  const asrLanguage = language === 'auto' ? 'auto' : language;

  try {
    const response = await withTimeout(
      fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'api-key': config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'input_audio',
                  input_audio: { data: audioDataUrl },
                },
              ],
            },
          ],
          asr_options: { language: asrLanguage },
        }),
      }),
      25_000,
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.error(`MiMo STT error: status=${response.status}, body=${errorBody}`);

      if (response.status === 401 || response.status === 403) {
        sendError(res, 500, 'stt_error', '语音转写服务认证失败，请检查 MIMO_API_KEY');
        return;
      }

      sendError(res, 500, 'stt_error', '语音转写服务暂时不可用，请稍后重试');
      return;
    }

    const data = (await response.json()) as Record<string, unknown>;
    const text = extractTranscript(data);
    res.status(200).json({ text });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('timed out')) {
      sendError(res, 504, 'timeout', '语音转写超时，请重试');
      return;
    }

    console.error('STT proxy error:', err);
    sendError(res, 500, 'stt_error', '语音转写服务暂时不可用，请稍后重试');
  }
}
