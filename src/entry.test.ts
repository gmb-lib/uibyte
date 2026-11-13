import { describe, expect, it } from 'vitest'
import { ChoiceRows, HoldNotice, ScopeMenu } from './index'
import type { ChoiceRow, ScopeOption } from './index'

describe('the package entry', () => {
  it('exports the list of choices, the line that names a place and the notice that cannot be closed', () => {
    for (const part of [ChoiceRows, ScopeMenu, HoldNotice]) expect(part).toBeTruthy()
    expect(ChoiceRows.__name).toBe('ChoiceRows')
    expect(ScopeMenu.__name).toBe('ScopeMenu')
    expect(HoldNotice.__name).toBe('HoldNotice')
  })

  // A type has no value to look at; this fails the type check, which is part of the gate, when either goes.
  it('exports the types of a row and of a place', () => {
    const row: ChoiceRow = { key: 'a', label: 'A' }
    const option: ScopeOption = { key: 'a', label: 'A' }
    expect([row.key, option.key]).toEqual(['a', 'a'])
  })
})
