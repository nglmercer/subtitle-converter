import { describe, it, expect } from 'bun:test'
import { assToUniversal } from '../src/formats/ass.ts'

const ass = `[Script Info]
Title: Demo Parsing
ScriptType: v4.00+
PlayResX: 640
PlayResY: 360

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: CenterGreen,Arial,24,&H0000FF00,&H000000FF,&HFF000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,5,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:03.00,0:00:04.00,CenterGreen,,0,0,10,,{\pos(320,180)}Segunda línea {\c&H00FF00&}verde`

describe('assToUniversal() parseo de overrides', () => {
  it('preserva overrides en content y limpia text', () => {
    const universal = assToUniversal(ass)
    const cue = universal.cues[0]
    expect(cue.style).toBe('CenterGreen')
    expect(cue.text.includes('{')).toBe(false)
    expect(cue.text.includes('Segunda línea')).toBe(true)
    expect(cue.text.includes('verde')).toBe(true)
    expect(cue.content.includes('\pos(320,180)')).toBe(true)
    expect(cue.content.includes('\c&H00FF00&')).toBe(true)
  })

  it('conserva metadata y estilos necesarios para posicionamiento', () => {
    const universal = assToUniversal(ass)
    expect(universal.styles[0].name).toBe('CenterGreen')
    expect(typeof universal.styles[0].alignment).toBe('number')
    expect(universal.metadata.formatSpecific?.ass?.playResX).toBe(640)
    expect(universal.metadata.formatSpecific?.ass?.playResY).toBe(360)
  })
})
