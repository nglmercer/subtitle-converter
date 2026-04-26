import { useState } from 'preact/hooks';
import type { StyleDefinition, UniversalSubtitle } from 'subs-converter';
import './StyleEditor.css';

interface Props {
  styles: StyleDefinition[];
  onUpdate: (name: string, updates: Partial<StyleDefinition>) => void;
}

function assColorToHex(color: string): string {
  const m = color.match(/^&H([0-9A-Fa-f]{6,8})$/);
  if (!m) return '#ffffff';
  const hex = m[1]!;
  const len = hex.length;
  const rr = parseInt(hex.slice(len - 2), 16);
  const gg = parseInt(hex.slice(len - 4, len - 2), 16);
  const bb = parseInt(hex.slice(len - 6, len - 4), 16);
  return `#${rr.toString(16).padStart(2, '0')}${gg.toString(16).padStart(2, '0')}${bb.toString(16).padStart(2, '0')}`;
}

function hexToAssColor(hex: string): string {
  const c = hex.replace('#', '');
  const r = c.slice(0, 2);
  const g = c.slice(2, 4);
  const b = c.slice(4, 6);
  return `&H00${b}${g}${r}`;
}

const ALIGN_OPTIONS = [
  { value: 1, label: 'Bottom Left' },
  { value: 2, label: 'Bottom Center' },
  { value: 3, label: 'Bottom Right' },
  { value: 4, label: 'Middle Left' },
  { value: 5, label: 'Middle Center' },
  { value: 6, label: 'Middle Right' },
  { value: 7, label: 'Top Left' },
  { value: 8, label: 'Top Center' },
  { value: 9, label: 'Top Right' },
];

export function StyleEditor({ styles, onUpdate }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (styles.length === 0) return null;

  return (
    <div class="style-editor">
      <div class="se-header" onClick={() => setExpanded(expanded ? null : '_panel')}>
        <h3>Styles ({styles.length})</h3>
        <span class="se-toggle">{expanded ? '▼' : '▶'}</span>
      </div>

      {expanded && (
        <div class="se-body">
          {styles.map((style) => (
            <StyleCard
              key={style.name}
              style={style}
              isOpen={expanded === style.name}
              onToggle={() => setExpanded(expanded === style.name ? null : style.name)}
              onUpdate={(updates) => onUpdate(style.name, updates)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CardProps {
  style: StyleDefinition;
  isOpen: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<StyleDefinition>) => void;
}

function StyleCard({ style, isOpen, onToggle, onUpdate }: CardProps) {
  const [local, setLocal] = useState<Partial<StyleDefinition>>({});

  const value = <K extends keyof StyleDefinition>(key: K): StyleDefinition[K] =>
    key in local ? local[key] : style[key];

  const change = <K extends keyof StyleDefinition>(key: K, val: StyleDefinition[K]) => {
    setLocal((p) => ({ ...p, [key]: val }));
  };

  const apply = () => {
    if (Object.keys(local).length > 0) {
      onUpdate(local);
      setLocal({});
    }
  };

  const hasChanges = Object.keys(local).length > 0;

  return (
    <div class="se-card">
      <div class="se-card-header" onClick={onToggle}>
        <span class="se-card-name">{style.name}</span>
        <span class="se-card-preview" style={{
          fontFamily: value('fontName') || 'Arial',
          fontSize: `${Math.min(value('fontSize') || 20, 16)}px`,
          color: value('primaryColor') ? assColorToHex(value('primaryColor')!) : '#fff',
          fontWeight: value('bold') ? '700' : '400',
          fontStyle: value('italic') ? 'italic' : 'normal',
        }}>
          Aa
        </span>
        <span class="se-toggle">{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div class="se-card-body">
          <div class="se-row">
            <label>Font</label>
            <input
              value={value('fontName') || ''}
              onInput={(e: any) => change('fontName', e.currentTarget.value)}
            />
          </div>

          <div class="se-row">
            <label>Size</label>
            <input
              type="number"
              value={value('fontSize') || 20}
              onInput={(e: any) => change('fontSize', parseInt(e.currentTarget.value, 10) || 20)}
            />
          </div>

          <div class="se-row">
            <label>Color</label>
            <div class="se-color-group">
              <input
                type="color"
                value={assColorToHex(value('primaryColor') || '&H00FFFFFF')}
                onInput={(e: any) => change('primaryColor', hexToAssColor(e.currentTarget.value))}
              />
              <span class="se-color-label">Text</span>
            </div>
            <div class="se-color-group">
              <input
                type="color"
                value={assColorToHex(value('outlineColor') || '&H00000000')}
                onInput={(e: any) => change('outlineColor', hexToAssColor(e.currentTarget.value))}
              />
              <span class="se-color-label">Outline</span>
            </div>
            <div class="se-color-group">
              <input
                type="color"
                value={assColorToHex(value('backColor') || '&H00000000')}
                onInput={(e: any) => change('backColor', hexToAssColor(e.currentTarget.value))}
              />
              <span class="se-color-label">Shadow</span>
            </div>
          </div>

          <div class="se-row">
            <label>Bold</label>
            <input
              type="checkbox"
              checked={!!value('bold')}
              onChange={(e: any) => change('bold', e.currentTarget.checked)}
            />
            <label>Italic</label>
            <input
              type="checkbox"
              checked={!!value('italic')}
              onChange={(e: any) => change('italic', e.currentTarget.checked)}
            />
            <label>Underline</label>
            <input
              type="checkbox"
              checked={!!value('underline')}
              onChange={(e: any) => change('underline', e.currentTarget.checked)}
            />
          </div>

          <div class="se-row">
            <label>Outline</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={value('outline') ?? 0}
              onInput={(e: any) => change('outline', parseFloat(e.currentTarget.value) || 0)}
            />
            <label>Shadow</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={value('shadow') ?? 0}
              onInput={(e: any) => change('shadow', parseFloat(e.currentTarget.value) || 0)}
            />
          </div>

          <div class="se-row">
            <label>Alignment</label>
            <select
              value={value('alignment') ?? 2}
              onChange={(e: any) => change('alignment', parseInt(e.currentTarget.value, 10))}
            >
              {ALIGN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div class="se-row">
            <label>Scale X</label>
            <input
              type="number"
              min="10"
              max="200"
              value={value('scaleX') ?? 100}
              onInput={(e: any) => change('scaleX', parseFloat(e.currentTarget.value) || 100)}
            />
            <label>Scale Y</label>
            <input
              type="number"
              min="10"
              max="200"
              value={value('scaleY') ?? 100}
              onInput={(e: any) => change('scaleY', parseFloat(e.currentTarget.value) || 100)}
            />
          </div>

          <button
            class={`btn se-apply${hasChanges ? '' : ' btn-disabled'}`}
            onClick={apply}
            disabled={!hasChanges}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
