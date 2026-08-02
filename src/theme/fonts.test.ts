// @vitest-environment node
// Checks files on disk, so it runs in node.
import { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { referenceType } from './tokens'

const read = (relative: string): string =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

const stylesheet = read('./fonts.css')

const faces = [
  { family: 'Hanken Grotesk', file: 'HankenGrotesk-Variable.woff2', licence: 'HankenGrotesk-OFL.txt' },
  { family: 'JetBrains Mono', file: 'JetBrainsMono-Variable.woff2', licence: 'JetBrainsMono-OFL.txt' },
]

describe('the bundled typefaces', () => {
  it.each(faces)('$family is declared and its file ships', ({ family, file }) => {
    expect(stylesheet).toContain(`font-family: "${family}"`)
    expect(stylesheet).toContain(`./fonts/${file}`)

    const path = fileURLToPath(new URL(`./fonts/${file}`, import.meta.url))
    expect(statSync(path).size).toBeGreaterThan(1024)
  })

  // Redistributing these fonts is only permitted with their licence alongside,
  // so a missing licence file is a licensing defect and fails the build.
  it.each(faces)('$family carries its licence', ({ licence }) => {
    const text = read(`./fonts/${licence}`)
    expect(text).toContain('SIL OPEN FONT LICENSE Version 1.1')
    expect(text).toMatch(/^Copyright \d{4}/)
  })

  it('names the same families the type roles ask for', () => {
    for (const { family } of faces) {
      expect(Object.values(referenceType).join(' ')).toContain(`"${family}"`)
    }
  })

  it('keeps the faces out of the token stylesheet', () => {
    // Importing the tokens must not drag two font files in with them — a host
    // already serving these should not ship a second copy.
    expect(read('./theme.css')).not.toContain('@font-face')
  })
})
