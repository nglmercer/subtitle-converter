import { describe, it, expect } from 'bun:test'
import { assToUniversal } from '../src/formats/ass.ts'
import { renderHtml } from '../src/index.ts'

const ass = `[Script Info]
Title: Demo Attrs
ScriptType: v4.00+
PlayResX: 640
PlayResY: 360

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: BottomBlue,Arial,22,&H00FF0000,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,30,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:05.00,0:00:06.00,BottomBlue,,0,0,30,,{\pos(320,320)}Tercera línea {\c&H0000FF&}roja`

describe('renderHtml() con processAssOverrides', () => {
  it('emite data-pos-x, data-pos-y y data-override-color y limpia el texto', () => {
    const universal = assToUniversal(ass)
    const html = renderHtml(universal, { includeMetadata: true, containerClass: 'subs', cueClass: 'cue', usePlainText: false, processAssOverrides: true })
    expect(/data-pos-x="\d+"/.test(html)).toBe(true)
    expect(/data-pos-y="\d+"/.test(html)).toBe(true)
    expect(/data-override-color="(?:&|&amp;)H[0-9A-Fa-f]{6,8}"/.test(html)).toBe(true)
    expect(html.includes('{')).toBe(false)
  })
})