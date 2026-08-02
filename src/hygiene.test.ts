// @vitest-environment node
// Reads the source tree off disk, so it runs in node.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// This package is shared by unrelated applications, and it stays shareable only
// while it knows nothing about any of them. Both rules below were previously
// upheld by remembering to grep before a commit, which is not a rule — it is a
// habit with a good track record. They are checked here so they hold for anyone,
// including someone who has never read a word of our conventions.

const SRC = fileURLToPath(new URL('.', import.meta.url))
const SELF = 'hygiene.test.ts'

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      sourceFiles(path, out)
    } else if (/\.(ts|vue|css)$/.test(entry) && entry !== SELF) {
      out.push(path)
    }
  }
  return out
}

const files = sourceFiles(SRC)

/** Every line of every source file, tagged with where it came from. */
const lines = files.flatMap((path) =>
  readFileSync(path, 'utf8')
    .split('\n')
    .map((text, i) => ({ where: `${path.slice(SRC.length)}:${i + 1}`, text })),
)

const offenders = (pattern: RegExp): string[] =>
  lines.filter((l) => pattern.test(l.text)).map((l) => `${l.where} — ${l.text.trim()}`)

describe('source hygiene', () => {
  it('scans a source tree that is actually there', () => {
    // Guards the guard: a broken walk would make every check below pass silently.
    expect(files.length).toBeGreaterThan(10)
  })

  // A consumer's noun in a name, prop, class or comment means the component was
  // never generic — it is a product's component living in the wrong repo.
  // Word boundaries matter: `DialogPortal` is a dialog primitive, not a portal,
  // and `design` is not `sign`.
  it('names no consumer of this package and none of their vocabulary', () => {
    const domain =
      /\b(signing|signature|signer|envelope|weld|estimate|invoice|tenant|portal|projects?)\b/i
    expect(offenders(domain)).toEqual([])
  })

  // The link between code and the decision behind it belongs in the commit
  // message, never in a comment a stranger cannot resolve.
  it('refers to no document, decision or rule that a reader cannot see', () => {
    const internal = /\b(ADR[- ]?\d|CONVENTIONS|WORKSPACE\.md|INDEX\.md)\b|§|\b(feat|task|spec|bug):/i
    expect(offenders(internal)).toEqual([])
  })
})
