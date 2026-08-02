import { describe, expect, it } from 'vitest'
import {
  contrastRatio,
  formatHex,
  mix,
  oklchToRgb,
  parseHex,
  relativeLuminance,
  rgbToOklch,
} from './color'

describe('parsing and formatting', () => {
  it('reads long and short hex, with or without the hash', () => {
    expect(parseHex('#FF8000')).toEqual({ r: 1, g: 128 / 255, b: 0 })
    expect(formatHex(parseHex('#f80'))).toBe('#ff8800')
    expect(formatHex(parseHex('16181B'))).toBe('#16181b')
  })

  it('rejects anything that is not a colour', () => {
    for (const bad of ['', '#', '#12', '#12345', 'rebeccapurple', '#gggggg']) {
      expect(() => parseHex(bad)).toThrow(/hex colour/)
    }
  })

  it('clamps out-of-range channels when formatting', () => {
    expect(formatHex({ r: -1, g: 0.5, b: 2 })).toBe('#0080ff')
  })
})

describe('contrast', () => {
  // The two anchors the WCAG definition fixes exactly.
  it('is 21:1 for black on white and 1:1 for a colour on itself', () => {
    expect(contrastRatio(parseHex('#000'), parseHex('#fff'))).toBeCloseTo(21, 5)
    expect(contrastRatio(parseHex('#0E9E6B'), parseHex('#0E9E6B'))).toBeCloseTo(1, 10)
  })

  it('does not depend on the order of its arguments', () => {
    const a = parseHex('#0E9E6B')
    const b = parseHex('#F4F3EF')
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 12)
  })

  it('rises as one colour gets darker', () => {
    const surface = parseHex('#FFFFFF')
    const ratios = ['#CCCCCC', '#999999', '#666666', '#333333'].map((hex) =>
      contrastRatio(parseHex(hex), surface),
    )
    expect(ratios).toEqual([...ratios].sort((x, y) => x - y))
  })

  it('orders luminance the way the eye does — yellow above blue', () => {
    expect(relativeLuminance(parseHex('#FFFF00'))).toBeGreaterThan(
      relativeLuminance(parseHex('#0000FF')),
    )
  })
})

describe('OKLCh conversion', () => {
  it('round-trips every channel of a spread of colours', () => {
    for (const hex of ['#16181B', '#F4F3EF', '#0E9E6B', '#D2524D', '#9AA0A6', '#FFFFFF', '#000000']) {
      expect(formatHex(oklchToRgb(rgbToOklch(parseHex(hex))))).toBe(hex.toLowerCase())
    }
  })

  it('reports neutral colours as having no chroma', () => {
    expect(rgbToOklch(parseHex('#808080')).c).toBeLessThan(0.001)
  })

  it('maps an out-of-gamut request back in by dropping chroma, not by clipping', () => {
    // Chroma 0.4 at this lightness is far outside sRGB. The result must stay on
    // the same hue rather than clipping a channel and shifting colour.
    const requested = { l: 0.5, c: 0.4, h: 150 }
    const mapped = rgbToOklch(oklchToRgb(requested))
    expect(mapped.c).toBeLessThan(requested.c)
    expect(Math.abs(mapped.h - requested.h)).toBeLessThan(2)
    expect(mapped.l).toBeCloseTo(requested.l, 2)
  })
})

describe('mixing', () => {
  it('returns each end of the range exactly', () => {
    const color = parseHex('#0E9E6B')
    const base = parseHex('#F4F3EF')
    expect(formatHex(mix(color, base, 1))).toBe('#0e9e6b')
    expect(formatHex(mix(color, base, 0))).toBe('#f4f3ef')
  })

  it('keeps a small amount of a saturated colour close to the surface', () => {
    const tint = mix(parseHex('#0E9E6B'), parseHex('#F4F3EF'), 0.12)
    expect(contrastRatio(tint, parseHex('#F4F3EF'))).toBeLessThan(1.3)
  })

  it('is monotonic — more of the colour moves further from the surface', () => {
    const surface = parseHex('#F4F3EF')
    const distances = [0.12, 0.28, 0.6, 1].map((amount) =>
      contrastRatio(mix(parseHex('#D2524D'), surface, amount), surface),
    )
    expect(distances).toEqual([...distances].sort((x, y) => x - y))
  })
})
