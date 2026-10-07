import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import DayList from './DayList.vue'
import type { DayGroup } from './types'

const days: DayGroup[] = [
  {
    key: '2026-10-07',
    heading: 'Today',
    lines: [
      { key: 'a', time: '14:02', text: 'Anna gave Jānis the role Buyer.', where: 'People & access' },
      { key: 'b', time: '09:40', text: 'The workspace was exported.', marked: true },
    ],
  },
  { key: '2026-10-06', heading: 'Tuesday 6 October', lines: [{ key: 'c', time: '17:15', text: 'Ilze was added.' }] },
]

describe('DayList', () => {
  it('is a named region of days, each under its heading, in the order given', () => {
    const w = mount(DayList, { props: { days, label: 'Changes' } })
    expect(w.get('[role="region"]').attributes('aria-label')).toBe('Changes')
    expect(w.findAll('[role="heading"]').map((h) => h.text())).toEqual(['Today', 'Tuesday 6 October'])
  })

  it('names each day’s lines by its heading, at the level the host gives', () => {
    const w = mount(DayList, { props: { days, label: 'Changes', level: 2 } })
    const section = w.findAll('section')[1]
    const heading = section.get('[role="heading"]')
    expect(section.attributes('aria-labelledby')).toBe(heading.attributes('id'))
    expect(heading.attributes('aria-level')).toBe('2')
  })

  // Two lists on one page are two instances in one application.
  it('never shares a heading’s id with another list on the page', () => {
    const page = mount(
      defineComponent({ render: () => h('div', [h(DayList, { days, label: 'A' }), h(DayList, { days, label: 'B' })]) }),
    )
    const ids = page.findAll('[role="heading"]').map((el) => el.attributes('id'))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('draws each line as its time, what happened, and where', () => {
    const w = mount(DayList, { props: { days, label: 'Changes' } })
    const first = w.findAll('li')[0].findAll('span').map((s) => s.text())
    expect(first).toEqual(['14:02', 'Anna gave Jānis the role Buyer.', 'People & access'])
  })

  it('draws a line of another kind on a band', () => {
    const w = mount(DayList, { props: { days, label: 'Changes' } })
    expect(w.findAll('li')[1].classes()).toContain('bg-band')
    expect(w.findAll('li')[0].classes()).not.toContain('bg-band')
  })

  it('draws a line richer through the host’s slot', () => {
    const w = mount(DayList, {
      props: { days, label: 'Changes' },
      slots: { line: '<template #line="{ line }"><b>{{ line.key }}</b></template>' },
    })
    expect(w.findAll('b').map((b) => b.text())).toEqual(['a', 'b', 'c'])
  })

  it('offers older lines only when given the words, and asks the host for them', async () => {
    // With a sentence at the end but no words for older lines, nothing is offered.
    const without = mount(DayList, { props: { days, label: 'Changes', note: 'Showing all 3.' } })
    expect(without.find('button').exists()).toBe(false)
    const w = mount(DayList, { props: { days, label: 'Changes', olderLabel: 'Show older', note: 'Showing the newest 3.' } })
    expect(w.text()).toContain('Showing the newest 3.')
    await w.get('button').trigger('click')
    expect(w.emitted('older')).toHaveLength(1)
  })

  it('holds the way to older lines while they are being read', () => {
    const w = mount(DayList, { props: { days, label: 'Changes', olderLabel: 'Show older', olderBusy: true } })
    expect(w.get('button').attributes('disabled')).toBeDefined()
  })

  it('folds by its own width: the place goes under what happened', () => {
    const w = mount(DayList, { props: { days, label: 'Changes' } })
    expect(w.classes()).toContain('@container')
    expect(w.findAll('li')[0].findAll('span')[2].classes()).toContain('@max-[700px]:col-start-2')
  })

  it('shows a visible focus ring on the way to older lines', () => {
    const w = mount(DayList, { props: { days, label: 'Changes', olderLabel: 'Show older' } })
    expect(w.get('button').classes()).toContain('focus-visible:outline-focus')
  })
})
