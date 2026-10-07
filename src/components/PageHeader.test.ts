import { describe, expect, it } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import PageHeader from './PageHeader.vue'

describe('PageHeader', () => {
  it('says the title once, as the page heading', () => {
    const w = mount(PageHeader, { props: { title: 'Settings' } })
    const headings = w.findAll('h1, h2, h3, h4, h5, h6')
    expect(headings).toHaveLength(1)
    expect(headings[0].element.tagName).toBe('H1')
    expect(headings[0].text()).toBe('Settings')
  })

  it('takes a lower level when it sits inside another page, and draws smaller', () => {
    const top = mount(PageHeader, { props: { title: 'Settings' } })
    const inner = mount(PageHeader, { props: { title: 'One role', level: 2 } })
    expect(inner.find('h1').exists()).toBe(false)
    expect(inner.get('h2').text()).toBe('One role')
    expect(top.get('h1').classes()).toContain('text-[26px]')
    expect(inner.get('h2').classes()).toContain('text-[22px]')
  })

  it('draws the area and the quiet line when given them, in that order around the title', () => {
    const w = mount(PageHeader, { props: { title: 'Settings', eyebrow: 'Workspace', subtitle: '18 people' } })
    expect(w.text()).toBe('WorkspaceSettings18 people')
  })

  it('draws nothing it was not given — no empty lines, no words of its own', () => {
    const w = mount(PageHeader, { props: { title: 'Settings' } })
    expect(w.findAll('p')).toHaveLength(0)
    expect(w.find('a').exists()).toBe(false)
    expect(w.text()).toBe('Settings')
  })

  // A reader hears the destination, not "leftwards arrow".
  it('offers one way back by its destination’s name, the arrow drawn but not heard', () => {
    const w = mount(PageHeader, {
      props: { title: 'One item', back: { label: 'Items', linkProps: { to: { name: 'items' } } }, linkComponent: RouterLinkStub },
    })
    const link = w.getComponent(RouterLinkStub)
    expect(link.props('to')).toEqual({ name: 'items' })
    const arrow = link.get('[aria-hidden="true"]')
    expect(arrow.text()).toBe('←')
    expect(link.text().replace(arrow.text(), '')).toBe('Items')
  })

  it('puts the way back before the title, so it is met first', () => {
    const w = mount(PageHeader, { props: { title: 'One item', back: { label: 'Items', linkProps: { href: '/items' } } } })
    const order = Array.from((w.element as HTMLElement).querySelectorAll('a, h1')).map((el) => el.tagName)
    expect(order).toEqual(['A', 'H1'])
  })

  it('falls back to a plain anchor when the host gives no link component', () => {
    const w = mount(PageHeader, { props: { title: 'One item', back: { label: 'Items', linkProps: { href: '/items' } } } })
    expect(w.get('a').attributes('href')).toBe('/items')
  })

  it('shows a visible focus ring on the way back', () => {
    const w = mount(PageHeader, { props: { title: 'One item', back: { label: 'Items', linkProps: { href: '/items' } } } })
    expect(w.get('a').classes()).toContain('focus-visible:outline-focus')
  })

  it('puts the page’s actions in a group of their own after the title', () => {
    const w = mount(PageHeader, {
      props: { title: 'Settings' },
      slots: { actions: '<button>Add</button>' },
    })
    const blocks = w.get('header').element.children
    expect(blocks).toHaveLength(2)
    expect(blocks[1].textContent).toBe('Add')
    expect(w.findAll('button')).toHaveLength(1)
  })

  it('leaves no empty group where there are no actions', () => {
    const w = mount(PageHeader, { props: { title: 'Settings' } })
    expect(w.get('header').element.children).toHaveLength(1)
  })

  // The actions give way, never the title: the row wraps, and the title keeps a
  // basis wide enough to be read before anything sits beside it. A layout claim
  // the test environment cannot measure, so the classes that make it are pinned.
  it('wraps the actions under the title rather than squeezing it', () => {
    const w = mount(PageHeader, { props: { title: 'Settings' }, slots: { actions: '<button>Add</button>' } })
    expect(w.get('header').classes()).toContain('flex-wrap')
    expect(w.get('header > div').classes()).toContain('flex-[1_1_18rem]')
  })
})
