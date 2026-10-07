import { describe, expect, it } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import ListTable from './ListTable.vue'
import type { ListColumn } from './types'

interface Item {
  id: string
  name: string
  kind: string
  since: string
}

const columns: ListColumn[] = [
  { key: 'name', label: 'Name', width: 'minmax(200px,2fr)', priority: 1, sortable: true },
  { key: 'kind', label: 'Kind', width: '140px' },
  { key: 'since', label: 'Since', width: '120px', priority: 3, end: true },
]
const rows: Item[] = [
  { id: 'a', name: 'Anna Ozola', kind: 'Manager', since: '3 Oct' },
  { id: 'b', name: 'Jānis Liepa', kind: 'Worker', since: '1 Sep' },
]
const base = { columns, rows, rowKey: (r: Item) => r.id, label: 'People' }

describe('ListTable', () => {
  it('is a named list with one entry per row', () => {
    const w = mount(ListTable<Item>, { props: base })
    expect(w.get('ul').attributes('aria-label')).toBe('People')
    expect(w.findAll('li')).toHaveLength(2)
  })

  // The whole row is the target: one link, one stop, every cell inside it.
  it('makes each whole row one link, through the host’s link component', () => {
    const w = mount(ListTable<Item>, {
      props: { ...base, rowLink: (r: Item) => ({ to: { name: 'person', params: { id: r.id } } }), linkComponent: RouterLinkStub },
    })
    const links = w.findAllComponents(RouterLinkStub)
    expect(links).toHaveLength(2)
    expect(links[0].props('to')).toEqual({ name: 'person', params: { id: 'a' } })
    expect(links[0].text()).toBe('Anna OzolaManager3 Oct')
  })

  it('makes each row one button that says which row was opened, when there is no link', async () => {
    const w = mount(ListTable<Item>, { props: base })
    const buttons = w.findAll('li > button')
    expect(buttons).toHaveLength(2)
    expect(buttons[1].attributes('type')).toBe('button')
    await buttons[1].trigger('click')
    expect(w.emitted('open')).toEqual([[rows[1]]])
  })

  it('opens nothing itself when the row is a link', async () => {
    const w = mount(ListTable<Item>, { props: { ...base, rowLink: () => ({ href: '#x' }) } })
    await w.get('li > a').trigger('click')
    expect(w.emitted('open')).toBeUndefined()
  })

  it('draws each cell from the row by default, and from the host’s slot when given', () => {
    const w = mount(ListTable<Item>, {
      props: base,
      slots: { 'cell-kind': '<template #cell-kind="{ row, value }"><em>{{ value }} of {{ row.id }}</em></template>' },
    })
    expect(w.findAll('li')[0].text()).toBe('Anna OzolaManager of a3 Oct')
    expect(w.findAll('em')).toHaveLength(2)
  })

  it('offers to sort only the columns the host says, and asks rather than sorts', async () => {
    const w = mount(ListTable<Item>, { props: base })
    const headerButtons = w.findAll('button').filter((b) => !b.element.closest('li'))
    expect(headerButtons.map((b) => b.text())).toEqual(['Name'])
    await headerButtons[0].trigger('click')
    expect(w.emitted('sort')).toEqual([['name']])
    expect(w.findAll('li')[0].text()).toContain('Anna')
  })

  it('says which way a column is sorted, in the host’s words, with an arrow a reader does not hear', () => {
    const w = mount(ListTable<Item>, {
      props: { ...base, sort: { key: 'name', direction: 'descending' }, sortedLabels: { ascending: 'sorted A to Z', descending: 'sorted Z to A' } },
    })
    const header = w.findAll('button').find((b) => b.text().startsWith('Name'))!
    expect(header.get('.sr-only').text()).toBe('sorted Z to A')
    expect(header.get('[aria-hidden="true"]').text()).toBe('↓')
  })

  it('marks the row that is open', () => {
    const w = mount(ListTable<Item>, { props: { ...base, current: 'b' } })
    const rowsDrawn = w.findAll('li > button')
    expect(rowsDrawn[0].attributes('aria-current')).toBeUndefined()
    expect(rowsDrawn[1].attributes('aria-current')).toBe('true')
  })

  it('shows a visible focus ring on a row', () => {
    const w = mount(ListTable<Item>, { props: base })
    expect(w.get('li > button').classes()).toContain('focus-visible:outline-focus')
  })

  it('puts what the host gives under the rows inside the same card', () => {
    const w = mount(ListTable<Item>, { props: base, slots: { footer: '<p class="foot">1–2 of 2</p>' } })
    expect(w.get('ul').element.nextElementSibling?.className).toBe('foot')
  })

  // Folding is a layout claim the test environment cannot measure, so the
  // pieces that make it are pinned: the table measures itself, and each
  // column's priority decides what it does as the table narrows.
  describe('folding by its own width', () => {
    it('is its own size container', () => {
      expect(mount(ListTable<Item>, { props: base }).classes()).toContain('@container')
    })

    it('lays rows on every column while wide, and drops priority 3 below that', () => {
      const style = (mount(ListTable<Item>, { props: base }).element as HTMLElement).style
      expect(style.getPropertyValue('--list-wide')).toBe('minmax(200px,2fr) 140px 120px')
      expect(style.getPropertyValue('--list-medium')).toBe('minmax(200px,2fr) 140px')
    })

    it('hides a priority-3 column once the table is no longer wide', () => {
      const cells = mount(ListTable<Item>, { props: base }).findAll('li')[0].findAll('span')
      expect(cells[2].classes()).toContain('@max-[1100px]:hidden')
      expect(cells[1].classes()).not.toContain('@max-[1100px]:hidden')
    })

    it('puts the title on a line of its own when narrow, the rest beneath, and drops the header', () => {
      const w = mount(ListTable<Item>, { props: base })
      const cells = w.findAll('li')[0].findAll('span')
      expect(cells[0].classes()).toContain('@max-[760px]:basis-full')
      expect(cells[1].classes()).not.toContain('@max-[760px]:basis-full')
      expect(w.get('li > button').classes()).toContain('@max-[760px]:flex-wrap')
      expect((w.element as HTMLElement).firstElementChild?.classList.contains('@max-[760px]:hidden')).toBe(true)
    })
  })
})
