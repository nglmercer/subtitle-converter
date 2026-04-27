import type { JSX } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { UniversalCue } from 'subs-converter';
import { Modal } from './Modal';
import './CueEditor.css';

interface Props {
  cue: UniversalCue;
  index: number;
  onUpdate: (index: number, updates: Partial<UniversalCue>) => void;
}

function msToSrt(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const msPart = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(msPart).padStart(3, '0')}`;
}

function srtToMs(str: string): number {
  const m = str.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
  if (!m) return 0;
  return parseInt(m[1], 10) * 3600000
    + parseInt(m[2], 10) * 60000
    + parseInt(m[3], 10) * 1000
    + parseInt(m[4], 10);
}

function msToTimeShort(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
}

export function CueEditor({ cue, index, onUpdate }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [text, setText] = useState(cue.text);
  const [startStr, setStartStr] = useState(msToSrt(cue.startTime));
  const [endStr, setEndStr] = useState(msToSrt(cue.endTime));
  const [actor, setActor] = useState(cue.formatSpecific?.ass?.actor || "");
  const [style, setStyle] = useState(cue.style || "");

  useEffect(() => {
    if (!showModal) {
      setText(cue.text);
      setStartStr(msToSrt(cue.startTime));
      setEndStr(msToSrt(cue.endTime));
      setActor(cue.formatSpecific?.ass?.actor || "");
      setStyle(cue.style || "");
    }
  }, [cue, index, showModal]);

  const openModal = () => {
    setText(cue.text);
    setStartStr(msToSrt(cue.startTime));
    setEndStr(msToSrt(cue.endTime));
    setActor(cue.formatSpecific?.ass?.actor || "");
    setStyle(cue.style || "");
    setShowModal(true);
  };

  const handleApply = () => {
    const startMs = srtToMs(startStr);
    const endMs = srtToMs(endStr);
    if (startMs >= endMs) return;
    const updates: Partial<UniversalCue> = {
      text,
      startTime: startMs,
      endTime: endMs,
      duration: endMs - startMs,
      style,
    };
    if (actor) {
      updates.formatSpecific = {
        ...cue.formatSpecific,
        ass: { ...cue.formatSpecific?.ass, actor },
      };
    }
    onUpdate(index, updates);
    setShowModal(false);
  };

  const duration = Math.max(0, srtToMs(endStr) - srtToMs(startStr));
  const actorName = cue.formatSpecific?.ass?.actor || "";

  return (
    <>
      <div class="cue-editor">
        <div class="cue-editor-head">
          <h3>Cue #{index + 1}</h3>
          <button class="btn-icon" onClick={openModal} title="Edit cue">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </div>
        <div class="cue-summary">
          <div class="cue-summary-row">
            <span class="cue-summary-time">{msToTimeShort(cue.startTime)} → {msToTimeShort(cue.endTime)}</span>
            <span class="cue-summary-dur">{(cue.duration / 1000).toFixed(1)}s</span>
          </div>
          {actorName && <div class="cue-summary-actor">{actorName}</div>}
          {cue.style && cue.style !== "Default" && <div class="cue-summary-style">{cue.style}</div>}
          <div class="cue-summary-text">{(cue.text || '(empty)').slice(0, 120)}</div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Cue #${index + 1} — Editor`}>
        <div class="cue-meta-row">
          <div class="cue-meta-group">
            <label for="modal-actor">Actor / Name</label>
            <input
              id="modal-actor"
              class="cue-meta-input"
              value={actor}
              onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => setActor(e.currentTarget.value)}
            />
          </div>
          <div class="cue-meta-group">
            <label for="modal-style">Style</label>
            <input
              id="modal-style"
              class="cue-meta-input"
              value={style}
              onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => setStyle(e.currentTarget.value)}
            />
          </div>
        </div>

        <label for="modal-text">Text</label>
        <textarea
          id="modal-text"
          class="cue-editor-modal-text"
          value={text}
          onInput={(e: JSX.TargetedEvent<HTMLTextAreaElement>) => setText(e.currentTarget.value)}
        />

        <div class="cue-timing">
          <div class="cue-timing-group">
            <label for="modal-start">Start</label>
            <input
              id="modal-start"
              value={startStr}
              onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => setStartStr(e.currentTarget.value)}
            />
          </div>
          <div class="cue-timing-group">
            <label for="modal-end">End</label>
            <input
              id="modal-end"
              value={endStr}
              onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => setEndStr(e.currentTarget.value)}
            />
          </div>
        </div>

        <div class="cue-info">
          <span>Duration: {(duration / 1000).toFixed(2)}s</span>
          <span>{(duration / (text.length || 1)).toFixed(0)} ms/char</span>
        </div>

        <button class="btn btn-export" onClick={handleApply}>
          Apply Changes
        </button>
      </Modal>
    </>
  );
}
