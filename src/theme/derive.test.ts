import { describe, expect, it } from 'vitest'
import { contrastRatio, formatHex, oklchToRgb, parseHex, rgbToOklch } from './color'
import { deriveRole, MINIMUM_CONTRAST } from './derive'
import { buildTheme, referenceStatus, referenceSurfaces, statusRoles } from './tokens'

const PAPER = referenceSurfaces.paper

const ratioOf = (a: string, b: string): number =>
  contrastRatio(parseHex(a), parseHex(b))

describe('derived roles reach the contrast floor', () => {
  it.each(statusRoles)('%s, from the reference palette', (role) => {
    const { background, foreground } = deriveRole(referenceStatus[role], {
      surface: PAPER,
    })
    expect(ratioOf(foreground, background)).toBeGreaterThanOrEqual(MINIMUM_CONTRAST)
  })

  // The point of deriving rather than exposing every value is that a host who
  // repoints one variable cannot ship an unreadable pill. That claim is only
  // worth anything against colours nobody would choose on purpose.
  const hostile: Array<[string, string]> = [
    ['near-white', '#FEFEFE'],
    ['pure white', '#FFFFFF'],
    ['pure black', '#000000'],
    ['fully saturated yellow', '#FFFF00'],
    ['fully saturated cyan', '#00FFFF'],
    ['fully saturated magenta', '#FF00FF'],
    ['fully saturated red', '#FF0000'],
    ['fully saturated blue', '#0000FF'],
    ['very dark green', '#001A05'],
    ['mid grey', '#808080'],
    ['the surface colour itself', PAPER],
  ]

  it.each(hostile)('%s', (_name, dot) => {
    const { background, foreground } = deriveRole(dot, { surface: PAPER })
    expect(ratioOf(foreground, background)).toBeGreaterThanOrEqual(MINIMUM_CONTRAST)
  })

  // Hand-picked hostile values prove the cases we thought of. Sweeping the hue
  // circle at several chromas and lightnesses proves the ones we did not.
  it('holds across the hue circle at every chroma and lightness', () => {
    const failures: string[] = []
    for (let hue = 0; hue < 360; hue += 5) {
      for (const chroma of [0, 0.05, 0.12, 0.2, 0.32]) {
        for (const lightness of [0.15, 0.35, 0.55, 0.75, 0.95]) {
          const dot = hexFromOklch(lightness, chroma, hue)
          const { background, foreground } = deriveRole(dot, { surface: PAPER })
          const ratio = ratioOf(foreground, background)
          if (ratio < MINIMUM_CONTRAST) {
            failures.push(`${dot} (l=${lightness} c=${chroma} h=${hue}) → ${ratio.toFixed(2)}:1`)
          }
        }
      }
    }
    expect(failures).toEqual([])
  })

  it('holds when the surface itself is repointed', () => {
    for (const surface of ['#FFFFFF', '#F4F3EF', '#E8E4DA', '#CFCFCF']) {
      for (const role of statusRoles) {
        const { background, foreground } = deriveRole(referenceStatus[role], { surface })
        expect(ratioOf(foreground, background)).toBeGreaterThanOrEqual(MINIMUM_CONTRAST)
      }
    }
  })
})

describe('the derivation darkens no further than it has to', () => {
  it('leaves a role colour alone when it already passes', () => {
    // A very dark colour over a light surface already clears the floor, so the
    // foreground should be the colour itself rather than a needlessly black one.
    const dot = '#0A2E1B'
    const { foreground } = deriveRole(dot, { surface: PAPER })
    expect(foreground.toUpperCase()).toBe(dot)
  })

  it('preserves hue while darkening', () => {
    const dot = '#0E9E6B'
    const { foreground } = deriveRole(dot, { surface: PAPER })
    const before = rgbToOklch(parseHex(dot))
    const after = rgbToOklch(parseHex(foreground))
    expect(Math.abs(after.h - before.h)).toBeLessThan(2)
    expect(after.l).toBeLessThan(before.l)
  })

  it('is not a fixed step — different hues need different amounts of darkening', () => {
    const drop = (dot: string): number => {
      const { foreground } = deriveRole(dot, { surface: PAPER })
      return rgbToOklch(parseHex(dot)).l - rgbToOklch(parseHex(foreground)).l
    }
    // Yellow carries far more luminance than blue at the same lightness, so a
    // rule that darkened both by the same amount would fail one of them.
    expect(drop('#FFFF00')).toBeGreaterThan(drop('#0000FF'))
  })
})

describe('the one-way direction', () => {
  it('derives background and border from the role colour, not the reverse', () => {
    const { dot, background, border } = deriveRole('#0E9E6B', { surface: PAPER })
    // Both derived values sit between the role colour and the surface, with the
    // border the stronger of the two.
    expect(ratioOf(background, PAPER)).toBeLessThan(ratioOf(border, PAPER))
    expect(ratioOf(dot, PAPER)).toBeGreaterThan(ratioOf(border, PAPER))
  })
})

describe('the explicit override path', () => {
  it('takes a supplied pair verbatim', () => {
    const { background, foreground } = deriveRole('#0E9E6B', {
      surface: PAPER,
      override: { background: '#123456', foreground: '#FEDCBA' },
    })
    expect(background.toUpperCase()).toBe('#123456')
    expect(foreground.toUpperCase()).toBe('#FEDCBA')
  })

  it('overriding the background alone still derives a legible foreground for it', () => {
    const { background, foreground } = deriveRole('#0E9E6B', {
      surface: PAPER,
      override: { background: '#FFF9C4' },
    })
    expect(background.toUpperCase()).toBe('#FFF9C4')
    expect(ratioOf(foreground, background)).toBeGreaterThanOrEqual(MINIMUM_CONTRAST)
  })

  it('skips derivation for the overridden role only', () => {
    const theme = buildTheme({ overrides: { late: { foreground: '#111111' } } })
    expect(theme.status.late.foreground.toUpperCase()).toBe('#111111')
    expect(theme.status.ontrack.foreground.toUpperCase()).not.toBe('#111111')
    expect(
      ratioOf(theme.status.ontrack.foreground, theme.status.ontrack.background),
    ).toBeGreaterThanOrEqual(MINIMUM_CONTRAST)
  })

  it('an override that is itself unreadable is the hosts own choice, and is left alone', () => {
    // Stated as a test because it is a deliberate boundary: an explicit pair is
    // taken verbatim. Deriving is what carries the guarantee.
    const { background, foreground } = deriveRole('#0E9E6B', {
      surface: PAPER,
      override: { background: '#FFFFFF', foreground: '#FEFEFE' },
    })
    expect(ratioOf(foreground, background)).toBeLessThan(MINIMUM_CONTRAST)
  })
})

describe('failure is loud', () => {
  it('refuses an impossible request rather than returning something unreadable', () => {
    expect(() =>
      deriveRole('#0E9E6B', { surface: '#000000', minimumContrast: 21 }),
    ).toThrow(/cannot reach/)
  })

  it('rejects a malformed colour', () => {
    expect(() => deriveRole('not-a-colour', { surface: PAPER })).toThrow(/hex colour/)
  })
})

/** Build a hex colour from OKLCh so the sweep can walk the space directly. */
function hexFromOklch(l: number, c: number, h: number): string {
  return formatHex(oklchToRgb({ l, c, h }))
}
