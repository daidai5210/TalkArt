/**
 * Client for the TalkArt BFF STT route (/api/stt) → MiMo ASR.
 */

const REQUEST_TIMEOUT_MS = 25_000;

export async function transcribeAudioDataUrl(
  audioDataUrl: string,
  language = 'zh',
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch('/api/stt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: audioDataUrl, language }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let message = '语音转写失败，请稍后重试';
      try {
        const body = await response.json();
        if (body?.message) message = body.message;
      } catch {
        // ignore
      }
      throw new Error(message);
    }

    const data = (await response.json()) as { text?: string };
    return data.text?.trim() ?? '';
  } finally {
    clearTimeout(timeoutId);
  }
}
