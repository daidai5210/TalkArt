/**
 * Clean ASR transcripts before sending to the LLM.
 * MiMo interim merges often repeat the same phrase as the user continues speaking.
 */

function collapseRepeatedPrefix(text: string): string {
  if (text.length < 24) return text;

  const maxChunk = Math.min(100, Math.floor(text.length / 2));
  for (let len = maxChunk; len >= 10; len--) {
    const chunk = text.slice(0, len);
    let pos = 0;
    let repeats = 0;
    while (pos + len <= text.length && text.slice(pos, pos + len) === chunk) {
      repeats++;
      pos += len;
    }
    if (repeats >= 2 && pos >= text.length * 0.55) {
      return text.slice(pos - len);
    }
  }
  return text;
}

function dedupeClauses(text: string): string {
  const parts = text.split(/[，,。！!？?；;\s]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return text;

  const kept: string[] = [];
  for (const part of parts) {
    const idx = kept.findIndex((k) => k === part || k.includes(part) || part.includes(k));
    if (idx < 0) {
      kept.push(part);
    } else if (part.length > kept[idx].length) {
      kept[idx] = part;
    }
  }
  return kept.join('，');
}

function extractLastDrawIntent(text: string): string {
  const marker = '帮我画';
  let lastIdx = -1;
  let searchFrom = 0;
  while (true) {
    const idx = text.indexOf(marker, searchFrom);
    if (idx < 0) break;
    lastIdx = idx;
    searchFrom = idx + marker.length;
  }
  if (lastIdx > 0 && lastIdx >= text.length * 0.25) {
    return text.slice(lastIdx);
  }
  return text;
}

/**
 * Normalize a voice transcript for LLM consumption.
 */
export function normalizeVoiceTranscript(raw: string): string {
  let text = raw.trim().replace(/\s+/g, ' ');
  if (!text) return text;

  text = collapseRepeatedPrefix(text);
  text = dedupeClauses(text);
  text = extractLastDrawIntent(text);

  return text.trim();
}
