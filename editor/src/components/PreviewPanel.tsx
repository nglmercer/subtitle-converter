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

interface InlineState {
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeout: boolean;
  fontName: string;
  fontSize: number;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function isDrawingPath(text: string): boolean {
  const t = text.trim();
  if (!t || t.length < 15) return false;
  return /^[mlb\s\d\.\-,]+$/.test(t);
}

function assContentToHtml(content: string): string {
  if (!content) return '';

  const state: InlineState = {
    color: '', bold: false, italic: false, underline: false, strikeout: false, fontName: '', fontSize: 0,
  };
  const stack: string[] = [];
  let result = '';

  function flushSpan(): string {
    const parts: string[] = [];
    if (state.color) parts.push(`color:${state.color}`);
    if (state.bold) parts.push('font-weight:700');
    if (state.italic) parts.push('font-style:italic');
    const deco: string[] = [];
    if (state.underline) deco.push('underline');
    if (state.strikeout) deco.push('line-through');
    if (deco.length) parts.push(`text-decoration:${deco.join(' ')}`);
    if (state.fontName) parts.push(`font-family:'${state.fontName}',sans-serif`);
    if (state.fontSize) parts.push(`font-size:${Math.min(state.fontSize, 72)}px`);
    if (parts.length === 0) return '';
    stack.push('</span>');
    return `<span style="${parts.join(';')}">`;
  }

  function closeAll(): string {
    const out: string[] = [];
    while (stack.length) out.push(stack.pop()!);
    return out.join('');
  }

  function parseTags(inner: string): void {
    if (!inner.startsWith('\\')) return;
    let pos = 0;
    while (pos < inner.length) {
      const bs = inner.indexOf('\\', pos);
      if (bs < 0) break;
      let end = bs + 1;
      while (end < inner.length) {
        const ch = inner[end];
        if (ch === '\\') break;
        if (ch === '(') { const c = inner.indexOf(')', end); end = c >= 0 ? c + 1 : inner.length; }
        else if (ch === '&') { const c = inner.indexOf('&', end + 1); end = c >= 0 ? c + 1 : inner.length; }
        else end++;
      }
      const raw = inner.slice(bs, end);
      pos = end;
      const name = raw.match(/\\([a-z0-9]+)/i)?.[1]?.toLowerCase();
      if (!name) continue;
      const arg = raw.slice(raw.indexOf(name) + name.length);

      switch (name) {
        case 'c':
        case '1c': {
          const m = arg.match(/&H([0-9A-Fa-f]{6,8})/);
          if (m) {
            const hex = m[1];
            state.color = assColorToCss('&H' + (hex.length === 6 ? '00' : '') + hex);
          } else {
            state.color = '';
          }
          break;
        }
        case 'b': state.bold = arg !== '0'; break;
        case 'i': state.italic = arg !== '0'; break;
        case 'u': state.underline = arg !== '0'; break;
        case 's': state.strikeout = arg !== '0'; break;
        case 'fn': state.fontName = arg; break;
        case 'fs': state.fontSize = parseInt(arg, 10) || 0; break;
      }
    }
  }

  const segments = content.split(/(\{[^}]*\})/);

  for (const seg of segments) {
    if (seg.startsWith('{') && seg.endsWith('}')) {
      parseTags(seg.slice(1, -1));
    } else {
      let text = seg.replace(/\\N/g, '\n').replace(/\\n/g, ' ').replace(/\\h/g, '\u00A0');
      if (!text || isDrawingPath(text)) continue;
      result += flushSpan();
      result += escapeHtml(text);
    }
  }

  result += closeAll();
  result = result.replace(/\n/g, '<br>');
  return result || '(empty)';
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
  if (sd > 0) shadows.push(`${sd}px ${sd}px ${sd}px ${sc}`);
  return shadows;
}

export function PreviewPanel({ universal, selectedIndex }: Props) {
  const cue = selectedIndex >= 0 && selectedIndex < universal.cues.length
    ? universal.cues[selectedIndex]
    : null;

  const style = cue?.style
    ? universal.styles.find((s) => s.name === cue.style)
    : undefined;

  const content = cue?.content || cue?.text || '';
  const html = assContentToHtml(content);
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
