import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CountStrip from './CountStrip.vue'
import type { CountItem } from './types'
import { statusRoles } from '../theme/tokens'

const items: CountItem[] = [
  { key: 'all', label: 'All', count: '18' },
  { key: 'manager', label: 'Manager', count: '2' },
  { key: 'attention', label: 'Needs attention', count: '3', status: 'late' },
]

const strip = (modelValue = 'all') => mount(CountStrip, { props: { items, modelValue, label: 'Show' } })

describe('CountStrip', () => {
  it('is a named group of toggles, exactly one of them pressed', () => {
    const w = strip('manager')
    expect(w.get('[role="group"]').attributes('aria-label')).toBe('Show')
    const pressed = w.findAll('button').map((b) => b.attributes('aria-pressed'))
    expect(pressed).toEqual(['false', 'true', 'false'])
  })

  it('draws each count after its words, as the host formatted it', () => {
    const b = strip().findAll('button')[0]
    expect(b.text()).toBe('All 18')
    expect(b.get('b').classes()).toContain('font-mono')
  })

  it('asks for a filter when one is chosen, and says nothing when the chosen one is chosen again', async () => {
    const w = strip('all')
    await w.findAll('button')[0].trigger('click')
    await w.findAll('button')[2].trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['attention']])
  })

  it('draws a status dot beside the words, which a reader does not hear', () => {
    const dot = strip().findAll('button')[2].get('i')
    expect(dot.attributes('aria-hidden')).toBe('true')
    expect(dot.classes()).toContain('bg-status-late')
    expect(strip().findAll('button')[0].find('i').exists()).toBe(false)
  })

  it('wears the chosen look on the chosen one only', () => {
    const buttons = strip('manager').findAll('button')
    expect(buttons[1].classes()).toContain('bg-ink')
    expect(buttons[0].classes()).not.toContain('bg-ink')
  })

  it('wraps rather than scrolling sideways', () => {
    expect(strip().get('[role="group"]').classes()).toContain('flex-wrap')
  })

  it('makes room for more filters after the counts', () => {
    const w = mount(CountStrip, { props: { items, modelValue: 'all', label: 'Show' }, slots: { more: '<button class="more">More filters</button>' } })
    const last = w.get('[role="group"]').element.lastElementChild
    expect(last?.className).toBe('more')
  })

  it('shows a visible focus ring', () => {
    expect(strip().get('button').classes()).toContain('focus-visible:outline-focus')
  })

  it.each(statusRoles)('draws the %s dot in its own colour', (status) => {
    const w = mount(CountStrip, { props: { items: [{ key: 'a', label: 'A', status }], modelValue: 'a', label: 'Show' } })
    expect(w.get('i').classes()).toContain(`bg-status-${status}`)
  })
})
