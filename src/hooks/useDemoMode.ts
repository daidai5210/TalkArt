/**
 * @hook useDemoMode
 * Phase 4: pure voice demo mode — hides text input and toolbar.
 */

import { useCallback, useEffect, useState } from 'react';

function readDemoFlag(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('demo') === '1' || localStorage.getItem('talkart-demo-mode') === '1';
}

export function useDemoMode() {
  const [demoMode, setDemoMode] = useState(readDemoFlag);

  useEffect(() => {
    document.body.classList.toggle('talkart-demo-mode', demoMode);
    return () => {
      document.body.classList.remove('talkart-demo-mode');
    };
  }, [demoMode]);

  const enableDemoMode = useCallback(() => {
    localStorage.setItem('talkart-demo-mode', '1');
    setDemoMode(true);
  }, []);

  const disableDemoMode = useCallback(() => {
    localStorage.removeItem('talkart-demo-mode');
    setDemoMode(false);
  }, []);

  return { demoMode, enableDemoMode, disableDemoMode };
}
