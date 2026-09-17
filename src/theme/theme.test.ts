// @vitest-environment node
// Reads a file off disk and needs no DOM. It runs in node so that the check is
// against the bytes that ship, not against anything a build step rewrote.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { contrastRatio, parseHex } from './color'
import { CONSOLE_RING_CONTRAST, MINIMUM_CONTRAST } from './derive'
import {
  buildTheme,
  statusRoles,
  surfaceRoles,
  themeCss,
  typeRoles,
} from './tokens'

const stylesheet = readFileSync(
  fileURLToPath(new URL('./theme.css', import.meta.url)),
  'utf8',
)

describe('the shipped stylesheet', () => {
  // The stylesheet is generated. If it can drift from the rule that produced
  // it, the guarantee is a comment rather than a property of the system.
  it('matches what the derivation produces right now', () => {
    expect(stylesheet).toContain(themeCss())
  })

  it('declares every role', () => {
    for (const role of surfaceRoles) {
      expect(stylesheet).toContain(`--color-${role}:`)
    }
    for (const role of statusRoles) {
      expect(stylesheet).toContain(`--color-status-${role}:`)
      expect(stylesheet).toContain(`--color-status-${role}-bg:`)
      expect(stylesheet).toContain(`--color-status-${role}-fg:`)
      expect(stylesheet).toContain(`--color-status-${role}-border:`)
      expect(stylesheet).toContain(`--color-status-${role}-solid-bg:`)
      expect(stylesheet).toContain(`--color-status-${role}-solid-fg:`)
    }
    for (const role of typeRoles) {
      expect(stylesheet).toContain(`--font-${role}:`)
    }
    expect(stylesheet).toContain('--color-accent:')
    expect(stylesheet).toContain('--color-accent-deep:')
    expect(stylesheet).toContain('--color-focus:')
    expect(stylesheet).toContain('--color-console-focus:')
  })

  it('names roles, never colours', () => {
    // The reason this package ships role names at all is that a colour name
    // means two different things in two different applications. A token named
    // for its hue is the failure the whole layer exists to prevent, so it is
    // checked rather than trusted. (Consumer vocabulary is covered repo-wide by
    // the source-hygiene suite, so it is not re-checked here.)
    const declarations = stylesheet.match(/--[a-z0-9-]+(?=:)/g) ?? []
    const hues = /green|red|amber|yellow|blue|grey|gray|orange|purple|teal/
    expect(declarations.filter((name) => hues.test(name))).toEqual([])
  })

  it('reaches the contrast floor as published, not merely as computed', () => {
    // Parsing the file back means a hand edit to the stylesheet is caught even
    // if it somehow passed the drift check above.
    for (const role of statusRoles) {
      const bg = valueOf(`--color-status-${role}-bg`)
      const fg = valueOf(`--color-status-${role}-fg`)
      expect(contrastRatio(parseHex(fg), parseHex(bg))).toBeGreaterThanOrEqual(
        MINIMUM_CONTRAST,
      )
      const solidBg = valueOf(`--color-status-${role}-solid-bg`)
      const solidFg = valueOf(`--color-status-${role}-solid-fg`)
      expect(
        contrastRatio(parseHex(solidFg), parseHex(solidBg)),
      ).toBeGreaterThanOrEqual(MINIMUM_CONTRAST)
    }
  })

  it('publishes an accent whose text form reads on the page', () => {
    const deep = valueOf('--color-accent-deep')
    const paper = valueOf('--color-paper')
    expect(contrastRatio(parseHex(deep), parseHex(paper))).toBeGreaterThanOrEqual(
      MINIMUM_CONTRAST,
    )
  })

  it('publishes a console focus ring far above the text floor', () => {
    const ring = valueOf('--color-console-focus')
    const console_ = valueOf('--color-console')
    expect(contrastRatio(parseHex(ring), parseHex(console_))).toBeGreaterThanOrEqual(
      CONSOLE_RING_CONTRAST,
    )
  })
})

describe('repointing a role', () => {
  it('moves the whole pill, not just the dot', () => {
    const repointed = buildTheme({ status: { ontrack: '#3B5BDB' } })
    const reference = buildTheme()

    expect(repointed.status.ontrack.dot).not.toBe(reference.status.ontrack.dot)
    expect(repointed.status.ontrack.background).not.toBe(
      reference.status.ontrack.background,
    )
    expect(repointed.status.ontrack.foreground).not.toBe(
      reference.status.ontrack.foreground,
    )
    expect(
      contrastRatio(
        parseHex(repointed.status.ontrack.foreground),
        parseHex(repointed.status.ontrack.background),
      ),
    ).toBeGreaterThanOrEqual(MINIMUM_CONTRAST)
  })

  it('leaves the roles it was not asked to change alone', () => {
    const repointed = buildTheme({ status: { ontrack: '#3B5BDB' } })
    const reference = buildTheme()
    expect(repointed.status.late).toEqual(reference.status.late)
  })

  it('re-derives against a repointed surface', () => {
    const onWhite = buildTheme({ surfaces: { paper: '#FFFFFF' } })
    const onPaper = buildTheme()
    expect(onWhite.status.ontrack.background).not.toBe(
      onPaper.status.ontrack.background,
    )
    for (const role of statusRoles) {
      expect(
        contrastRatio(
          parseHex(onWhite.status[role].foreground),
          parseHex(onWhite.status[role].background),
        ),
      ).toBeGreaterThanOrEqual(MINIMUM_CONTRAST)
    }
  })

  it('emits a stylesheet a host can drop in', () => {
    const css = themeCss(buildTheme({ status: { late: '#B4232E' } }))
    expect(css.startsWith('@theme {')).toBe(true)
    expect(css.trimEnd().endsWith('}')).toBe(true)
    expect(css).toContain('--color-status-late: #b4232e;')
  })

  it('moves the accent as a pair, with the text form still reading on the page', () => {
    const repointed = buildTheme({ accent: '#3B5BDB' })
    expect(repointed.accent.base).toBe('#3b5bdb')
    expect(repointed.accent.deep).not.toBe(buildTheme().accent.deep)
    expect(
      contrastRatio(parseHex(repointed.accent.deep), parseHex(repointed.surfaces.paper)),
    ).toBeGreaterThanOrEqual(MINIMUM_CONTRAST)
  })

  it('re-derives the console ring from a repointed focus colour', () => {
    const repointed = buildTheme({ focus: '#B4232E' })
    expect(repointed.consoleFocus).not.toBe(buildTheme().consoleFocus)
    expect(
      contrastRatio(parseHex(repointed.consoleFocus), parseHex(repointed.surfaces.console)),
    ).toBeGreaterThanOrEqual(CONSOLE_RING_CONTRAST)
  })

  it('keeps the console ring visible even on a repointed light console', () => {
    const repointed = buildTheme({ surfaces: { console: '#F0F0F0' } })
    expect(
      contrastRatio(parseHex(repointed.consoleFocus), parseHex('#F0F0F0')),
    ).toBeGreaterThanOrEqual(CONSOLE_RING_CONTRAST)
  })
})

function valueOf(property: string): string {
  const found = stylesheet.match(new RegExp(`${property}:\\s*([^;]+);`))
  if (!found) throw new Error(`${property} is not declared in the stylesheet`)
  return found[1].trim()
}
