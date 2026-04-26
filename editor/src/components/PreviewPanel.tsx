import type { UniversalSubtitle, StyleDefinition } from 'subs-converter';
import './PreviewPanel.css';

interface Props {
  universal: UniversalSubtitle;
  selectedIndex: number;
}

function assColorToCss(color: string): string {
  const m8 = color.match(/^&H([0-9A-Fa-f]{8})$/);
  if (m8) {
    const hex = m8[1];
    const aa = parseInt(hex.slice(0, 2), 16);
    const bb = parseInt(hex.slice(2, 4), 16);
    const gg = parseInt(hex.slice(4, 6), 16);
    const rr = parseInt(hex.slice(6, 8), 16);
    const a = 1 - aa / 255;
    return `rgba(${rr},${gg},${bb},${a.toFixed(3)})`;
  }
  const m6 = color.match(/^&H([0-9A-Fa-f]{6})$/);
  if (m6) {
    const hex = m6[1];
    const bb = parseInt(hex.slice(0, 2), 16);
    const gg = parseInt(hex.slice(2, 4), 16);
    const rr = parseInt(hex.slice(4, 6), 16);
    return `rgb(${rr},${gg},${bb})`;
  }
  return color || '#FFFFFF';
}

function assTextToHtml(text: string): string {
  const openTags: string[] = [];

  const closeAll = (): string => {
    const out = openTags.reverse().join('');
    openTags.length = 0;
    return out;
  };

  let result = text
    .replace(/\\N/g, '\n')
    .replace(/\\n/g, ' ')
    .replace(/\\h/g, ' ');

  result = result.replace(/\{[^}]*\}/g, (tag) => {
    const inner = tag.slice(1, -1);
    if (!inner.startsWith('\\')) return tag;

    if (/^\\[bius]1$/.test(inner) || /^\\[bius]-1$/.test(inner)) {
      const t = inner[1];
      if (t === 'b') { openTags.push('</b>'); return '<b>'; }
      if (t === 'i') { openTags.push('</i>'); return '<i>'; }
      if (t === 'u') { openTags.push('</u>'); return '<u>'; }
      if (t === 's') { openTags.push('</s>'); return '<s>'; }
    }
    if (/^\\[bius]0$/.test(inner)) {
      const t = inner[1];
      if (openTags.length > 0) return openTags.pop()!;
    }

    const cMatch = inner.match(/^\\c&H([0-9A-Fa-f]{6,8})&?$/);
    if (cMatch) {
      const hex = cMatch[1];
      const prefix = hex.length === 8 ? '' : '00';
      const css = assColorToCss(`&H${prefix}${hex}`);
      openTags.push('</span>');
      return `<span style="color:${css}">`;
    }

    return '';
  });

  result += closeAll();
  result = result.replace(/\n/g, '<br>');
  return result;
}

function msToStr(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
}

function msToStrShort(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function buildTextShadows(style: StyleDefinition | undefined): string[] {
  const shadows: string[] = [];
  const oc = style?.outlineColor ? assColorToCss(style.outlineColor) : '#000000';
  const ow = style?.outline ?? 0;
  const sc = style?.backColor ? assColorToCss(style.backColor) : '#000000';
  const sd = style?.shadow ?? 0;

  if (ow > 0) {
    for (let dx = -ow; dx <= ow; dx++) {
      for (let dy = -ow; dy <= ow; dy++) {
        if (dx === 0 && dy === 0) continue;
        if (Math.abs(dx) + Math.abs(dy) > ow * 1.5) continue;
        shadows.push(`${dx}px ${dy}px 0 ${oc}`);
      }
    }
  }
  if (sd > 0) {
    shadows.push(`${sd}px ${sd}px ${sd}px ${sc}`);
  }
  return shadows;
}

export function PreviewPanel({ universal, selectedIndex }: Props) {
  const cue = selectedIndex >= 0 && selectedIndex < universal.cues.length
    ? universal.cues[selectedIndex]
    : null;

  const style = cue?.style
    ? universal.styles.find((s) => s.name === cue.style)
    : undefined;

  const html = cue ? assTextToHtml(cue.text) : '';
  const shadows = buildTextShadows(style);

  return (
    <div class="preview-panel">
      <div class="preview-header">
        <h3>Preview</h3>
        <div class="preview-header-right">
          {cue && (
            <>
              <span class="preview-badge">{style?.name || 'Default'}</span>
              <span class="preview-time-label">
                {msToStrShort(cue.startTime)} &rarr; {msToStrShort(cue.endTime)}
                {' '}({(cue.duration / 1000).toFixed(1)}s)
              </span>
            </>
          )}
        </div>
      </div>

      <div class="preview-screen">
        {cue ? (
          <div
            class="preview-cue-overlay"
            style={{
              fontFamily: style ? `${style.fontName || 'Arial'}, sans-serif` : 'Arial, sans-serif',
              fontSize: style?.fontSize ? `${Math.min(style.fontSize, 36)}px` : '24px',
              color: style?.primaryColor ? assColorToCss(style.primaryColor) : '#FFFFFF',
              fontWeight: style?.bold ? '700' : '400',
              fontStyle: style?.italic ? 'italic' : 'normal',
              textDecoration: style?.underline ? 'underline' : 'none',
              textShadow: shadows.length > 0 ? shadows.join(', ') : '0 1px 4px rgba(0,0,0,0.9)',
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div class="preview-empty">Select a cue to preview</div>
        )}
      </div>

      {cue && (
        <div class="previous-next">
          {selectedIndex > 0 && (
            <span class="pn-badge">Prev: {universal.cues[selectedIndex - 1].text.slice(0, 30)}</span>
          )}
          {selectedIndex < universal.cues.length - 1 && (
            <span class="pn-badge">Next: {universal.cues[selectedIndex + 1].text.slice(0, 30)}</span>
          )}
        </div>
      )}
    </div>
  );
}
