import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, PointerEvent } from 'react';
import { Mic, Square, Volume2, X } from 'lucide-react';
import type { VoiceState } from '../../lib/voice/useVoiceSession';
import { FinancialText } from './FinancialText';
import { SherpiAvatar } from './SherpiAvatar';

interface Props {
  voiceState: VoiceState;
  transcript: string;
  responseMessage: string | null;
  guardRedirect: string | null;
  errorNotice: string | null;
  audioLevel: number;
  suggestedQuestion: string;
  onPressStart: () => void;
  onPressEnd: () => void;
  onStopSpeaking: () => void;
  onSelectSuggestion: (question: string) => void;
  onClosePopup: () => void;
  onOverlayChange: (open: boolean) => void;
}

const HOLD_MS = 250;

export function VoicePushButton({
  voiceState, transcript, responseMessage, guardRedirect, errorNotice,
  audioLevel, suggestedQuestion, onPressStart, onPressEnd,
  onStopSpeaking, onSelectSuggestion, onClosePopup, onOverlayChange,
}: Props) {
  const panelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const focusInput = useRef(false);
  const press = useRef<{ pointerId: number; timer: number; recording: boolean } | null>(null);
  const [customText, setCustomText] = useState('');
  const [opened, setOpened] = useState(false);
  const isListening = voiceState === 'listening';
  const isSpeaking = voiceState === 'speaking';
  const hasContent = opened || isListening;

  useEffect(() => {
    onOverlayChange(hasContent);
    if (hasContent && focusInput.current && inputRef.current) {
      inputRef.current.focus();
      focusInput.current = false;
    }
  }, [hasContent, onOverlayChange]);

  useEffect(() => () => { if (press.current) window.clearTimeout(press.current.timer); }, []);

  function close() {
    setOpened(false);
    onClosePopup();
    buttonRef.current?.focus({ preventScroll: true });
  }

  function togglePanel() {
    if (opened) close();
    else setOpened(true);
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0 || press.current) return;
    if (isSpeaking) {
      onStopSpeaking();
      return;
    }
    const pointerId = event.pointerId;
    event.currentTarget.setPointerCapture(pointerId);
    const timer = window.setTimeout(() => {
      if (press.current?.pointerId !== pointerId) return;
      press.current.recording = true;
      setOpened(true);
      onPressStart();
    }, HOLD_MS);
    press.current = { pointerId, timer, recording: false };
  }

  function finishPress(pointerId: number, cancelled: boolean) {
    const active = press.current;
    if (!active || active.pointerId !== pointerId) return;
    press.current = null;
    window.clearTimeout(active.timer);
    if (active.recording && cancelled) onStopSpeaking();
    else if (active.recording) onPressEnd();
    else if (!cancelled) togglePanel();
  }

  function submitQuestion(event: FormEvent) {
    event.preventDefault();
    const clean = customText.trim();
    if (!clean) return;
    onSelectSuggestion(clean);
    setCustomText('');
  }

  return (
    <div className="relative shrink-0" onKeyDown={(event) => {
      if (event.key === 'Escape' && hasContent && !isListening) {
        event.stopPropagation();
        close();
      }
    }}>
      {hasContent && (
        <section id={panelId} aria-label="Ask Sherpi" className="sherpi-panel">
          <div className="flex items-center gap-2 border-b border-slate-700 pb-1">
            <SherpiAvatar />
            <h2 className="flex-1 text-base font-semibold">Sherpi</h2>
            <button type="button" className="grid h-11 w-11 place-items-center rounded-lg hover:bg-slate-800" onClick={close} aria-label="Close voice assistant"><X size={18} /></button>
          </div>
          {isListening ? (
            <div role="status" className="space-y-2 py-2 text-sm text-slate-200">
              <p>{transcript || 'Listening. Release the button to ask.'}</p>
              <div aria-hidden="true" className="h-1 overflow-hidden rounded-full bg-slate-700"><span className="block h-full bg-indigo-300" style={{ width: `${Math.round(audioLevel * 100)}%` }} /></div>
            </div>
          ) : (
            <>
              {(responseMessage || guardRedirect) && <p className="rounded-lg bg-slate-950 p-3 text-sm text-slate-200" aria-live="polite"><FinancialText text={guardRedirect ?? responseMessage ?? ''} /></p>}
              {isSpeaking && !responseMessage && !guardRedirect && <p role="status" className="text-sm text-slate-300">Sherpi is preparing an answer…</p>}
              {errorNotice && <p role="status" className="text-sm text-slate-200">{errorNotice}</p>}
              {!responseMessage && !guardRedirect && !isSpeaking && (
                <button type="button" onClick={() => onSelectSuggestion(suggestedQuestion)} className="min-h-11 w-full rounded-lg border border-slate-600 px-3 py-2 text-left text-sm text-indigo-200 hover:bg-slate-800">{suggestedQuestion}</button>
              )}
              <form className="flex gap-2" onSubmit={submitQuestion}>
                <input ref={inputRef} aria-label="Ask a question about your plan" placeholder="Type a question" value={customText} onChange={(event) => setCustomText(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm text-white placeholder:text-slate-400" />
                <button type="submit" disabled={!customText.trim()} className="min-h-11 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white disabled:opacity-45">Ask</button>
              </form>
              <p className="text-xs text-slate-300">Hold the Sherpi button to speak.</p>
            </>
          )}
        </section>
      )}
      <button
        ref={buttonRef}
        type="button"
        className="sherpi-trigger"
        aria-label={isListening ? 'Release to ask Sherpi' : isSpeaking ? 'Stop Sherpi speaking' : 'Ask Sherpi'}
        aria-expanded={hasContent}
        aria-controls={hasContent ? panelId : undefined}
        title="Ask Sherpi. Tap to type or hold to speak."
        onClick={(event) => {
          if (event.detail !== 0) return;
          if (isSpeaking) onStopSpeaking();
          else {
            focusInput.current = !opened;
            togglePanel();
          }
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={(event) => finishPress(event.pointerId, false)}
        onPointerCancel={(event) => finishPress(event.pointerId, true)}
        onLostPointerCapture={(event) => finishPress(event.pointerId, true)}
        onContextMenu={(event) => event.preventDefault()}
      >
        {isListening ? <Square size={16} fill="currentColor" aria-hidden="true" /> : <SherpiAvatar />}
        <span className="sherpi-trigger-label">Sherpi</span>
        {isSpeaking ? <Volume2 className="hidden sm:block" size={14} aria-hidden="true" /> : <Mic className="hidden sm:block" size={14} aria-hidden="true" />}
      </button>
    </div>
  );
}
