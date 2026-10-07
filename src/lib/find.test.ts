import { describe, expect, it } from 'vitest'
import { findMatches, foldForFind } from './find'

describe('find', () => {
  it('finds a name typed without the marks over its letters, in any case', () => {
    expect(findMatches('krumins', 'Valdis Krūmiņš')).toBe(true)
    expect(findMatches('ĻAUDIS', 'ļaudis')).toBe(true)
    expect(foldForFind('  Ēriks ')).toBe('eriks')
  })

  it('finds anywhere in the name, not only at its start', () => {
    expect(findMatches('zol', 'Anna Ozola')).toBe(true)
  })

  it('finds in any of the texts it is given', () => {
    expect(findMatches('ex-12', 'Excavator', 'EX-12')).toBe(true)
    expect(findMatches('ex-12', 'Excavator', undefined)).toBe(false)
  })

  it('matches everything when nothing is typed', () => {
    expect(findMatches('   ', 'anything')).toBe(true)
  })

  it('says no when the typed text is not there', () => {
    expect(findMatches('peteris', 'Anna Ozola')).toBe(false)
  })
})
