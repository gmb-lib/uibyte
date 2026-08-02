import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusPill from './StatusPill.vue'
import { statusRoles } from '../theme/tokens'

describe('StatusPill', () => {
  // The release gate: a status is never conveyed by colour alone. Both the text
  // and a glyph have to be there for every role, with no way to switch them off.
  it.each(statusRoles)('renders %s with a label and an icon, not colour alone', (status) => {
    const w = mount(StatusPill, { props: { status, label: `${status} label` } })
    expect(w.text()).toBe(`${status} label`)
    expect(w.find('svg').exists()).toBe(true)
  })

  it('hides the icon from assistive technology, since the label already says it', () => {
    const w = mount(StatusPill, { props: { status: 'late', label: 'Overdue' } })
    expect(w.get('svg').attributes('aria-hidden')).toBe('true')
  })

  it('draws a different glyph for each role', () => {
    const glyphs = statusRoles.map(
      (status) => mount(StatusPill, { props: { status, label: 'x' } }).get('svg').html(),
    )
    expect(new Set(glyphs).size).toBe(statusRoles.length)
  })

  // Two roles deliberately share a hue and are told apart by their glyph, so
  // that pair is worth its own assertion rather than relying on the sweep above.
  it('separates the two roles that share a hue', () => {
    const blocked = mount(StatusPill, { props: { status: 'blocked', label: 'x' } }).get('svg').html()
    const approaching = mount(StatusPill, { props: { status: 'approaching', label: 'x' } })
      .get('svg')
      .html()
    expect(blocked).not.toBe(approaching)
  })

  it('paints from the role pair so a repointed role carries the pill with it', () => {
    const w = mount(StatusPill, { props: { status: 'ontrack', label: 'Done' } })
    expect(w.classes()).toContain('bg-status-ontrack-bg')
    expect(w.classes()).toContain('text-status-ontrack-fg')
  })

  it('has a compact size that keeps the icon and the label', () => {
    const w = mount(StatusPill, { props: { status: 'idle', label: 'Draft', size: 'sm' } })
    expect(w.text()).toBe('Draft')
    expect(w.find('svg').exists()).toBe(true)
  })
})
