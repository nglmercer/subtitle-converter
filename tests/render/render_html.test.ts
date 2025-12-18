import { describe, it, expect } from 'bun:test'
import { parseToUniversal, renderHtml } from '../../src/index.ts'

const vtt = `WEBVTT

00:00:01.000 --> 00:00:02.000
Hola <b>mundo</b>

00:00:03.000 --> 00:00:04.000
Adiós`

describe('renderHtml()', () => {
  it('genera contenedor y cues con atributos', () => {
    const universal = parseToUniversal(vtt, 'vtt')
    const html = renderHtml(universal, {
      includeMetadata: true,
      timeFormat: 'ms',
      containerClass: 'subs',
      cueClass: 'cue'
    })
    expect(html).toContain('class="subs"')
    expect(html).toContain('class="cue"')
    expect(html).toContain('data-format="vtt"')
    expect(html).toContain('data-start="1000"')
    expect(html).toContain('data-end="2000"')
  })

  it('elimina formato inline cuando usePlainText=true', () => {
    const universal = parseToUniversal(vtt, 'vtt')
    const html = renderHtml(universal, { usePlainText: true })
    expect(html).not.toContain('<b>')
    expect(html).toContain('Hola mundo')
  })
})
