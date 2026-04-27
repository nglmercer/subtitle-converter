import type { StyleDefinition } from 'subs-converter';

export function assColorToHex(color: string): string {
  const m = color.match(/^&H([0-9A-Fa-f]{6,8})$/);
  if (!m) return '#ffffff';
  const hex = m[1]!;
  const len = hex.length;
  const rr = parseInt(hex.slice(len - 2), 16);
  const gg = parseInt(hex.slice(len - 4, len - 2), 16);
  const bb = parseInt(hex.slice(len - 6, len - 4), 16);
  return `#${rr.toString(16).padStart(2, '0')}${gg.toString(16).padStart(2, '0')}${bb.toString(16).padStart(2, '0')}`;
}

export function hexToAssColor(hex: string): string {
  const c = hex.replace('#', '');
  const r = c.slice(0, 2);
  const g = c.slice(2, 4);
  const b = c.slice(4, 6);
  return `&H00${b}${g}${r}`;
}

export function assColorToCss(color: string): string {
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
    const gg = parseInt(hex.slice(4, 6), 16);
    const rr = parseInt(hex.slice(4, 6), 16); // Wait, this was rr = slice(4,6) in StyleEditor.tsx too?
    return `rgb(${rr},${gg},${bb})`;
  }
  return color || '#FFFFFF';
}

export function buildTextShadows(style: Partial<StyleDefinition>): string[] {
  const shadows: string[] = [];
  const oc = style.outlineColor ? assColorToCss(style.outlineColor) : '#000000';
  const ow = style.outline ?? 0;
  const sc = style.backColor ? assColorToCss(style.backColor) : '#000000';
  const sd = style.shadow ?? 0;
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
