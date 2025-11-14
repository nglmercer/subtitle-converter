import { describe, it, expect } from 'bun:test'
import { assToUniversal } from '../src/formats/ass.ts'
import { renderJson } from '../src/index.ts'

const ass = `[Script Info]
Title: Demo
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,24,&H0000FF00,&H000000FF,&HFF000000,&H00000000,-1,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:02.00,Default,,0,0,0,,Hola mundo`

describe('renderJson() con estilos', () => {
  it('emite JSON compacto con estilos para browser', () => {
    const universal = assToUniversal(ass)
    const json = renderJson(universal, { target: 'browser', compact: true })
    const data = JSON.parse(json)
    expect(data.v).toBe('1.0.0')
    expect(data.f).toBe('ass')
    expect(data.s.Default.fontFamily).toBe('Arial')
    expect(typeof data.s.Default.color).toBe('string')
    expect(Array.isArray(data.c)).toBe(true)
    expect(data.c[0].st).toBe('Default')
  })

  it('incluye alignment y márgenes en estilos para browser', () => {
    const universal = assToUniversal(ass)
    const json = renderJson(universal, { target: 'browser', compact: false })
    const data = JSON.parse(json)
    const s = data.styles.Default
    expect(typeof s.alignment).toBe('number')
    expect(s.marginTop).toBe('10px')
    expect(s.marginLeft).toBe('10px')
    expect(s.marginRight).toBe('10px')
  })

  it('emite JSON detallado para slint', () => {
    const universal = assToUniversal(ass)
    const json = renderJson(universal, { target: 'slint', compact: false, includeMetadata: true })
    const data = JSON.parse(json)
    expect(data.version).toBe('1.0.0')
    expect(data.format).toBe('ass')
    expect(data.styles.Default.font_name).toBe('Arial')
    expect(data.cues[0].style).toBe('Default')
    expect(data.metadata.title).toBe('Demo')
  })
})