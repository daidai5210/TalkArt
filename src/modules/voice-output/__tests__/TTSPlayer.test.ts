import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TTSPlayer } from '../TTSPlayer';

describe('TTSPlayer', () => {
  beforeEach(() => {
    const speak = vi.fn();
    const cancel = vi.fn();
    const getVoices = vi.fn().mockReturnValue([
      { lang: 'zh-CN', name: 'Chinese' },
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).SpeechSynthesisUtterance = class {
      text = '';
      lang = '';
      rate = 1;
      pitch = 1;
      voice: SpeechSynthesisVoice | null = null;
      constructor(text: string) {
        this.text = text;
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).speechSynthesis = {
      speak,
      cancel,
      getVoices,
      addEventListener: vi.fn(),
    };
  });

  it('should report supported when speechSynthesis exists', () => {
    const player = new TTSPlayer();
    expect(player.isSupported()).toBe(true);
  });

  it('should call speechSynthesis.speak with Chinese text', () => {
    const player = new TTSPlayer();
    player.speak('你好，我是小智');

    expect(globalThis.speechSynthesis.speak).toHaveBeenCalled();
    const utterance = vi.mocked(globalThis.speechSynthesis.speak).mock.calls[0][0];
    expect(utterance.text).toBe('你好，我是小智');
    expect(utterance.lang).toBe('zh-CN');
  });

  it('should cancel ongoing speech on stop', () => {
    const player = new TTSPlayer();
    player.stop();
    expect(globalThis.speechSynthesis.cancel).toHaveBeenCalled();
  });
});
