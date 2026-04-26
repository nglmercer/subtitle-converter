import { useState } from 'preact/hooks';
import type { UniversalSubtitle } from 'subs-converter';
import './ActorManager.css';

interface Props {
  universal: UniversalSubtitle;
  onActorRename: (oldName: string, newName: string) => void;
}

interface ActorEntry {
  name: string;
  count: number;
}

export function ActorManager({ universal, onActorRename }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const actorMap = new Map<string, number>();
  for (const cue of universal.cues) {
    const actor = cue.formatSpecific?.ass?.actor || '';
    if (actor) {
      actorMap.set(actor, (actorMap.get(actor) || 0) + 1);
    }
  }

  const actors: ActorEntry[] = [];
  for (const [name, count] of actorMap) {
    actors.push({ name, count });
  }
  actors.sort((a, b) => b.count - a.count);

  if (actors.length === 0) return null;

  const handleStartRename = (name: string) => {
    setEditing(name);
    setRenameValue(name);
  };

  const handleConfirmRename = (oldName: string) => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== oldName) {
      onActorRename(oldName, trimmed);
    }
    setEditing(null);
    setRenameValue('');
  };

  return (
    <div class="actor-manager">
      <div class="am-header" onClick={() => setExpanded(!expanded)}>
        <h3>Actors ({actors.length})</h3>
        <span class="am-toggle">{expanded ? '▼' : '▶'}</span>
      </div>

      {expanded && (
        <div class="am-body">
          {actors.map((actor) => (
            <div key={actor.name} class="am-row">
              {editing === actor.name ? (
                <div class="am-edit-group">
                  <input
                    class="am-edit-input"
                    value={renameValue}
                    onInput={(e: any) => setRenameValue(e.currentTarget.value)}
                    onKeyDown={(e: KeyboardEvent) => {
                      if (e.key === 'Enter') handleConfirmRename(actor.name);
                      if (e.key === 'Escape') setEditing(null);
                    }}
                    autoFocus
                  />
                  <button class="am-btn am-btn-ok" onClick={() => handleConfirmRename(actor.name)}>✓</button>
                  <button class="am-btn am-btn-cancel" onClick={() => setEditing(null)}>✕</button>
                </div>
              ) : (
                <>
                  <span class="am-name">{actor.name}</span>
                  <span class="am-count">{actor.count}</span>
                  <button class="am-btn am-btn-rename" onClick={() => handleStartRename(actor.name)}>Rename</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
