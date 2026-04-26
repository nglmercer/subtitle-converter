import { useEffect, useRef } from 'preact/hooks';
import type { UniversalCue } from 'subs-converter';
import './SubtitleList.css';

interface Props {
  cues: UniversalCue[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

function msToTimeStr(ms: number): string {
  const totalSec = ms / 1000;
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  const msPart = Math.round((totalSec % 1) * 1000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(msPart).padStart(3, '0')}`;
}

export function SubtitleList({ cues, selectedIndex, onSelect }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedIndex < 0 || !listRef.current) return;
    const sel = listRef.current.querySelector('[data-selected="true"]') as HTMLElement | null;
    if (sel) {
      const container = listRef.current;
      const itemTop = sel.offsetTop;
      const itemBottom = itemTop + sel.offsetHeight;
      const scrollTop = container.scrollTop;
      const scrollBottom = scrollTop + container.clientHeight;
      if (itemTop < scrollTop || itemBottom > scrollBottom) {
        sel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  return (
    <div class="subtitle-list" ref={listRef}>
      {cues.length === 0 ? (
        <div class="subtitle-item" style={{ color: 'var(--text-secondary)', fontStyle: 'italic', padding: 16 }}>
          No results match your search
        </div>
      ) : (
        cues.map((cue) => {
          const actualIndex = cue.index - 1;
          const isSelected = actualIndex === selectedIndex;
          const actor = cue.formatSpecific?.ass?.actor || "";
          const style = cue.style || "";
          return (
            <div
              key={cue.index}
              data-index={actualIndex}
              data-selected={isSelected ? "true" : undefined}
              class={`subtitle-item${isSelected ? ' selected' : ''}`}
              onClick={() => onSelect(actualIndex)}
            >
              <div class="subtitle-item-meta">
                <span class="subtitle-item-index">#{cue.index}</span>
                {actor && <span class="subtitle-item-actor">{actor}</span>}
                {style && style !== "Default" && (
                  <span class="subtitle-item-style">{style}</span>
                )}
                <span class="subtitle-item-time">
                  {msToTimeStr(cue.startTime)} → {msToTimeStr(cue.endTime)}
                </span>
                <span class="subtitle-item-duration">
                  {(cue.duration / 1000).toFixed(1)}s
                </span>
              </div>
              <div class="subtitle-item-text">
                {cue.text || <span class="subtitle-item-empty">(empty)</span>}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
