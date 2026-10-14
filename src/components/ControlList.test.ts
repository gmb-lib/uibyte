import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import ControlList from './ControlList.vue'
import type { ListColumn } from './types'

interface Person {
  id: string
  name: string
  level: string
  since: string
}

const columns: ListColumn[] = [
  { key: 'name', label: 'Person', width: 'minmax(220px,1.6fr)', priority: 1, sortable: true },
  { key: 'level', label: 'Level', width: '170px' },
  { key: 'since', label: 'Since', width: 'minmax(160px,1.2fr)', priority: 3 },
  { key: 'act', label: '', width: '90px', end: true },
]
const rows: Person[] = [
  { id: 'a', name: 'Anna Ozola', level: 'Full', since: '3 Oct' },
  { id: 'b', name: 'Jānis Liepa', level: 'Read', since: '1 Sep' },
]
const base = { columns, rows, rowKey: (r: Person) => r.id, label: 'People' }

/** A host's row: a picker named for its row, and an act on it. */
function withControls(acted: string[] = []) {
  return mount(ControlList<Person>, {
    props: base,
    slots: {
      'cell-level': ({ row }: { row: Person }) =>
        h('select', { 'aria-label': `Level — ${row.name}` }, [h('option', 'Full'), h('option', 'Read')]),
      'cell-act': ({ row }: { row: Person }) =>
        h('button', { type: 'button', onClick: () => acted.push(row.id) }, 'Remove'),
    },
  })
}

const INTERACTIVE = 'a[href], button, input, select, textarea, [tabindex]'

