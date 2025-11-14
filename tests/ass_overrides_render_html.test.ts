import { describe, it, expect } from 'bun:test'
import { assToUniversal } from '../src/formats/ass.ts'
import { renderHtml } from '../src/index.ts'

const ass = `[Script Info]
Title: Demo Overrides
ScriptType: v4.00+
PlayResX: 640
PlayResY: 360

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: TopWhite,Arial,22,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,3,2,8,10,10,20,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:02.00,TopWhite,,0,0,20,,{\pos(320,40)}Primera línea {\c&HFF0000&}azul`

describe('renderHtml() con overrides ASS', () => {
  it('con usePlainText=false conserva overrides (visualización literal)', () => {
    const universal = assToUniversal(ass)
    const html = renderHtml(universal, { includeMetadata: true, containerClass: 'subs', cueClass: 'cue', usePlainText: false })
    expect(html.includes('{\pos(320,40)}')).toBe(true)
    expect(/\{[^}]*c&amp;H[0-9A-Fa-f]{6,8}&amp;[^}]*\}/.test(html)).toBe(true)
    expect(html.includes('data-format="ass"')).toBe(true)
  })

  it('con usePlainText=true limpia overrides del texto', () => {
    const universal = assToUniversal(ass)
    const html = renderHtml(universal, { includeMetadata: false, usePlainText: true })
    expect(html.includes('{\\pos(')).toBe(false)
    expect(html.includes('\\c&amp;H')).toBe(false)
    expect(html.includes('{')).toBe(false)
  })
})