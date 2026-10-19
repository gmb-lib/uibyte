import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Chip from './Chip.vue'

describe('Chip', () => {
  it('renders its slot content in a span', () => {
    const w = mount(Chip, { slots: { default: 'Office' } })
    expect(w.element.tagName).toBe('SPAN')
    expect(w.text()).toBe('Office')
  })

  it('draws a hairline pill', () => {
    const w = mount(Chip, { slots: { default: 'x' } })
    expect(w.classes()).toEqual(expect.arrayContaining(['rounded-pill', 'border', 'border-line', 'text-ink']))
  })

  it('fills with the band by default and with the surface on request', () => {
    const band = mount(Chip, { slots: { default: 'x' } })
    expect(band.classes()).toContain('bg-band')
    expect(band.classes()).not.toContain('bg-surface')
    const surface = mount(Chip, { props: { tone: 'surface' }, slots: { default: 'x' } })
    expect(surface.classes()).toContain('bg-surface')
    expect(surface.classes()).not.toContain('bg-band')
  })

  it('draws a dashed border only when given', () => {
    expect(mount(Chip, { slots: { default: 'x' } }).classes()).not.toContain('border-dashed')
    expect(mount(Chip, { props: { given: true }, slots: { default: 'x' } }).classes()).toContain('border-dashed')
  })

  it('draws a given border in the muted colour, never the hairline, so the dash can be seen', () => {
    const plain = mount(Chip, { slots: { default: 'x' } }).classes()
    expect(plain).toContain('border-line')
    expect(plain).not.toContain('border-muted')
    const given = mount(Chip, { props: { given: true }, slots: { default: 'x' } }).classes()
    expect(given).toContain('border-muted')
    expect(given).not.toContain('border-line')
  })

  it('sets the note as the title and says it to a reader, visually hidden', () => {
    const w = mount(Chip, { props: { given: true, note: 'Given by the role' }, slots: { default: 'Office' } })
    expect(w.attributes('title')).toBe('Given by the role')
    const hidden = w.get('.sr-only')
    expect(hidden.text()).toBe(', Given by the role')
    // After the content, so a reader hears the name first, and apart from it.
    expect(w.element.lastElementChild).toBe(hidden.element)
    expect(w.element.textContent).toBe('Office, Given by the role')
  })

  it('has no title and no hidden text without a note', () => {
    const w = mount(Chip, { props: { given: true }, slots: { default: 'Office' } })
    expect(w.attributes('title')).toBeUndefined()
    expect(w.find('.sr-only').exists()).toBe(false)
  })

  it('passes attributes and class through to the pill', () => {
    const w = mount(Chip, {
      attrs: { 'data-kind': 'x', class: 'ml-2' },
      slots: { default: 'x' },
    })
    expect(w.attributes('data-kind')).toBe('x')
    expect(w.classes()).toEqual(expect.arrayContaining(['ml-2', 'rounded-pill', 'bg-band']))
  })
})
