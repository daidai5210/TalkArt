/**
 * @component TalkArt
 * Main application shell — Artful Play / Digital Papercraft UI.
 */

import React, { useState } from 'react';
import { ThreeCanvas } from './modules/three-renderer';
import { useTalkArt } from './hooks/useTalkArt';
import { useStore } from './store';
import { AppHeader } from './components/AppHeader';
import { XiaoZhiBubble } from './components/XiaoZhiBubble';
import { StepProgressBar } from './components/StepProgressBar';
import { DesktopControlBar } from './components/DesktopControlBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MicrophoneButton } from './components/MicrophoneButton';
import { TextInputBar } from './components/TextInputBar';
import { MaterialIcon } from './components/MaterialIcon';
import { getXiaoZhiMessage } from './lib/xiao-zhi-message';

const TalkArt: React.FC = () => {
  const {
    agentState,
    currentTranscript,
    confirmationText,
    isListening,
    isSupported,
    error,
    voiceError,
    startListening,
    stopListening,
    submitTextInput,
    clearError,
    clearVoiceError,
    stepCount,
    canUndo,
    undo,
    clearCanvas,
    exportPNGAction,
    conversation,
    demoMode,
  } = useTalkArt();

  const drawingProgress = useStore((s) => s.drawingProgress);
  const drawingPlan = useStore((s) => s.drawingPlan);
  const stepError = useStore((s) => s.stepError);
  const retryCurrentStep = useStore((s) => s.retryCurrentStep);

  const [textInput, setTextInput] = useState('');

  const xiaoZhiMessage = getXiaoZhiMessage({
    agentState,
    drawingProgress,
    confirmationText,
    currentTranscript,
    isListening,
    stepError,
    conversation,
  });

  const isPlanning =
    drawingProgress?.isDrawing === true &&
    drawingProgress.message === '正在规划绘制步骤...';

  const planSteps =
    drawingPlan?.steps.map((s) => ({ index: s.index, label: s.label })) ?? [];

  const currentStepNum = drawingProgress?.currentStep ?? 0;

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      submitTextInput(textInput.trim());
      setTextInput('');
    }
  };

  const handleSave = () => {
    void exportPNGAction();
  };

  const hasContent = stepCount > 0;

  return (
    <div className="flex flex-col min-h-screen text-on-surface font-body-md overflow-x-hidden">
      <AppHeader agentState={agentState} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-margin-mobile md:px-margin-desktop py-6 md:py-8 flex flex-col items-center gap-stack-gap relative z-10 pb-36 md:pb-32">
        <XiaoZhiBubble message={xiaoZhiMessage} />

        {/* Canvas paper sheet — Level 1 */}
        <div className="w-full aspect-square md:aspect-[4/3] max-h-[614px] bg-surface-container-lowest rounded-[3rem] border-2 border-outline-variant tactile-shadow-level-1 overflow-hidden relative flex items-center justify-center m-2 md:m-4">
          <ThreeCanvas className="w-full h-full" />
        </div>

        {planSteps.length > 0 && (
          <StepProgressBar
            steps={planSteps}
            currentStep={currentStepNum}
            isPlanning={isPlanning}
          />
        )}

        {stepError && (
          <div className="bg-error-container text-on-error-container border-2 border-error/20 rounded-2xl px-6 py-3 flex items-center gap-4 max-w-md tactile-shadow-level-1">
            <MaterialIcon name="error" className="text-2xl shrink-0" />
            <p className="font-body-md flex-1">{stepError}</p>
            <button
              type="button"
              onClick={() => void retryCurrentStep()}
              className="shrink-0 bg-error text-on-error font-label-bold px-4 py-2 rounded-full tactile-active text-sm"
            >
              重试
            </button>
          </div>
        )}

        {!demoMode && (
          <DesktopControlBar
            canUndo={canUndo}
            hasContent={hasContent}
            onUndo={undo}
            onClear={clearCanvas}
            onSave={handleSave}
          />
        )}

        {!demoMode && !isSupported && (
          <TextInputBar
            value={textInput}
            onChange={setTextInput}
            onSubmit={handleTextSubmit}
          />
        )}
      </main>

      <MicrophoneButton
        agentState={agentState}
        isListening={isListening}
        isSupported={isSupported}
        onStartListening={startListening}
        onStopListening={stopListening}
      />

      {!demoMode && (
        <MobileBottomNav
          canUndo={canUndo}
          hasContent={hasContent}
          onUndo={undo}
          onClear={clearCanvas}
          onSave={handleSave}
        />
      )}

      {voiceError && (
        <div className="fixed bottom-40 md:bottom-28 right-margin-mobile md:right-36 z-50 max-w-xs">
          <div className="bg-tertiary-container border-2 border-tertiary/30 rounded-2xl px-4 py-3 ambient-float-shadow">
            <div className="flex items-start gap-2">
              <MaterialIcon name="mic_off" className="text-tertiary shrink-0 mt-0.5" />
              <p className="text-sm text-on-tertiary-container flex-1 font-body-md">{voiceError}</p>
              <button
                type="button"
                onClick={clearVoiceError}
                className="text-tertiary hover:text-on-tertiary-container transition-colors shrink-0"
                aria-label="关闭语音提示"
              >
                <MaterialIcon name="close" className="text-xl" />
              </button>
            </div>
          </div>
        </div>
      )}

      {error && agentState === 'error' && (
        <div className="fixed top-24 right-margin-mobile md:right-margin-desktop z-50 max-w-sm">
          <div className="bg-error-container border-2 border-error/30 rounded-2xl px-4 py-3 ambient-float-shadow">
            <div className="flex items-start gap-3">
              <MaterialIcon name="error" className="text-error shrink-0 mt-0.5" />
              <p className="text-sm text-on-error-container flex-1 font-body-md">{error}</p>
              <button
                type="button"
                onClick={clearError}
                className="text-error hover:text-on-error-container transition-colors shrink-0"
                aria-label="关闭错误提示"
              >
                <MaterialIcon name="close" className="text-xl" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TalkArt;
