import { afterEach, describe, it, expect } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import OrderableList from './OrderableList.vue'

type Row = { id: string; name: string }

const items: Row[] = [
  { id: 'a', name: 'a.txt' },
  { id: 'b', name: 'b.txt' },
  { id: 'c', name: 'c.txt' },
]

function mountList(orderable = true) {
  return mount(OrderableList<Row>, {
    props: {
      items,
      itemKey: (r: Row) => r.id,
      label: (r: Row) => r.name,
      listLabel: 'Ordered rows',
      orderable,
    },
    slots: { default: `<template #default="{ item }">{{ item.name }}</template>` },
  })
}

describe('OrderableList', () => {
  it('renders rows in order with position badges and grip handles', () => {
    const w = mountList()
    const rows = w.findAll('li')
    expect(rows).toHaveLength(3)
    expect(rows[0].text()).toContain('1')
    expect(rows[0].text()).toContain('a.txt')
    expect(rows[2].text()).toContain('3')
    expect(w.findAll('[data-testid="grip"]')).toHaveLength(3)
  })

  it('moves the focused row with Alt+ArrowDown / Alt+ArrowUp', async () => {
    const w = mountList()
    const rows = w.findAll('li')
    await rows[0].trigger('keydown', { key: 'ArrowDown', altKey: true })
    expect(w.emitted('move')).toEqual([[0, 1]])
    await rows[2].trigger('keydown', { key: 'ArrowUp', altKey: true })
    expect(w.emitted('move')).toEqual([
      [0, 1],
      [2, 1],
    ])
    // Without Alt nothing moves; at the edges nothing moves.
    await rows[0].trigger('keydown', { key: 'ArrowUp' })
    await rows[0].trigger('keydown', { key: 'ArrowUp', altKey: true })
    expect(w.emitted('move')).toHaveLength(2)
  })

  it('emits a move on drag and drop', async () => {
    const w = mountList()
    const rows = w.findAll('li')
    await rows[0].trigger('dragstart', { dataTransfer: { effectAllowed: '' } })
    await rows[2].trigger('dragover', { dataTransfer: {} })
    await rows[2].trigger('drop')
    expect(w.emitted('move')).toEqual([[0, 2]])
  })

  it('renders without any reorder affordance when not orderable', () => {
    const w = mountList(false)
    expect(w.findAll('[data-testid="grip"]')).toHaveLength(0)
    expect(w.find('li').attributes('draggable')).toBeUndefined()
  })

  // The labels arrive as props now that the kit does no translation, so the
  // accessible names are worth asserting rather than assuming.
  it('names the list and each row for assistive technology', () => {
    const w = mountList()
    expect(w.get('ul').attributes('aria-label')).toBe('Ordered rows')
    expect(w.findAll('li')[1].attributes('aria-label')).toBe('b.txt — 2 of 3')
  })

  it('drops the position from a row name when the list is not orderable', () => {
    const w = mountList(false)
    expect(w.find('li').attributes('aria-label')).toBe('a.txt')
  })
})

