import { describe, expect, it } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import BrandMark from './BrandMark.vue'
import MobileDrawer from './MobileDrawer.vue'
import NavIcon from './NavIcon.vue'
import SidebarContent from './SidebarContent.vue'
import { Button, buttonVariants } from './ui/button'
import type { NavItem } from './types'

const items: NavItem[] = [
  { key: 'home', label: 'Home', icon: 'grid', linkProps: { to: { name: 'home' } } },
  { key: 'files', label: 'Files', icon: 'doc', linkProps: { to: { name: 'files' } } },
]

describe('SidebarContent', () => {
  const mountSidebar = (props = {}) =>
    mount(SidebarContent, {
      props: { items, navLabel: 'Primary', linkComponent: RouterLinkStub, ...props },
    })

  it('renders one link per item, with its icon and label', () => {
    const w = mountSidebar()
    expect(w.findAllComponents(RouterLinkStub)).toHaveLength(2)
    expect(w.findAllComponents(NavIcon)).toHaveLength(2)
    expect(w.text()).toContain('Home')
  })

  it('reports which item was chosen, so a drawer can close itself', async () => {
    const w = mountSidebar()
    await w.findAllComponents(RouterLinkStub)[1].trigger('click')
    expect(w.emitted('navigate')?.[0]).toEqual([items[1]])
  })

  it('renders plain anchors when the host supplies no link component', () => {
    const w = mount(SidebarContent, { props: { items, navLabel: 'Primary' } })
    expect(w.findAll('nav a')).toHaveLength(2)
  })

  it('leaves the footer to the host', () => {
    const w = mount(SidebarContent, {
      props: { items, navLabel: 'Primary' },
      slots: { footer: '<span>SESSION</span>' },
    })
    expect(w.text()).toContain('SESSION')
  })
})

function mountSidebarWithBrand(hideBrand: boolean) {
  return mount(SidebarContent, {
    props: { items, navLabel: 'Primary', hideBrand },
    slots: { brand: '<span>MARK</span>' },
  })
}

describe('SidebarContent brand row', () => {
  it('shows the brand slot by default and hides it on request', () => {
    expect(mountSidebarWithBrand(false).text()).toContain('MARK')
    expect(mountSidebarWithBrand(true).text()).not.toContain('MARK')
  })
})

describe('BrandMark', () => {
  it('draws the mark the host gives it, at the size it was told', () => {
    const w = mount(BrandMark, {
      props: { name: 'Product', size: 40 },
      slots: { default: '<span class="glyph">G</span>' },
    })
    expect(w.text()).toContain('G')
    expect(w.text()).toContain('Product')
    expect(w.get('span > span').attributes('style')).toContain('40px')
  })

  it('renders the mark alone when there is no wordmark', () => {
    const w = mount(BrandMark, { slots: { default: '<span>G</span>' } })
    expect(w.text()).toBe('G')
  })

  it('carries no glyph of its own — the mark belongs to the product', () => {
    expect(mount(BrandMark, { props: { name: 'Product' } }).find('svg').exists()).toBe(false)
  })

  it('switches its square between a light and a console surface', () => {
    const onConsole = mount(BrandMark, { props: { tone: 'console' } })
    const onLight = mount(BrandMark, { props: { tone: 'ink' } })
    expect(onConsole.get('span > span').classes()).toContain('bg-console-line')
    expect(onLight.get('span > span').classes()).toContain('bg-ink')
  })
})

describe('NavIcon', () => {
  it('draws a distinct glyph for every name it accepts', () => {
    const names = ['grid', 'doc', 'pen', 'plus', 'shield', 'mail', 'clock', 'people'] as const
    const drawn = names.map((name) => mount(NavIcon, { props: { name } }).html())
    expect(new Set(drawn).size).toBe(names.length)
  })

  it('is hidden from assistive technology — the label beside it carries the meaning', () => {
    expect(mount(NavIcon, { props: { name: 'grid' } }).attributes('aria-hidden')).toBe('true')
  })
})

describe('MobileDrawer', () => {
  it('stays closed until asked, then names itself and its close control', async () => {
    const w = mount(MobileDrawer, {
      props: { title: 'Menu', closeLabel: 'Close', open: false },
      slots: { default: '<span>PANEL</span>' },
      attachTo: document.body,
    })
    expect(document.body.textContent).not.toContain('PANEL')

    await w.setProps({ open: true })
    expect(document.body.textContent).toContain('PANEL')
    expect(document.querySelector('[aria-label="Close"]')).not.toBeNull()
    expect(document.body.textContent).toContain('Menu')

    w.unmount()
  })
})

describe('Button', () => {
  it('is a non-submitting button unless told otherwise', () => {
    expect(mount(Button).attributes('type')).toBe('button')
    expect(mount(Button, { props: { type: 'submit' } }).attributes('type')).toBe('submit')
  })

  it('merges a caller class over its own', () => {
    const w = mount(Button, { props: { class: 'px-8' } })
    expect(w.classes()).toContain('px-8')
    expect(w.classes()).not.toContain('px-4')
  })

  it('keeps the accent variant off the default, so a status colour stays meaningful', () => {
    expect(buttonVariants()).toContain('bg-ink')
    expect(buttonVariants({ variant: 'accent' })).toContain('bg-status-ontrack')
  })

  it('shows a visible focus ring', () => {
    expect(buttonVariants()).toContain('focus-visible:outline-focus')
  })
})
