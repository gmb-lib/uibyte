import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DiffList from './DiffList.vue'
import StatusPill from './StatusPill.vue'
import type { DiffColumns, DiffGroup } from './types'

const columns: DiffColumns = { part: 'part', key: 'key', status: 'what happens', detail: 'why' }

const colours = (): DiffGroup => ({
  key: 'colours',
  title: 'Colours',
  summary: '2 changes',
  foldedLabel: '3 unchanged',
  rows: [
    { key: 'teal', part: 'palette', status: 'ontrack', statusLabel: 'added' },
    { key: 'rose', part: 'palette', status: 'blocked', statusLabel: 'changed', detail: 'label' },
    { key: 'navy', part: 'palette', status: 'idle', statusLabel: 'unchanged', folded: true },
    { key: 'sand', part: 'palette', status: 'idle', statusLabel: 'unchanged', folded: true },
    { key: 'teal', part: 'accents', status: 'idle', statusLabel: 'unchanged', folded: true },
  ],
})

const list = (groups: DiffGroup[]) => mount(DiffList, { props: { groups, columns } })
const keysShown = (w: ReturnType<typeof list>, group = 0) =>
  w
    .findAll('section')
    [group].findAll('tbody tr')
    .filter((tr) => (tr.element as HTMLElement).closest('table')?.style.display !== 'none')
    .map((tr) => tr.get('td.font-mono').text())

describe('DiffList', () => {
  it('draws each group under its title, each row with its key, its pill and its reason', () => {
    const w = list([colours()])
    expect(w.get('h4').text()).toContain('Colours')
    const row = w.findAll('tbody tr')[1]
    expect(row.text()).toContain('rose')
    expect(row.findComponent(StatusPill).props()).toMatchObject({ status: 'blocked', label: 'changed' })
    expect(row.text()).toContain('label')
  })

  it('keeps folded rows behind the fold until it is opened', async () => {
    const w = list([colours()])
    expect(keysShown(w)).toEqual(['teal', 'rose'])
    await w.get('button').trigger('click')
    expect(keysShown(w)).toEqual(['teal', 'rose', 'navy', 'sand', 'teal'])
    await w.get('button').trigger('click')
    expect(keysShown(w)).toEqual(['teal', 'rose'])
  })

  it('says whether the fold is open, and which rows it opens', async () => {
    const w = list([colours()])
    const toggle = w.get('button')
    expect(toggle.text()).toBe('3 unchanged')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(toggle.attributes('aria-controls')).toBe(w.get('table').attributes('id'))
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
  })

  it('draws no fold when no row is folded', () => {
    const g = colours()
    g.rows = g.rows.filter((r) => !r.folded)
    expect(list([g]).find('button').exists()).toBe(false)
  })

  it('opens one group without opening another', async () => {
    const second = { ...colours(), key: 'shades', title: 'Shades' }
    const w = list([colours(), second])
    await w.findAll('section')[1].get('button').trigger('click')
    expect(keysShown(w, 0)).toHaveLength(2)
    expect(keysShown(w, 1)).toHaveLength(5)
  })

  // A group whose rows are all folded has nothing to show until it is opened,
  // but the table the toggle names must still exist.
  it('keeps a wholly folded table in place, hidden, for the toggle to name', () => {
    const g = colours()
    g.rows = g.rows.filter((r) => r.folded)
    const w = list([g])
    const table = w.get('table')
    expect(table.attributes('style')).toContain('display: none')
    expect(w.get('button').attributes('aria-controls')).toBe(table.attributes('id'))
  })

  it('draws the part column only for a group whose rows have parts', () => {
    const plain: DiffGroup = {
      key: 'plain',
      title: 'Plain',
      rows: [{ key: 'one', status: 'ontrack', statusLabel: 'added' }],
    }
    const w = list([colours(), plain])
    const [withParts, without] = w.findAll('section')
    expect(withParts.findAll('th').map((th) => th.text())).toEqual(['part', 'key', 'what happens', 'why'])
    expect(without.findAll('th').map((th) => th.text())).toEqual(['key', 'what happens', 'why'])
    expect(without.findAll('td')).toHaveLength(3)
  })

  it('heads each column for a reader, in the words it was given', () => {
    const w = list([colours()])
    for (const th of w.findAll('th')) expect(th.attributes('scope')).toBe('col')
  })

  it('draws a group with no rows as its title and its note alone', () => {
    const w = list([{ key: 'quiet', title: 'Quiet', note: 'did not answer', rows: [] }])
    expect(w.text()).toContain('Quiet')
    expect(w.text()).toContain('did not answer')
    expect(w.find('table').exists()).toBe(false)
  })

  it('draws the group badge as a pill in the role it was given', () => {
    const w = list([{ ...colours(), badge: 'refused', badgeStatus: 'late' }])
    expect(w.get('h4').findComponent(StatusPill).props()).toMatchObject({ status: 'late', label: 'refused' })
  })

  it('marks a row a reader must not miss, in its own role', () => {
    const g = colours()
    g.rows[1] = { ...g.rows[1], status: 'late', statusLabel: 'refused', marked: true }
    const rows = list([g]).findAll('tbody tr')
    expect(rows[1].attributes('data-marked')).toBe('true')
    expect(rows[1].classes()).toContain('bg-status-late-bg/40')
    expect(rows[0].attributes('data-marked')).toBeUndefined()
  })

  it('draws a dash no reader hears where a row has no reason', () => {
    const cell = list([colours()]).findAll('tbody tr')[0].findAll('td')[3]
    expect(cell.text()).toBe('—')
    expect(cell.get('span').attributes('aria-hidden')).toBe('true')
  })

  it('names each group by its title for a reader', () => {
    const w = list([colours()])
    const section = w.get('section')
    const title = w.get('h4 span')
    expect(section.attributes('aria-labelledby')).toBe(title.attributes('id'))
  })

  // It renders the host's answer: a new answer is a new list, with no copy of
  // the old one kept anywhere.
  it('holds nothing of its own — the rows follow the prop', async () => {
    const w = list([colours()])
    const g = colours()
    g.rows = [{ key: 'olive', status: 'late', statusLabel: 'refused' }]
    await w.setProps({ groups: [g] })
    expect(keysShown(w)).toEqual(['olive'])
    expect(w.text()).not.toContain('rose')
  })
})
