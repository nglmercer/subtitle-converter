import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import type { StyleDefinition } from 'subs-converter';
import { Modal } from './Modal';
import { assColorToHex, hexToAssColor, assColorToCss, buildTextShadows } from '../utils/color';
import './StyleEditor.css';

interface Props {
  styles: StyleDefinition[];
  onUpdate: (name: string, updates: Partial<StyleDefinition>) => void;
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

function AlignIcon({ value }: { value: number }) {
  const icons: Record<number, JSX.Element> = {
    1: <polyline points="7 17 7 7 17 7" transform="rotate(-90 12 12)" />,
    2: <><polyline points="7 13 12 18 17 13" /><line x1="12" y1="6" x2="12" y2="18" /></>,
    3: <polyline points="7 17 7 7 17 7" transform="rotate(180 12 12)" />,
    4: <><polyline points="11 17 6 12 11 7" /><line x1="18" y1="12" x2="6" y2="12" /></>,
    5: <circle cx="12" cy="12" r="3" fill="currentColor" />,
    6: <><polyline points="13 17 18 12 13 7" /><line x1="6" y1="12" x2="18" y2="12" /></>,
    7: <polyline points="7 17 7 7 17 7" />,
    8: <><polyline points="17 11 12 6 7 11" /><line x1="12" y1="18" x2="12" y2="6" /></>,
    9: <polyline points="7 17 7 7 17 7" transform="rotate(90 12 12)" />,
  };

  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      {icons[value] || icons[5]}
    </svg>
  );
}

