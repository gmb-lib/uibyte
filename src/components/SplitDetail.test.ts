import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SplitDetail from './SplitDetail.vue'

const slots = {
  list: '<ul><li><a href="#a">Anna</a></li><li><a href="#b" aria-current="true">Jānis</a></li></ul>',
  detail: '<h3>Jānis Liepa</h3>',
}

afterEach(() => {
  document.body.innerHTML = ''
})

const regions = (w: ReturnType<typeof mount>) => (w.element as HTMLElement).querySelector(':scope > div')!.children

describe('SplitDetail', () => {
  it('shows the list alone while nothing is open', () => {
    const w = mount(SplitDetail, { props: { open: false, backLabel: 'Users' }, slots })
    expect(regions(w)).toHaveLength(1)
    expect(w.find('section').exists()).toBe(false)
  })

  it('puts the open item beside the list, in a region named for it', () => {
    const w = mount(SplitDetail, { props: { open: true, backLabel: 'Users', label: 'Jānis Liepa' }, slots })
    expect(regions(w)).toHaveLength(2)
    expect(w.get('section').attributes('aria-label')).toBe('Jānis Liepa')
    expect(w.get('section').text()).toContain('Jānis Liepa')
  })

  // A layout claim the test environment cannot measure, so what makes it is
  // pinned: the component measures itself, and below 760px of its own width the
  // open item replaces the list and the way back appears.
  it('decides by its own width: below it, the open item alone with the way back', () => {
    const w = mount(SplitDetail, { props: { open: true, backLabel: 'Users' }, slots })
    expect(w.classes()).toContain('@container')
    expect(regions(w)[0].classList.contains('@max-[760px]:hidden')).toBe(true)
    expect(w.get('section button').classes()).toContain('@max-[760px]:inline-flex')
    expect(w.get('section button').classes()).toContain('hidden')
  })

  it('keeps the list in view when nothing is open, at any width', () => {
    const w = mount(SplitDetail, { props: { open: false, backLabel: 'Users' }, slots })
    expect(regions(w)[0].classList.contains('@max-[760px]:hidden')).toBe(false)
  })

  it('offers the way back by the list’s name, the arrow not heard, and says when it is taken', async () => {
    const w = mount(SplitDetail, { props: { open: true, backLabel: 'Users' }, slots })
    const back = w.get('section button')
    expect(back.text().replace('‹', '')).toBe('Users')
    expect(back.get('[aria-hidden="true"]').text()).toBe('‹')
    await back.trigger('click')
    expect(w.emitted('back')).toHaveLength(1)
  })

  it('moves focus to the item when it opens and the list is no longer shown', async () => {
    const w = mount(SplitDetail, { props: { open: false, backLabel: 'Users' }, slots, attachTo: document.body })
    ;(regions(w)[0] as HTMLElement).style.display = 'none'
    await w.setProps({ open: true })
    await nextTick()
    expect(document.activeElement).toBe(w.get('section').element)
  })

  it('leaves focus where it is when the item opens beside a list still shown', async () => {
    const w = mount(SplitDetail, { props: { open: false, backLabel: 'Users' }, slots, attachTo: document.body })
    const row = w.get('a').element as HTMLElement
    row.focus()
    await w.setProps({ open: true })
    await nextTick()
    expect(document.activeElement).toBe(row)
  })

  it('returns focus to the current row of the list when the way back is taken', async () => {
    const w = mount(SplitDetail, { props: { open: true, backLabel: 'Users' }, slots, attachTo: document.body })
    await w.get('section button').trigger('click')
    await w.setProps({ open: false })
    await nextTick()
    expect((document.activeElement as HTMLElement).textContent).toBe('Jānis')
  })

  it('shows a visible focus ring on the way back', () => {
    const w = mount(SplitDetail, { props: { open: true, backLabel: 'Users' }, slots })
    expect(w.get('section button').classes()).toContain('focus-visible:outline-focus')
  })
})