// A row that holds links of its own: the host draws the row and places the grip
// in it, and only the grip moves the row.
describe('OrderableList moved by its grip only', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  function mountByGrip(orderable = true) {
    return mount(OrderableList<Row>, {
      props: {
        items,
        itemKey: (r: Row) => r.id,
        label: (r: Row) => r.name,
        listLabel: 'Ordered rows',
        rowLabel: (name: string, position: number, total: number) => `Move ${name}, ${position} of ${total}`,
        orderable,
        handle: true,
      },
      slots: {
        default: `<template #default="{ item, grip }"><div><component :is="grip" /><a :href="'#' + item.id">{{ item.name }}</a></div></template>`,
      },
      attachTo: document.body,
    })
  }

  const grips = (w: ReturnType<typeof mountByGrip>) => w.findAll('li button')

  it('is a plain list of plain rows — no listbox, no options, no stop on the row', () => {
    const w = mountByGrip()
    const list = w.get('ul')
    expect(list.attributes('role')).toBe('list')
    expect(list.attributes('aria-label')).toBe('Ordered rows')
    expect(w.find('[role="listbox"]').exists()).toBe(false)
    expect(w.find('[role="option"]').exists()).toBe(false)
    const rows = w.findAll('li')
    expect(rows).toHaveLength(3)
    for (const row of rows) {
      expect(row.attributes('role')).toBeUndefined()
      expect(row.attributes('aria-selected')).toBeUndefined()
      expect(row.attributes('tabindex')).toBeUndefined()
      expect(row.attributes('aria-label')).toBeUndefined()
    }
  })

  it('leaves the look of the row to the host — no card, no position badge', () => {
    const w = mountByGrip()
    const rows = w.findAll('li')
    expect(rows.map((r) => r.text())).toEqual(['a.txt', 'b.txt', 'c.txt'])
    for (const row of rows) {
      for (const card of ['rounded-card', 'border', 'bg-surface', 'px-4', 'py-3']) {
        expect(row.classes()).not.toContain(card)
      }
    }
    expect(w.find('.rounded-pill').exists()).toBe(false)
  })

  it('gives each row a grip that is a button in the Tab order, named in the host’s words', () => {
    const w = mountByGrip()
    expect(grips(w)).toHaveLength(3)
    const grip = grips(w)[1]
    expect(grip.attributes('type')).toBe('button')
    expect(grip.attributes('aria-label')).toBe('Move b.txt, 2 of 3')
    expect(grip.attributes('tabindex')).toBeUndefined()
    expect(grip.get('svg').attributes('aria-hidden')).toBe('true')
    expect(grip.findAll('circle')).toHaveLength(6)
  })

  it('moves a row with Alt+ArrowDown / Alt+ArrowUp on its grip, never past the ends', async () => {
    const w = mountByGrip()
    await grips(w)[0].trigger('keydown', { key: 'ArrowDown', altKey: true })
    await grips(w)[2].trigger('keydown', { key: 'ArrowUp', altKey: true })
    expect(w.emitted('move')).toEqual([
      [0, 1],
      [2, 1],
    ])
    await grips(w)[0].trigger('keydown', { key: 'ArrowDown' })
    await grips(w)[0].trigger('keydown', { key: 'ArrowUp', altKey: true })
    await grips(w)[2].trigger('keydown', { key: 'ArrowDown', altKey: true })
    expect(w.emitted('move')).toHaveLength(2)
  })

  it('moves nothing for a drag that begins anywhere but the grip', async () => {
    const w = mountByGrip()
    const rows = w.findAll('li')
    // At rest no row is draggable, so text in it can be selected and its links
    // dragged as links.
    expect(rows.map((r) => r.attributes('draggable'))).toEqual([undefined, undefined, undefined])

    // A link drags itself; its dragstart reaches the row on the way up.
    await rows[0].get('a').trigger('dragstart', { dataTransfer: { effectAllowed: '' } })
    await rows[2].trigger('dragover', { dataTransfer: {} })
    await rows[2].trigger('drop')
    expect(w.emitted('move')).toBeUndefined()

    // Pressing on the row's own content does not arm it.
    await rows[0].get('a').trigger('pointerdown', { button: 0 })
    expect(rows[0].attributes('draggable')).toBeUndefined()

    // Nor does a row that was never armed start a move of its own.
    await rows[1].trigger('dragstart', { dataTransfer: { effectAllowed: '' } })
    await rows[2].trigger('dragover', { dataTransfer: {} })
    await rows[2].trigger('drop')
    expect(w.emitted('move')).toBeUndefined()

    // Even with the grip held, a drag that something inside the row starts for
    // itself is that thing's, not the row's.
    await grips(w)[0].trigger('pointerdown', { button: 0 })
    await rows[0].get('a').trigger('dragstart', { dataTransfer: { effectAllowed: '' } })
    await rows[2].trigger('dragover', { dataTransfer: {} })
    await rows[2].trigger('drop')
    expect(w.emitted('move')).toBeUndefined()
  })

  it('drags the whole row from its grip, with the drop line and the fade', async () => {
    const w = mountByGrip()
    const rows = w.findAll('li')
    await grips(w)[0].trigger('pointerdown', { button: 0 })
    expect(rows[0].attributes('draggable')).toBe('true')
    expect(rows[1].attributes('draggable')).toBeUndefined()

    await rows[0].trigger('dragstart', { dataTransfer: { effectAllowed: '' } })
    await rows[2].trigger('dragover', { dataTransfer: {} })
    expect(rows[0].classes()).toContain('opacity-45')
    expect(rows[2].classes()).toContain('shadow-[inset_0_3px_0_0_var(--color-status-ontrack)]')
    await rows[2].trigger('drop')
    await rows[0].trigger('dragend')
    expect(w.emitted('move')).toEqual([[0, 2]])
    // The drag is over, so the row is no longer draggable.
    expect(rows[0].attributes('draggable')).toBeUndefined()
  })

  it('lets go of the row when the press on the grip ends without a drag', async () => {
    const w = mountByGrip()
    const rows = w.findAll('li')
    await grips(w)[1].trigger('pointerdown', { button: 0 })
    expect(rows[1].attributes('draggable')).toBe('true')
    // Released anywhere — the pointer may have left the grip first.
    document.body.dispatchEvent(new Event('pointerup', { bubbles: true }))
    await nextTick()
    expect(rows[1].attributes('draggable')).toBeUndefined()
  })

  // The host owns the order and may write it somewhere before it draws it, so the
  // move can arrive a while after the key was pressed.
  it('puts focus on the moved row’s grip once the host has drawn the new order', async () => {
    const w = mountByGrip()
    const b = grips(w)[1]
    ;(b.element as HTMLElement).focus()
    await b.trigger('keydown', { key: 'ArrowUp', altKey: true })
    expect(w.emitted('move')).toEqual([[1, 0]])

    // Something else about the list changes first; the order has not yet.
    await w.setProps({ items: [...items] })
    await flushPromises()

    await w.setProps({ items: [items[1], items[0], items[2]] })
    await flushPromises()
    const moved = grips(w)[0]
    expect(moved.attributes('aria-label')).toBe('Move b.txt, 1 of 3')
    expect(document.activeElement).toBe(moved.element)

    // Then it forgets: a later change of order that moves the same row again does
    // not pull focus back to its grip. (Row c's own element stays where it is in
    // this change, so its link keeps focus unless something takes it.)
    const link = w.findAll('li a')[2].element as HTMLElement
    link.focus()
    await w.setProps({ items: [items[0], items[2], items[1]] })
    await flushPromises()
    expect(document.activeElement).toBe(link)
  })

  it('leaves focus where the person took it, if they moved on before the host drew the move', async () => {
    const w = mountByGrip()
    const elsewhere = document.createElement('button')
    document.body.appendChild(elsewhere)
    const b = grips(w)[1]
    ;(b.element as HTMLElement).focus()
    await b.trigger('keydown', { key: 'ArrowUp', altKey: true })
    elsewhere.focus()
    await w.setProps({ items: [items[1], items[0], items[2]] })
    await flushPromises()
    expect(document.activeElement).toBe(elsewhere)
  })

  it('draws no grip and allows no drag when the list is not orderable', async () => {
    const w = mountByGrip(false)
    expect(w.findAll('button')).toHaveLength(0)
    expect(w.find('[data-testid="grip"]').exists()).toBe(false)
    const rows = w.findAll('li')
    expect(rows.map((r) => r.text())).toEqual(['a.txt', 'b.txt', 'c.txt'])
    expect(rows[0].attributes('draggable')).toBeUndefined()
    await rows[0].trigger('dragstart', { dataTransfer: { effectAllowed: '' } })
    await rows[2].trigger('dragover', { dataTransfer: {} })
    await rows[2].trigger('drop')
    expect(w.emitted('move')).toBeUndefined()
  })
})
