import { useState } from 'preact/hooks';
import type { StyleDefinition } from 'subs-converter';
import { Modal } from './Modal';
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
  const [showModal, setShowModal] = useState(false);
  const [modalLocal, setModalLocal] = useState<Partial<StyleDefinition>>({});

  const openModal = () => {
    setModalLocal({});
    setShowModal(true);
  };

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
      <div class="se-card-header">
        <span class="se-card-name" onClick={onToggle}>{style.name}</span>
        <span class="se-card-preview" style={{
          fontFamily: value('fontName') || 'Arial',
          fontSize: `${Math.min(value('fontSize') || 20, 16)}px`,
          color: value('primaryColor') ? assColorToHex(value('primaryColor')!) : '#fff',
          fontWeight: value('bold') ? '700' : '400',
          fontStyle: value('italic') ? 'italic' : 'normal',
        }}>
          Aa
        </span>
        <button class="btn btn-sm" onClick={(e) => { e.stopPropagation(); openModal(); }}>Edit</button>
        <span class="se-toggle" onClick={onToggle}>{isOpen ? '▲' : '▼'}</span>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Edit Style: ${style.name}`}>
        <StyleFields
          style={{ ...style, ...modalLocal }}
          onChange={(key, val) => setModalLocal((p) => ({ ...p, [key]: val }))}
        />
        <button
          class="btn btn-export"
          onClick={() => {
            if (Object.keys(modalLocal).length > 0) {
              onUpdate(modalLocal);
              setModalLocal({});
            }
            setShowModal(false);
          }}
        >
          Apply & Close
        </button>
      </Modal>
    </div>
  );
}

function StyleFields({ style, onChange }: {
  style: StyleDefinition;
  onChange: <K extends keyof StyleDefinition>(key: K, value: StyleDefinition[K]) => void;
}) {
  return (
    <>
      <div class="se-row">
        <label>Font</label>
        <input
          value={style.fontName || ''}
          onInput={(e: any) => onChange('fontName', e.currentTarget.value)}
        />
        <label style="min-width:30px">Size</label>
        <input
          type="number"
          style="width:70px"
          value={style.fontSize || 20}
          onInput={(e: any) => onChange('fontSize', parseInt(e.currentTarget.value, 10) || 20)}
        />
      </div>

      <div class="se-row">
        <label>Color</label>
        <div class="se-color-group">
          <input
            type="color"
            value={assColorToHex(style.primaryColor || '&H00FFFFFF')}
            onInput={(e: any) => onChange('primaryColor', hexToAssColor(e.currentTarget.value))}
          />
          <span class="se-color-label">Text</span>
        </div>
        <div class="se-color-group">
          <input
            type="color"
            value={assColorToHex(style.outlineColor || '&H00000000')}
            onInput={(e: any) => onChange('outlineColor', hexToAssColor(e.currentTarget.value))}
          />
          <span class="se-color-label">Outline</span>
        </div>
        <div class="se-color-group">
          <input
            type="color"
            value={assColorToHex(style.backColor || '&H00000000')}
            onInput={(e: any) => onChange('backColor', hexToAssColor(e.currentTarget.value))}
          />
          <span class="se-color-label">Shadow</span>
        </div>
      </div>

      <div class="se-row">
        <label>Bold</label>
        <input type="checkbox" checked={!!style.bold} onChange={(e: any) => onChange('bold', e.currentTarget.checked)} />
        <label>Italic</label>
        <input type="checkbox" checked={!!style.italic} onChange={(e: any) => onChange('italic', e.currentTarget.checked)} />
        <label>Underline</label>
        <input type="checkbox" checked={!!style.underline} onChange={(e: any) => onChange('underline', e.currentTarget.checked)} />
      </div>

      <div class="se-row">
        <label>Outline</label>
        <input type="number" min="0" step="0.5" style="width:70px" value={style.outline ?? 0} onInput={(e: any) => onChange('outline', parseFloat(e.currentTarget.value) || 0)} />
        <label>Shadow</label>
        <input type="number" min="0" step="0.5" style="width:70px" value={style.shadow ?? 0} onInput={(e: any) => onChange('shadow', parseFloat(e.currentTarget.value) || 0)} />
        <label>Spacing</label>
        <input type="number" step="0.5" style="width:70px" value={style.spacing ?? 0} onInput={(e: any) => onChange('spacing', parseFloat(e.currentTarget.value) || 0)} />
      </div>

      <div class="se-row">
        <label>Alignment</label>
        <select style="width:140px" value={style.alignment ?? 2} onChange={(e: any) => onChange('alignment', parseInt(e.currentTarget.value, 10))}>
          {ALIGN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <label>Border</label>
        <input type="number" min="0" max="4" style="width:60px" value={style.borderStyle ?? 1} onInput={(e: any) => onChange('borderStyle', parseInt(e.currentTarget.value, 10) || 1)} />
      </div>

      <div class="se-row">
        <label>Scale X</label>
        <input type="number" min="10" max="200" style="width:70px" value={style.scaleX ?? 100} onInput={(e: any) => onChange('scaleX', parseFloat(e.currentTarget.value) || 100)} />
        <label>Scale Y</label>
        <input type="number" min="10" max="200" style="width:70px" value={style.scaleY ?? 100} onInput={(e: any) => onChange('scaleY', parseFloat(e.currentTarget.value) || 100)} />
      </div>
    </>
  );
}
