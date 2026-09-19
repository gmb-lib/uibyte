import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import IconPicker from './IconPicker.vue'
import type { IconPickerOption } from './types'

const options: IconPickerOption[] = [
  { name: 'wrench', label: 'Spanner' },
  { name: 'flame', label: 'Flame' },
  { name: 'box', label: 'Box' },
]

const mountPicker = (props: Record<string, unknown> = {}) =>
  mount(IconPicker, {
    props: { modelValue: '', options, label: 'Mark', ...props },
    attachTo: document.body,
  })

describe('IconPicker', () => {
  it('offers one cell per glyph', () => {
    expect(mountPicker().findAll('[role="radio"]')).toHaveLength(3)
  })

  it('is one set of mutually exclusive choices, and says so', () => {
    const w = mountPicker({ modelValue: 'flame' })
    expect(w.get('[role="radiogroup"]').attributes('aria-label')).toBe('Mark')
    const checked = w.findAll('[role="radio"]').map((c) => c.attributes('aria-checked'))
    expect(checked).toEqual(['false', 'true', 'false'])
  })

  it('names each cell by the word the host gave it, not by the glyph name', () => {
    const cells = mountPicker().findAll('[role="radio"]')
    expect(cells[0]?.attributes('aria-label')).toBe('Spanner')
  })

  it('reports the glyph that was chosen', async () => {
    const w = mountPicker()
    await w.findAll('[role="radio"]')[2]?.trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['box'])
  })

  it('says nothing when the chosen glyph is chosen again', async () => {
    const w = mountPicker({ modelValue: 'box' })
    await w.findAll('[role="radio"]')[2]?.trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  // The grid is ONE stop in the page order. Twenty-odd cells each taking their
  // own would make the keyboard walk the whole set to reach what comes after.
  it('takes a single tab stop, on the chosen glyph', () => {
    const stops = mountPicker({ modelValue: 'flame' })
      .findAll('[role="radio"]')
      .map((c) => c.attributes('tabindex'))
    expect(stops).toEqual(['-1', '0', '-1'])
  })

  it('puts the stop on the first cell when nothing is chosen yet', () => {
    const stops = mountPicker()
      .findAll('[role="radio"]')
      .map((c) => c.attributes('tabindex'))
    expect(stops).toEqual(['0', '-1', '-1'])
  })

  it('moves along the grid with the arrow keys, choosing as it goes', async () => {
    const w = mountPicker({ modelValue: 'wrench' })
    await w.findAll('[role="radio"]')[0]?.trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['flame'])
  })

  it('wraps at both ends rather than stopping dead', async () => {
    const w = mountPicker({ modelValue: 'wrench' })
    await w.findAll('[role="radio"]')[0]?.trigger('keydown', { key: 'ArrowLeft' })
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['box'])
  })

  it('goes to the ends with Home and End', async () => {
    const w = mountPicker({ modelValue: 'flame' })
    await w.findAll('[role="radio"]')[1]?.trigger('keydown', { key: 'End' })
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['box'])

    const back = mountPicker({ modelValue: 'flame' })
    await back.findAll('[role="radio"]')[1]?.trigger('keydown', { key: 'Home' })
    expect(back.emitted('update:modelValue')?.[0]).toEqual(['wrench'])
  })

  it('moves the caret with the choice, so a reader is not left on a stale cell', async () => {
    const w = mountPicker({ modelValue: 'wrench' })
    await w.findAll('[role="radio"]')[0]?.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(w.findAll('[role="radio"]')[1]?.element)
    w.unmount()
  })

  it('leaves a key it does not own alone', async () => {
    const w = mountPicker({ modelValue: 'wrench' })
    await w.findAll('[role="radio"]')[0]?.trigger('keydown', { key: 'a' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  // A grid with no way back to nothing is a choice that cannot be unmade.
  it('offers no way back to nothing unless the host asks for one', () => {
    expect(mountPicker().findAll('[role="radio"]')).toHaveLength(3)
    expect(mountPicker({ clearLabel: 'No mark' }).findAll('[role="radio"]')).toHaveLength(4)
  })

  it('draws the way back to nothing first, and as a mark rather than a glyph', () => {
    const cells = mountPicker({ clearLabel: 'No mark' }).findAll('[role="radio"]')
    expect(cells[0]?.attributes('aria-label')).toBe('No mark')
    expect(cells[0]?.find('svg').exists()).toBe(false)
  })

  it('reports the empty name when the way back to nothing is taken', async () => {
    const w = mountPicker({ modelValue: 'flame', clearLabel: 'No mark' })
    await w.findAll('[role="radio"]')[0]?.trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([''])
  })

  it('shows nothing chosen as chosen, once nothing is a choice', () => {
    const w = mountPicker({ modelValue: '', clearLabel: 'No mark' })
    expect(w.findAll('[role="radio"]')[0]?.attributes('aria-checked')).toBe('true')
  })

  it('draws an empty set without falling over', () => {
    const w = mountPicker({ options: [] })
    expect(w.findAll('[role="radio"]')).toHaveLength(0)
  })
})
