/**
 * @component TalkArt
 * Main application shell for the TalkArt voice-controlled AI SVG drawing tool.
 *
 * Layout:
 * ┌─────────────────────────────────────────────┐
 * │  🎤 TalkArt                     导出 ⬇️     │
 * ├─────────────────────────────────────────────┤
 * │  [TranscriptPanel + ConfirmationBubble]     │
 * │                                             │
 * │  [SVG Canvas (800×600)]                     │
 * │                                             │
 * │  [Toolbar: ↩️ ↪️ 🗑️ | Export SVG/PNG]      │
 * │  [StatusBar: 🟢 等待唤醒...]                 │
 * │  [MicrophoneButton (bottom-right)]          │
 * └─────────────────────────────────────────────┘
 */

import React, { useState } from 'react';
import { Canvas } from './modules/svg-renderer';
import { useTalkArt } from './hooks/useTalkArt';
import { MicrophoneButton } from './components/MicrophoneButton';
import { TranscriptPanel } from './components/TranscriptPanel';
import { ConfirmationBubble } from './components/ConfirmationBubble';
import { StatusBar } from './components/StatusBar';
import { Toolbar } from './components/Toolbar';

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
    elements,
    canUndo,
    canRedo,
    undo,
    redo,
    clearCanvas,
    exportSVGAction,
    exportPNGAction,
    conversation,
  } = useTalkArt();

  // Text input fallback state
  const [textInput, setTextInput] = useState('');

  const handleTextInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      submitTextInput(textInput.trim());
      setTextInput('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-talkart-bg overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-talkart-surface border-b border-gray-700/50 shrink-0">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 text-talkart-primary"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <path d="M12 19v4" />
            <path d="M8 23h8" />
          </svg>
          <span>
            <span className="text-talkart-primary">Talk</span>Art
          </span>
        </h1>

        <div className="flex items-center gap-3">
          {/* State badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              agentState === 'idle'
                ? 'bg-gray-700 text-gray-300'
                : agentState === 'listening' || agentState === 'wake_word'
                ? 'bg-green-900/50 text-talkart-success'
                : agentState === 'confirming'
                ? 'bg-purple-900/50 text-talkart-primary'
                : agentState === 'executing'
                ? 'bg-yellow-900/50 text-talkart-warning'
                : agentState === 'error'
                ? 'bg-red-900/50 text-talkart-error'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                agentState === 'listening' || agentState === 'wake_word'
                  ? 'bg-talkart-success animate-pulse'
                  : agentState === 'confirming'
                  ? 'bg-talkart-primary animate-pulse'
                  : agentState === 'executing'
                  ? 'bg-talkart-warning animate-pulse'
                  : agentState === 'error'
                  ? 'bg-talkart-error'
                  : 'bg-gray-400'
              }`}
            />
            {agentState === 'idle' && '等待唤醒'}
            {agentState === 'wake_word' && '检测到唤醒词'}
            {agentState === 'listening' && '聆听中'}
            {agentState === 'confirming' && '确认中'}
            {agentState === 'executing' && '绘制中'}
            {agentState === 'error' && '出错'}
          </span>

          {/* Export buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={exportSVGAction}
              disabled={elements.length === 0}
              className="px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700/70 disabled:bg-gray-800/30 disabled:text-gray-600 text-gray-300 text-xs rounded transition-colors"
              title="导出 SVG"
            >
              SVG ⬇️
            </button>
            <button
              onClick={exportPNGAction}
              disabled={elements.length === 0}
              className="px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700/70 disabled:bg-gray-800/30 disabled:text-gray-600 text-gray-300 text-xs rounded transition-colors"
              title="导出 PNG"
            >
              PNG ⬇️
            </button>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Transcript + Confirmation overlay (top of canvas area) */}
        <div className="absolute top-3 left-3 right-3 z-10 space-y-2 pointer-events-none">
          <div className="pointer-events-auto">
            <TranscriptPanel
              currentTranscript={currentTranscript}
              conversation={conversation}
              isListening={isListening}
            />
          </div>
          <div className="pointer-events-auto">
            <ConfirmationBubble
              confirmationText={confirmationText}
              isVisible={agentState === 'confirming'}
            />
          </div>
        </div>

        {/* SVG Canvas */}
        <div className="flex-1 flex items-center justify-center p-4">
          <Canvas />
        </div>

        {/* Voice warning (non-blocking) */}
        {voiceError && (
          <div className="absolute bottom-36 right-6 z-20 max-w-xs">
            <div className="bg-amber-900/90 backdrop-blur-sm border border-amber-500/30 rounded-lg px-3 py-2 shadow-lg">
              <div className="flex items-start gap-2">
                <p className="text-xs text-amber-100 flex-1">{voiceError}</p>
                <button
                  onClick={clearVoiceError}
                  className="text-amber-300 hover:text-white transition-colors shrink-0"
                  aria-label="关闭语音提示"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Microphone button (floating bottom-right) */}
        <div className="absolute bottom-20 right-6 z-20">
          <MicrophoneButton
            agentState={agentState}
            isListening={isListening}
            isSupported={isSupported}
            onStartListening={startListening}
            onStopListening={stopListening}
          />
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        elementCount={elements.length}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onClear={clearCanvas}
      />

      {/* Status bar */}
      <StatusBar
        agentState={agentState}
        elementCount={elements.length}
        error={error}
      />

      {/* Text input fallback (always available) */}
      <div className="px-4 py-3 bg-talkart-surface border-t border-gray-700/50">
        <form onSubmit={handleTextInputSubmit} className="flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="输入绘图指令，例如：画一个红色的圆"
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-talkart-primary focus:ring-1 focus:ring-talkart-primary"
            aria-label="文字输入"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-talkart-primary hover:bg-talkart-primary/80 text-white rounded-lg text-sm font-medium transition-colors"
          >
            发送
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-1">
          {isSupported
            ? '语音交互：浏览器 STT 输入 + TTS 播报（无需语音 API Key）；也可直接使用文字输入'
            : '当前浏览器不支持语音识别，请使用 Chrome/Edge 或文字输入'}
        </p>
      </div>

      {/* Error toast (dismissable) */}
      {error && agentState === 'error' && (
        <div className="absolute top-16 right-4 z-30 max-w-sm">
          <div className="bg-red-900/90 backdrop-blur-sm border border-talkart-error/30 rounded-lg px-4 py-3 shadow-lg">
            <div className="flex items-start gap-3">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-talkart-error shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-red-100">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-300 hover:text-white transition-colors shrink-0"
                aria-label="关闭错误提示"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TalkArt;
