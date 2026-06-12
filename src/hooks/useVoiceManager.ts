/**
 * @hook useVoiceManager
 * React hook that provides a singleton VoiceManager instance.
 *
 * The VoiceManager is created once and reused across re-renders,
 * ensuring stable callback registration and consistent state.
 *
 * Usage:
 * ```tsx
 * function VoicePanel() {
 *   const voice = useVoiceManager();
 *
 *   useEffect(() => {
 *     voice.onSpeechResult((text, isFinal) => {
 *       console.log(text, isFinal);
 *     });
 *   }, [voice]);
 *
 *   return <button onClick={() => voice.startListening()}>Start</button>;
 * }
 * ```
 */

import { useRef } from 'react';
import { VoiceManager } from '../modules/voice-input';

export function useVoiceManager(): VoiceManager {
  const managerRef = useRef<VoiceManager | null>(null);

  if (!managerRef.current) {
    managerRef.current = new VoiceManager();
  }

  return managerRef.current;
}
