import { describe, it, expect } from 'bun:test'
import { convert, validate, parseToUniversal } from '../src/index.ts'

const srt = `1
00:00:01,000 --> 00:00:02,000
Hola mundo

2
00:00:03,000 --> 00:00:04,000
Adiós`

describe('convert() y flujo universal/JSON', () => {
  it('convierte SRT a VTT válido', () => {
    const vtt = convert(srt, 'srt', 'vtt')
    const res = validate(vtt, 'vtt')
    expect(res.isValid).toBe(true)
    expect(vtt.startsWith('WEBVTT')).toBe(true)
  })

  it('produce universal consistente', () => {
    const universal = parseToUniversal(srt, 'srt')
    expect(universal.cues.length).toBe(2)
    expect(universal.cues[0]!.text).toBe('Hola mundo')
  })
})