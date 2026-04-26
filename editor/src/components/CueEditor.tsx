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

function extractStart(raw: string): string {
  const m = raw.match(/(\d{2}:\d{2}:\d{2}[,.]\d{3})/);
  return m?.[1] || '00:00:00,000';
}

function extractEnd(raw: string): string {
  const parts = raw.split(/-->/);
  if (parts.length < 2) return '00:00:00,000';
  const m = parts[1].match(/(\d{2}:\d{2}:\d{2}[,.]\d{3})/);
  return m?.[1] || '00:00:00,000';
}

export function CueEditor({ cue, index, onUpdate }: Props) {
  const [text, setText] = useState(cue.text);
  const [startStr, setStartStr] = useState(msToSrt(cue.startTime));
  const [endStr, setEndStr] = useState(msToSrt(cue.endTime));

  useEffect(() => {
    setText(cue.text);
    setStartStr(msToSrt(cue.startTime));
    setEndStr(msToSrt(cue.endTime));
  }, [cue, index]);

  const handleApply = () => {
    const startMs = srtToMs(startStr);
    const endMs = srtToMs(endStr);
    if (startMs >= endMs) return;
    onUpdate(index, {
      text,
      startTime: startMs,
      endTime: endMs,
      duration: endMs - startMs,
    });
  };

  const duration = Math.max(0, srtToMs(endStr) - srtToMs(startStr));

  return (
    <div class="cue-editor">
      <h3>Cue #{index + 1}</h3>

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
