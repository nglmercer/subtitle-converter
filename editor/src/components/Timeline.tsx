import type { UniversalCue } from 'subs-converter';
import './Timeline.css';

interface Props {
  cues: UniversalCue[];
  totalMs: number;
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const PALETTE = [
  '#1f6feb', '#238636', '#9e6a03', '#bd2b2b',
  '#8250df', '#1b7c83', '#c061cb', '#d29922',
  '#f78166', '#56d364', '#db6d28', '#bc8cff',
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getCueGroupKey(cue: UniversalCue): string {
  return cue.formatSpecific?.ass?.actor || cue.style || '';
}

function getCueColor(cue: UniversalCue): string {
  const key = getCueGroupKey(cue);
  if (!key) return PALETTE[0];
  return PALETTE[hashString(key) % PALETTE.length];
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function formatTimeFull(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const mill = ms % 1000;
  return `${m}:${String(sec).padStart(2, '0')}.${String(Math.floor(mill / 100)).padStart(1, '0')}`;
}

interface TickPlan {
  majorStep: number;
  minorStep: number;
}

function planTicks(totalSec: number): TickPlan {
  if (totalSec <= 0) return { majorStep: 1, minorStep: 0 };
  if (totalSec <= 10) return { majorStep: 5, minorStep: 1 };
  if (totalSec <= 30) return { majorStep: 10, minorStep: 5 };
  if (totalSec <= 60) return { majorStep: 15, minorStep: 5 };
  if (totalSec <= 180) return { majorStep: 30, minorStep: 15 };
  if (totalSec <= 600) return { majorStep: 60, minorStep: 30 };
  if (totalSec <= 1800) return { majorStep: 300, minorStep: 60 };
  return { majorStep: 600, minorStep: 300 };
}

export function Timeline({ cues, totalMs, selectedIndex, onSelect }: Props) {
  if (cues.length === 0) return null;

  const PX_PER_SEC = 80;
  const totalSec = totalMs / 1000;
  const totalWidth = Math.max(totalSec * PX_PER_SEC, 400);
  const tickPlan = planTicks(totalSec);
  const sel = selectedIndex >= 0 && selectedIndex < cues.length ? cues[selectedIndex] : null;

  const minorTicks: number[] = [];
  if (tickPlan.minorStep > 0) {
    for (let t = tickPlan.minorStep; t < totalSec; t += tickPlan.minorStep) {
      if (t % tickPlan.majorStep !== 0) minorTicks.push(t * 1000);
    }
  }

  const majorTicks: number[] = [];
  for (let t = 0; t <= totalSec + tickPlan.majorStep; t += tickPlan.majorStep) {
    majorTicks.push(t * 1000);
  }

  return (
    <div class="timeline-container">
      <div class="timeline-header" style={{ width: `${totalWidth}px` }}>
        <div class="timeline-ruler">
          {minorTicks.map((ms) => (
            <div
              key={`mi-${ms}`}
              class="timeline-tick timeline-tick-minor"
              style={{ left: `${(ms / totalMs) * totalWidth}px` }}
            />
          ))}
          {majorTicks.map((ms) => (
            <div
              key={`ma-${ms}`}
              class="timeline-tick timeline-tick-major"
              style={{ left: `${(ms / totalMs) * totalWidth}px` }}
            >
              <span class="timeline-tick-label">{formatTime(ms)}</span>
            </div>
          ))}
          {sel && (
            <div
              class="timeline-now-flag"
              style={{
                left: `${(sel.startTime / totalMs) * totalWidth}px`,
              }}
            >
              <span class="timeline-now-label">{formatTimeFull(sel.startTime)}</span>
            </div>
          )}
        </div>
      </div>
      <div
        class="timeline-body"
        style={{ width: `${totalWidth}px` }}
      >
        {cues.map((cue, i) => {
          const left = totalMs > 0 ? (cue.startTime / totalMs) * totalWidth : 0;
          const w = totalMs > 0 ? ((cue.endTime - cue.startTime) / totalMs) * totalWidth : 0;
          const key = getCueGroupKey(cue);
          return (
            <div
              key={cue.index}
              class={`timeline-cue${i === selectedIndex ? ' selected' : ''}${key ? ' timeline-cue-grouped' : ''}`}
              style={{
                left: `${left}px`,
                width: `${Math.max(w, 4)}px`,
                background: getCueColor(cue),
              }}
              onClick={() => onSelect(i)}
              title={`#${cue.index}${key ? ` [${key}]` : ''}: ${formatTimeFull(cue.startTime)} → ${formatTimeFull(cue.endTime)} (${(cue.duration / 1000).toFixed(1)}s)\n${cue.text}`}
            >
              {w > 40 && (
                <span class="timeline-cue-label">
                  {cue.text.length > 20 ? cue.text.slice(0, 20) + '…' : cue.text}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
