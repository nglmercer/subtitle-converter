import type { UniversalCue } from 'subs-converter';

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
  return (
    <div class="subtitle-list">
      {cues.length === 0 ? (
        <div class="subtitle-item" style={{ color: 'var(--text-secondary)', fontStyle: 'italic', padding: 16 }}>
          {cues.length === 0
            ? 'No cues found'
            : 'No results match your search'}
        </div>
      ) : (
        cues.map((cue, i) => {
          const actualIndex = cue.index - 1;
          return (
            <div
              key={cue.index}
              class={`subtitle-item${actualIndex === selectedIndex ? ' selected' : ''}`}
              onClick={() => onSelect(actualIndex)}
            >
              <div class="subtitle-item-meta">
                <span class="subtitle-item-index">#{cue.index}</span>
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
