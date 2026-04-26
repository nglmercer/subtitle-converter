import { useState, useEffect } from 'preact/hooks';
import type { UniversalCue } from 'subs-converter';
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

export function CueEditor({ cue, index, onUpdate }: Props) {
  const [text, setText] = useState(cue.text);
  const [startStr, setStartStr] = useState(msToSrt(cue.startTime));
  const [endStr, setEndStr] = useState(msToSrt(cue.endTime));
  const [actor, setActor] = useState(cue.formatSpecific?.ass?.actor || "");
  const [style, setStyle] = useState(cue.style || "");

  useEffect(() => {
    setText(cue.text);
    setStartStr(msToSrt(cue.startTime));
    setEndStr(msToSrt(cue.endTime));
    setActor(cue.formatSpecific?.ass?.actor || "");
    setStyle(cue.style || "");
  }, [cue, index]);

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
        ass: {
          ...cue.formatSpecific?.ass,
          actor,
        },
      };
    }
    onUpdate(index, updates);
  };

  const duration = Math.max(0, srtToMs(endStr) - srtToMs(startStr));

  return (
    <div class="cue-editor">
      <h3>Cue #{index + 1}</h3>

      <div class="cue-meta-row">
        <div class="cue-meta-group">
          <label for="cue-actor">Actor / Name</label>
          <input
            id="cue-actor"
            class="cue-meta-input"
            value={actor}
            onInput={(e: any) => setActor(e.currentTarget.value)}
          />
        </div>
        <div class="cue-meta-group">
          <label for="cue-style">Style</label>
          <input
            id="cue-style"
            class="cue-meta-input"
            value={style}
            onInput={(e: any) => setStyle(e.currentTarget.value)}
          />
        </div>
      </div>

      <label for="cue-text">Text</label>
      <textarea
        id="cue-text"
        value={text}
        onInput={(e: any) => setText(e.currentTarget.value)}
      />

      <div class="cue-timing">
        <div class="cue-timing-group">
          <label for="cue-start">Start</label>
          <input
            id="cue-start"
            value={startStr}
            onInput={(e: any) => setStartStr(e.currentTarget.value)}
          />
        </div>
        <div class="cue-timing-group">
          <label for="cue-end">End</label>
          <input
            id="cue-end"
            value={endStr}
            onInput={(e: any) => setEndStr(e.currentTarget.value)}
          />
        </div>
      </div>

      <div class="cue-info">
        <span>Duration: {(duration / 1000).toFixed(2)}s</span>
        <span>{(duration / cue.text.length).toFixed(0) || 0} ms/char</span>
      </div>

      <button class="btn btn-export" onClick={handleApply}>
        Apply Changes
      </button>
    </div>
  );
}
