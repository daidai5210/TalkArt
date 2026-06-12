/**
 * Client for the TalkArt BFF ASR route (/api/asr).
 */

const REQUEST_TIMEOUT_MS = 20_000;

export async function transcribeAudioBlob(
  blob: Blob,
  language = 'zh',
): Promise<string> {
  const base64 = await blobToBase64(blob);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch('/api/asr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: base64,
        mimeType: blob.type || 'audio/webm',
        language,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let message = '语音识别失败，请稍后重试';
      try {
        const body = await response.json();
        if (body?.message) message = body.message;
      } catch {
        // ignore parse errors
      }
      throw new Error(message);
    }

    const data = (await response.json()) as { text?: string };
    return data.text?.trim() ?? '';
  } finally {
    clearTimeout(timeoutId);
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('无法读取音频数据'));
        return;
      }
      const commaIndex = result.indexOf(',');
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(new Error('无法读取音频数据'));
    reader.readAsDataURL(blob);
  });
}