describe('ControlList', () => {
  it('is a named list with one entry per row', () => {
    const w = mount(ControlList<Person>, { props: base })
    expect(w.get('ul').attributes('role')).toBe('list')
    expect(w.get('ul').attributes('aria-label')).toBe('People')
    expect(w.findAll('li')).toHaveLength(2)
  })

  // A row here is its cells. It is not one target, so nothing about it says it is.
  it('draws each row as plain cells — no link, no button, no stop of its own', () => {
    const w = mount(ControlList<Person>, { props: base })
    for (const entry of w.findAll('li')) {
      expect(entry.element.querySelectorAll(INTERACTIVE)).toHaveLength(0)
      const row = entry.element.firstElementChild as HTMLElement
      expect(row.tagName).toBe('DIV')
      expect(row.getAttribute('role')).toBeNull()
      expect(row.getAttribute('tabindex')).toBeNull()
      expect(entry.attributes('tabindex')).toBeUndefined()
    }
    expect(w.findAll('li')[0].text()).toBe('Anna OzolaFull3 Oct')
  })

  // A control inside a link or a button is two targets at once; here every control
  // is the host's own, wrapped by nothing a person could press instead.
  it('holds the host’s controls, each its own stop, wrapped by nothing that can be pressed', async () => {
    const acted: string[] = []
    const w = withControls(acted)
    const entries = w.findAll('li')
    expect(entries[1].findAll('select')).toHaveLength(1)
    expect(entries[1].get('select').attributes('aria-label')).toBe('Level — Jānis Liepa')
    for (const entry of entries) {
      const controls = Array.from(entry.element.querySelectorAll(INTERACTIVE))
      expect(controls.map((c) => c.tagName)).toEqual(['SELECT', 'BUTTON'])
      for (const control of controls) {
        expect(control.parentElement?.closest('a, button, [role="button"], [role="link"]')).toBeNull()
        expect(control.getAttribute('tabindex')).toBeNull()
      }
    }
    await entries[1].get('button').trigger('click')
    expect(acted).toEqual(['b'])
    // The act is the host's; the list answers nothing of its own (the click recorded
    // here is the host's own, bubbling through the card).
    expect(Object.keys(w.emitted()).filter((name) => name !== 'click')).toEqual([])
  })

  it('draws each cell from the row by default, and from the host’s slot when given', () => {
    const w = mount(ControlList<Person>, {
      props: base,
      slots: { 'cell-level': '<template #cell-level="{ row, value }"><em>{{ value }} for {{ row.id }}</em></template>' },
    })
    expect(w.findAll('li')[0].text()).toBe('Anna OzolaFull for a3 Oct')
    expect(w.findAll('em')).toHaveLength(2)
  })

  // A question asked before an act on one row belongs with that row.
  it('puts what the host gives about one row under its cells, inside its entry', () => {
    const w = mount(ControlList<Person>, {
      props: base,
      slots: {
        'row-after': ({ row }: { row: Person }) =>
          row.id === 'b' ? h('p', { class: 'ask' }, `Take ${row.name} out?`) : null,
      },
    })
    const [first, second] = w.findAll('li')
    expect(second.element.children).toHaveLength(2)
    expect(second.element.lastElementChild?.className).toBe('ask')
    expect(second.element.lastElementChild?.textContent).toBe('Take Jānis Liepa out?')
    expect(second.element.firstElementChild?.textContent).toBe('Jānis LiepaRead1 Sep')
    expect(first.element.children).toHaveLength(1)
  })

  it('heads its columns as the list table does, offering to sort only the columns the host says', async () => {
    const w = mount(ControlList<Person>, {
      props: { ...base, sort: { key: 'name', direction: 'ascending' }, sortedLabels: { ascending: 'sorted A to Z', descending: 'sorted Z to A' } },
    })
    const header = Array.from(((w.element as HTMLElement).firstElementChild as HTMLElement).children)
    expect(header.map((cell) => cell.querySelector('button') !== null)).toEqual([true, false, false, false])
    expect(header.slice(1).map((cell) => cell.textContent)).toEqual(['Level', 'Since', ''])
    const sortButtons = w.findAll('button').filter((b) => !b.element.closest('li'))
    expect(sortButtons).toHaveLength(1)
    expect(sortButtons[0].get('.sr-only').text()).toBe('sorted A to Z')
    expect(sortButtons[0].get('[aria-hidden="true"]').text()).toBe('↑')
    await sortButtons[0].trigger('click')
    expect(w.emitted('sort')).toEqual([['name']])
    expect(w.findAll('li')[0].text()).toContain('Anna')
  })

  it('puts what the host gives under the rows inside the same card', () => {
    const w = mount(ControlList<Person>, { props: base, slots: { footer: '<p class="foot">1–2 of 2</p>' } })
    expect(w.get('ul').element.nextElementSibling?.className).toBe('foot')
  })

  // Folding is a layout claim the test environment cannot measure, so the pieces
  // that make it are pinned, as they are for the list table: the list measures
  // itself, and each column's priority decides what it does as the list narrows.
  describe('folding by its own width, as the list table does', () => {
    it('is its own size container, in the same card', () => {
      const classes = mount(ControlList<Person>, { props: base }).classes()
      expect(classes).toEqual(expect.arrayContaining(['@container', 'rounded-card', 'border', 'bg-surface']))
    })

    it('lays rows on every column while wide, and drops priority 3 below that', () => {
      const style = (mount(ControlList<Person>, { props: base }).element as HTMLElement).style
      expect(style.getPropertyValue('--list-wide')).toBe('minmax(220px,1.6fr) 170px minmax(160px,1.2fr) 90px')
      expect(style.getPropertyValue('--list-medium')).toBe('minmax(220px,1.6fr) 170px 90px')
    })

    it('hides a priority-3 column once the list is no longer wide, and draws an end column at its end', () => {
      const cells = mount(ControlList<Person>, { props: base }).findAll('li')[0].findAll('span')
      expect(cells[2].classes()).toContain('@max-[1100px]:hidden')
      expect(cells[1].classes()).not.toContain('@max-[1100px]:hidden')
      expect(cells[3].classes()).toContain('text-end')
    })

    it('puts the title on a line of its own when narrow, the rest beneath, and drops the header', () => {
      const w = mount(ControlList<Person>, { props: base })
      const row = w.findAll('li')[0].element.firstElementChild as HTMLElement
      const cells = w.findAll('li')[0].findAll('span')
      expect(cells[0].classes()).toContain('@max-[760px]:basis-full')
      expect(cells[1].classes()).not.toContain('@max-[760px]:basis-full')
      expect(Array.from(row.classList)).toEqual(expect.arrayContaining(['@max-[760px]:flex', '@max-[760px]:flex-wrap']))
      expect((w.element as HTMLElement).firstElementChild?.classList.contains('@max-[760px]:hidden')).toBe(true)
    })
  })
})
