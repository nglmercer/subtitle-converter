import { useState } from 'preact/hooks';
import type { UniversalSubtitle } from 'subs-converter';
import { Modal } from './Modal';
import './ActorManager.css';

interface Props {
  universal: UniversalSubtitle;
  onActorRename: (oldName: string, newName: string) => void;
}

export function ActorManager({ universal, onActorRename }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [modalActor, setModalActor] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const actorMap = new Map<string, number>();
  for (const cue of universal.cues) {
    const actor = cue.formatSpecific?.ass?.actor || '';
    if (actor) {
      actorMap.set(actor, (actorMap.get(actor) || 0) + 1);
    }
  }

  const actors = [...actorMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  if (actors.length === 0) return null;

  const handleOpenRename = (name: string) => {
    setModalActor(name);
    setRenameValue(name);
  };

  const handleConfirmRename = () => {
    if (!modalActor) return;
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== modalActor) {
      onActorRename(modalActor, trimmed);
    }
    setModalActor(null);
    setRenameValue('');
  };

  const cueSamples = modalActor
    ? universal.cues
        .filter((c) => c.formatSpecific?.ass?.actor === modalActor)
        .slice(0, 5)
    : [];

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
              <span class="am-name">{actor.name}</span>
              <span class="am-count">{actor.count}</span>
              <button class="btn-icon" onClick={() => handleOpenRename(actor.name)} title="Rename">✎</button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalActor !== null} onClose={() => setModalActor(null)} title={`Rename: ${modalActor || ''}`}>
        <>
        <label for="am-rename-input" style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:4px;">New name</label>
        <input
          id="am-rename-input"
          class="am-edit-input"
          value={renameValue}
          onInput={(e: any) => setRenameValue(e.currentTarget.value)}
          onKeyDown={(e: KeyboardEvent) => {
            if (e.key === 'Enter') handleConfirmRename();
            if (e.key === 'Escape') setModalActor(null);
          }}
          autoFocus
          style="width:100%;padding:6px 10px;font-size:14px;"
        />

        {cueSamples.length > 0 ? (
          <div style="margin-top:8px;">
            <div style="font-size:10px;color:var(--text-secondary);margin-bottom:4px;">Affected cues ({actorMap.get(modalActor || '') || 0} total):</div>
            {cueSamples.map((c, i) => (
              <div key={i} style="font-size:11px;padding:3px 6px;border:1px solid var(--border);border-radius:3px;margin-bottom:3px;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                {c.text.slice(0, 60)}
              </div>
            ))}
          </div>
        ) : null}

        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="btn btn-export" onClick={handleConfirmRename}>Rename</button>
          <button class="btn btn-secondary" onClick={() => setModalActor(null)}>Cancel</button>
        </div>
        </>
      </Modal>
    </div>
  );
}