export function StyleEditor({ styles, onUpdate }: Props) {
  const [editingStyle, setEditingStyle] = useState<StyleDefinition | null>(null);
  const [modalDraft, setModalDraft] = useState<Partial<StyleDefinition>>({});

  if (styles.length === 0) return null;

  const openModal = (s: StyleDefinition) => {
    setEditingStyle(s);
    setModalDraft({});
  };

  const applyModal = () => {
    if (editingStyle && Object.keys(modalDraft).length > 0) {
      onUpdate(editingStyle.name, modalDraft);
    }
    setEditingStyle(null);
    setModalDraft({});
  };

  const handleFieldChange = <K extends keyof StyleDefinition>(key: K, value: StyleDefinition[K]) => {
    setModalDraft((p) => ({ ...p, [key]: value }));
  };

  const currentStyle = editingStyle ? { ...editingStyle, ...modalDraft } : null;

  return (
    <div class="style-editor">
      <div class="se-body">
        {styles.map((s) => (
          <StyleCard key={s.name} style={s} onEdit={() => openModal(s)} />
        ))}
      </div>

      <Modal isOpen={editingStyle !== null} onClose={() => setEditingStyle(null)} title={`Edit Style: ${editingStyle?.name || ''}`}>
        {currentStyle ? (
          <div class="se-modal-layout">
            <div class="se-modal-fields">
              <FieldSection title="Typography">
                <FieldRow>
                  <Field label="Font">
                    <input
                      value={currentStyle.fontName || ''}
                      onInput={(e: any) => handleFieldChange('fontName', e.currentTarget.value)}
                    />
                  </Field>
                  <Field label="Size">
                    <input
                      type="number"
                      min="1" max="999"
                      value={currentStyle.fontSize ?? 20}
                      onInput={(e: any) => handleFieldChange('fontSize', parseInt(e.currentTarget.value, 10) || 20)}
                    />
                  </Field>
                </FieldRow>
                <FieldRow>
                  <Field label="Bold">
                    <input type="checkbox" checked={!!currentStyle.bold} onChange={(e: any) => handleFieldChange('bold', e.currentTarget.checked)} />
                  </Field>
                  <Field label="Italic">
                    <input type="checkbox" checked={!!currentStyle.italic} onChange={(e: any) => handleFieldChange('italic', e.currentTarget.checked)} />
                  </Field>
                  <Field label="Underline">
                    <input type="checkbox" checked={!!currentStyle.underline} onChange={(e: any) => handleFieldChange('underline', e.currentTarget.checked)} />
                  </Field>
                  <Field label="Strike">
                    <input type="checkbox" checked={!!currentStyle.strikeOut} onChange={(e: any) => handleFieldChange('strikeOut', e.currentTarget.checked)} />
                  </Field>
                </FieldRow>
              </FieldSection>

              <FieldSection title="Colors">
                <FieldRow>
                  <ColorField
                    label="Text"
                    value={assColorToHex(currentStyle.primaryColor || '&H00FFFFFF')}
                    onChange={(v) => handleFieldChange('primaryColor', hexToAssColor(v))}
                  />
                  <ColorField
                    label="Outline"
                    value={assColorToHex(currentStyle.outlineColor || '&H00000000')}
                    onChange={(v) => handleFieldChange('outlineColor', hexToAssColor(v))}
                  />
                  <ColorField
                    label="Shadow"
                    value={assColorToHex(currentStyle.backColor || '&H00000000')}
                    onChange={(v) => handleFieldChange('backColor', hexToAssColor(v))}
                  />
                </FieldRow>
              </FieldSection>

              <FieldSection title="Geometry">
                <FieldRow>
                  <Field label="Scale X">
                    <input type="number" min="10" max="300" value={currentStyle.scaleX ?? 100} onInput={(e: any) => handleFieldChange('scaleX', parseFloat(e.currentTarget.value) || 100)} />
                  </Field>
                  <Field label="Scale Y">
                    <input type="number" min="10" max="300" value={currentStyle.scaleY ?? 100} onInput={(e: any) => handleFieldChange('scaleY', parseFloat(e.currentTarget.value) || 100)} />
                  </Field>
                  <Field label="Angle">
                    <input type="number" step="5" min="0" max="359" value={currentStyle.angle ?? 0} onInput={(e: any) => handleFieldChange('angle', parseFloat(e.currentTarget.value) || 0)} />
                  </Field>
                </FieldRow>
              </FieldSection>

              <FieldSection title="Effects">
                <FieldRow>
                  <Field label="Outline W">
                    <input type="number" min="0" step="0.5" max="10" value={currentStyle.outline ?? 0} onInput={(e: any) => handleFieldChange('outline', parseFloat(e.currentTarget.value) || 0)} />
                  </Field>
                  <Field label="Shadow D">
                    <input type="number" min="0" step="0.5" max="10" value={currentStyle.shadow ?? 0} onInput={(e: any) => handleFieldChange('shadow', parseFloat(e.currentTarget.value) || 0)} />
                  </Field>
                  <Field label="Spacing">
                    <input type="number" step="0.5" min="-10" max="20" value={currentStyle.spacing ?? 0} onInput={(e: any) => handleFieldChange('spacing', parseFloat(e.currentTarget.value) || 0)} />
                  </Field>
                </FieldRow>
                <FieldRow>
                  <Field label="Border">
                    <select value={currentStyle.borderStyle ?? 1} onChange={(e: any) => handleFieldChange('borderStyle', parseInt(e.currentTarget.value, 10))}>
                      <option value={1}>Normal</option>
                      <option value={3}>Opaque box</option>
                    </select>
                  </Field>
                  <Field label="Align">
                    <select value={currentStyle.alignment ?? 2} onChange={(e: any) => handleFieldChange('alignment', parseInt(e.currentTarget.value, 10))}>
                      {ALIGN_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </Field>
                </FieldRow>
              </FieldSection>

              <div class="se-modal-actions">
                <button class="btn btn-export" onClick={applyModal}>
                  Apply Changes
                </button>
              </div>
            </div>
            <div class="se-modal-preview">
              <div class="se-preview-header">Live Preview</div>
              <div class="se-preview-screen">
                <div
                  class="se-preview-text"
                  style={{
                    fontFamily: `${currentStyle.fontName || 'Arial'}, sans-serif`,
                    fontSize: `${Math.min(currentStyle.fontSize ?? 20, 120)}px`,
                    color: assColorToCss(currentStyle.primaryColor || '&H00FFFFFF'),
                    fontWeight: currentStyle.bold ? '700' : '400',
                    fontStyle: currentStyle.italic ? 'italic' : 'normal',
                    textDecoration: currentStyle.underline ? 'underline' : 'none',
                    textShadow: buildTextShadows(currentStyle).join(', ') || 'none',
                    letterSpacing: `${currentStyle.spacing ?? 0}px`,
                    transform: `scaleX(${(currentStyle.scaleX ?? 100) / 100}) scaleY(${(currentStyle.scaleY ?? 100) / 100}) rotate(${currentStyle.angle ?? 0}deg)`,
                  }}
                >
                  Style Preview
                </div>
                <div class="se-preview-subtext">
                  The quick brown fox jumps over the lazy dog.
                </div>
              </div>
            </div>
          </div>
        ) : <div />}
      </Modal>
    </div>
  );
}

function StyleCard({ style, onEdit }: { style: StyleDefinition; onEdit: () => void }) {
  const shadows = buildTextShadows(style);

  return (
    <div class="se-card" onClick={onEdit}>
      <div class="se-card-preview-area" style={{
        background: style.backColor ? assColorToCss(style.backColor) : '#0d1117',
      }}>
        <span
          class="se-card-sample"
          style={{
            fontFamily: `${style.fontName || 'Arial'}, sans-serif`,
            fontSize: `${Math.min(style.fontSize ?? 20, 20)}px`,
            color: assColorToCss(style.primaryColor || '&H00FFFFFF'),
            fontWeight: style.bold ? '700' : '400',
            fontStyle: style.italic ? 'italic' : 'normal',
            textDecoration: style.underline ? 'underline' : 'none',
            textShadow: shadows.length > 0 ? shadows.join(', ') : 'none',
            letterSpacing: `${style.spacing ?? 0}px`,
          }}
        >
          Aa
        </span>
      </div>
      <div class="se-card-info">
        <span class="se-card-name">{style.name}</span>
        <span class="se-card-meta">{style.fontName || 'Arial'} {style.fontSize ?? 20}px</span>
      </div>
      <div class="se-card-badge"><AlignIcon value={style.alignment ?? 2} /></div>
    </div>
  );
}

function FieldSection({ title, children }: { title: string; children: any }) {
  return (
    <div class="se-field-section">
      <div class="se-field-section-title">{title}</div>
      {children}
    </div>
  );
}

function FieldRow({ children }: { children: any }) {
  return <div class="se-field-row">{children}</div>;
}

function Field({ label, children }: { label: string; children: any }) {
  return (
    <label class="se-field">
      <span class="se-field-label">{label}</span>
      {children}
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label class="se-field se-color-field">
      <span class="se-field-label">{label}</span>
      <span class="se-color-picker-wrap">
        <input type="color" value={value} onInput={(e: any) => onChange(e.currentTarget.value)} />
        <span class="se-color-hex">{value}</span>
      </span>
    </label>
  );
}
