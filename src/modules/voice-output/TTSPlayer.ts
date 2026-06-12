/**
 * @module voice-output/TTSPlayer
 * Browser Text-to-Speech using the Speech Synthesis API.
 *
 * TTS runs entirely in the browser (no API key required).
 * This is separate from cloud STT and from SpeechRecognition.
 */

const DEFAULT_LANG = 'zh-CN';

export class TTSPlayer {
  private voicesReady = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        this.voicesReady = window.speechSynthesis.getVoices().length > 0;
      };
      loadVoices();
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    }
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  speak(text: string): void {
    if (!this.isSupported() || !text.trim()) return;

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = DEFAULT_LANG;
    utterance.rate = 1;
    utterance.pitch = 1;

    const voice = this.getChineseVoice();
    if (voice) {
      utterance.voice = voice;
    }

    window.speechSynthesis.speak(utterance);
  }

  stop(): void {
    if (!this.isSupported()) return;
    window.speechSynthesis.cancel();
  }

  private getChineseVoice(): SpeechSynthesisVoice | null {
    if (!this.isSupported()) return null;

    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    return (
      voices.find((voice) => voice.lang === 'zh-CN')
      ?? voices.find((voice) => voice.lang.startsWith('zh'))
      ?? null
    );
  }
}
