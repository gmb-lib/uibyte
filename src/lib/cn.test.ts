import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('joins conditional class lists', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c')
  })

  it('resolves conflicting utilities in favour of the last one', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('flattens arrays and objects', () => {
    expect(cn(['a', { b: true, c: false }])).toBe('a b')
  })
})
