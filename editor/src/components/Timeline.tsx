import type { UniversalCue } from 'subs-converter';
import './Timeline.css';

interface Props {
  cues: UniversalCue[];
  totalMs: number;
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const CUE_COLORS = [
  '#1f6feb', '#238636', '#9e6a03', '#bd2b2b',
  '#8250df', '#1b7c83', '#c061cb', '#d29922',
];

function getCueColor(index: number): string {
  return CUE_COLORS[index % CUE_COLORS.length];
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function generateTicks(totalMs: number): number[] {
  const totalSec = totalMs / 1000;
  if (totalSec <= 0) return [0];
  const step = totalSec <= 10 ? 1 : totalSec <= 30 ? 2 : totalSec <= 60 ? 5 : totalSec <= 300 ? 15 : 30;
  const ticks: number[] = [];
  for (let t = 0; t <= totalSec + step; t += step) {
    ticks.push(t * 1000);
  }
  return ticks;
}

export function Timeline({ cues, totalMs, selectedIndex, onSelect }: Props) {
  if (cues.length === 0) return null;

  const PX_PER_SEC = 80;
  const totalWidth = Math.max((totalMs / 1000) * PX_PER_SEC, 400);
  const ticks = generateTicks(totalMs);

  return (
    <div class="timeline-container">
      <div class="timeline-header" style={{ width: `${totalWidth}px` }}>
        <div class="timeline-ruler">
          {ticks.map((tick) => (
            <div
              key={tick}
              class="timeline-tick"
              style={{ left: `${(tick / totalMs) * totalWidth * (totalMs > 0 ? 1 : 0)}px` }}
            >
              {formatTime(tick)}
            </div>
          ))}
        </div>
      </div>
      <div
        class="timeline-body"
        style={{ width: `${totalWidth}px` }}
      >
        {cues.map((cue, i) => {
          const left = totalMs > 0 ? (cue.startTime / totalMs) * totalWidth : 0;
          const w = totalMs > 0 ? ((cue.endTime - cue.startTime) / totalMs) * totalWidth : 0;
          return (
            <div
              key={cue.index}
              class={`timeline-cue${i === selectedIndex ? ' selected' : ''}`}
              style={{
                left: `${left}px`,
                width: `${Math.max(w, 4)}px`,
                background: getCueColor(i),
              }}
              onClick={() => onSelect(i)}
              title={`#${cue.index}: ${cue.text}`}
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
