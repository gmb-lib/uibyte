import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ChoiceRows from './ChoiceRows.vue'

const items = [
  { key: 'a', label: 'First place' },
  { key: 'b', label: 'Second place' },
]

describe('ChoiceRows', () => {
  it('draws one button per choice, in order, and says which was pressed', async () => {
    const w = mount(ChoiceRows, { props: { items, label: 'Places' } })
    const rows = w.findAll('button')
    expect(rows.map((r) => r.text())).toEqual(['First place', 'Second place'])
    await rows[1].trigger('click')
    expect(w.emitted('choose')).toEqual([['b']])
  })

  it('draws a single choice as one row, and no row and no box without any', () => {
    const one = mount(ChoiceRows, { props: { items: [items[0]], label: 'Places' } })
    expect(one.findAll('button')).toHaveLength(1)

    const none = mount(ChoiceRows, { props: { items: [], label: 'Places' } })
    expect(none.findAll('button')).toHaveLength(0)
    expect(none.html()).not.toContain('<ul')
    expect(none.element.nodeType).not.toBe(Node.ELEMENT_NODE)
  })

  it('marks the row being acted on busy, every row unavailable, and emits nothing on a press', async () => {
    const w = mount(ChoiceRows, { props: { items, label: 'Places', busy: 'b' } })
    const rows = w.findAll('button')
    expect(rows.map((r) => r.attributes('aria-busy'))).toEqual([undefined, 'true'])
    expect(rows.map((r) => r.attributes('aria-disabled'))).toEqual(['true', 'true'])
    // Not `disabled`: that would take focus away from the row just pressed.
    expect(rows.map((r) => r.attributes('disabled'))).toEqual([undefined, undefined])
    for (const r of rows) await r.trigger('click')
    expect(w.emitted('choose')).toBeUndefined()

    await w.setProps({ busy: undefined })
    expect(w.findAll('button').every((r) => r.attributes('aria-disabled') === undefined)).toBe(true)
    await w.findAll('button')[0].trigger('click')
    expect(w.emitted('choose')).toEqual([['a']])
  })

  it('leaves focus on the row just pressed when busy is set', async () => {
    const w = mount(ChoiceRows, { props: { items, label: 'Places' }, attachTo: document.body })
    const pressed = w.findAll('button')[0].element as HTMLElement
    pressed.focus()
    await w.findAll('button')[0].trigger('click')
    expect(w.emitted('choose')).toEqual([['a']])
    await w.setProps({ busy: 'a' })
    expect(document.activeElement).toBe(pressed)
    w.unmount()
  })

  it('keeps two rows with the same words apart by their keys', async () => {
    const twins = [
      { key: 'x', label: 'Same words' },
      { key: 'y', label: 'Same words' },
    ]
    const w = mount(ChoiceRows, { props: { items: twins, label: 'Places' } })
    const rows = w.findAll('button')
    expect(rows).toHaveLength(2)
    expect(rows.map((r) => r.attributes('data-choice'))).toEqual(['x', 'y'])
    await rows[1].trigger('click')
    await rows[0].trigger('click')
    expect(w.emitted('choose')).toEqual([['y'], ['x']])
  })

  it('holds a 200-character label whole and never cuts it by its markup', () => {
    const long = 'Ābolu ķirši žāvēti '.repeat(11).slice(0, 200)
    expect(long).toHaveLength(200)
    const w = mount(ChoiceRows, { props: { items: [{ key: 'l', label: long }], label: 'Places' } })
    const row = w.get('button')
    expect(row.text()).toBe(long.trim())
    expect(w.text()).toContain('ž')
    const cutting = /(^|\s)(truncate|text-ellipsis|overflow-hidden|whitespace-nowrap|line-clamp-\d+)(\s|$)/
    for (const el of [row.element, ...Array.from(row.element.querySelectorAll('*'))]) {
      expect(el.getAttribute('class') ?? '').not.toMatch(cutting)
    }
  })

  it('is a list with the accessible name given, every row a button of type button', () => {
    const w = mount(ChoiceRows, { props: { items, label: 'Places to go' } })
    expect(w.get('ul').attributes('aria-label')).toBe('Places to go')
    // Safari stops calling a `list-style: none` list a list unless it is told.
    expect(w.get('ul').attributes('role')).toBe('list')
    const rows = w.findAll('li > *')
    expect(rows).toHaveLength(2)
    for (const r of rows) {
      expect(r.element.tagName).toBe('BUTTON')
      expect(r.attributes('type')).toBe('button')
    }
    expect(w.get('button svg').attributes('aria-hidden')).toBe('true')
  })
})
