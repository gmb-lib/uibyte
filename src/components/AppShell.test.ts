import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import AppShell from './AppShell.vue'
import type { NavGroup, NavItem, ShellLabels } from './types'

const items: NavItem[] = [
  { key: 'home', label: 'Home', icon: 'grid', linkProps: { to: { name: 'home' } } },
  { key: 'files', label: 'Files', icon: 'doc', linkProps: { to: { name: 'files' } } },
  { key: 'people', label: 'People', icon: 'people', linkProps: { to: { name: 'people' } } },
]

const labels: ShellLabels = {
  skipToContent: 'Skip to main content',
  openMenu: 'Open menu',
  menu: 'Menu',
  close: 'Close',
  primaryNav: 'Primary',
  section: 'Workspace',
}

const mountShell = () =>
  mount(AppShell, {
    props: { items, labels, linkComponent: RouterLinkStub },
    slots: { default: '<p>page</p>' },
  })

describe('AppShell', () => {
  it('exposes a skip-to-content link targeting the main landmark', () => {
    const w = mountShell()
    expect(w.get('a[href="#main"]').text()).toBe('Skip to main content')

    const main = w.get('main')
    expect(main.attributes('id')).toBe('main')
    expect(main.attributes('tabindex')).toBe('-1')
  })

  it('renders a mobile bottom tab bar with every navigation item', () => {
    const w = mountShell()
    const bottom = w.get('[data-testid="bottom-nav"]')
    expect(bottom.findAllComponents(RouterLinkStub)).toHaveLength(items.length)
  })

  it('provides a labelled drawer trigger but does not mount the drawer until opened', () => {
    const w = mountShell()
    expect(w.find('button[aria-label="Open menu"]').exists()).toBe(true)
    // The drawer is lazy — absent, along with its close control, before first open.
    expect(w.find('[aria-label="Close"]').exists()).toBe(false)
  })

  it('renders the page content it is given', () => {
    expect(mountShell().get('main').text()).toBe('page')
  })

  // The whole point of the extraction: the frame takes its destinations and its
  // words from the host, and reaches for no router, store or translator itself.
  it('takes every destination and every word from its props', () => {
    const w = mountShell()
    const text = w.text()
    for (const item of items) expect(text).toContain(item.label)
    expect(text).toContain('Workspace')
    expect(w.get('nav[aria-label="Primary"]')).toBeTruthy()
  })

  it('hands link props straight to the link component', () => {
    const w = mountShell()
    const first = w.findAllComponents(RouterLinkStub)[0]
    expect(first.props('to')).toEqual({ name: 'home' })
  })

  it('reports a navigation to the host', async () => {
    const w = mountShell()
    await w.findAllComponents(RouterLinkStub)[0].trigger('click')
    expect(w.emitted('navigate')?.[0]).toEqual([items[0]])
  })

  it('renders the brand and action slots the host supplies', () => {
    const w = mount(AppShell, {
      props: { items, labels, linkComponent: RouterLinkStub },
      slots: {
        brand: '<span>BRAND</span>',
        'topbar-actions': '<button>New</button>',
        'sidebar-footer': '<span>FOOTER</span>',
      },
    })
    expect(w.text()).toContain('BRAND')
    expect(w.text()).toContain('FOOTER')
    expect(w.get('header button:last-of-type').text()).toBe('New')
  })

  it('renders sidebar-extra content between the navigation and the footer', () => {
    const w = mount(AppShell, {
      props: { items, labels, linkComponent: RouterLinkStub },
      slots: { 'sidebar-extra': '<span>EXTRA</span>', 'sidebar-footer': '<span>FOOTER</span>' },
    })
    const aside = w.get('aside').text()
    expect(aside.indexOf('EXTRA')).toBeGreaterThan(-1)
    expect(aside.indexOf('EXTRA')).toBeLessThan(aside.indexOf('FOOTER'))
  })
})

describe('AppShell grouped navigation', () => {
  const groups: NavGroup[] = [
    { key: 'work', label: 'Work', items: [items[0], items[1]] },
    { key: 'registers', label: 'Registers', items: [items[2]] },
  ]

  const mountGrouped = () =>
    mount(AppShell, {
      props: { groups, labels, linkComponent: RouterLinkStub },
    })

  it('renders every group label and every item', () => {
    const w = mountGrouped()
    const text = w.text()
    expect(text).toContain('Work')
    expect(text).toContain('Registers')
    for (const item of items) expect(text).toContain(item.label)
  })

  it('keeps one navigation landmark and flattens groups into the bottom bar', () => {
    const w = mountGrouped()
    expect(w.get('aside nav').attributes('aria-label')).toBe('Primary')
    const bottom = w.get('[data-testid="bottom-nav"]')
    expect(bottom.findAllComponents(RouterLinkStub)).toHaveLength(3)
  })
})

describe('AppShell locked items', () => {
  const withLocked: NavItem[] = [
    items[0],
    { key: 'admin', label: 'Catalogue', icon: 'shield', locked: true, tag: 'ADMIN' },
  ]
  const lockedLabels: ShellLabels = { ...labels, locked: 'not available' }

  const mountLocked = () =>
    mount(AppShell, {
      props: { items: withLocked, labels: lockedLabels, linkComponent: RouterLinkStub },
    })

  it('shows a locked item, dimmed and marked, instead of hiding it', () => {
    const w = mountLocked()
    const locked = w.get('aside a[aria-disabled="true"]')
    expect(locked.text()).toContain('Catalogue')
    expect(locked.text()).toContain('ADMIN')
    expect(locked.text()).toContain('not available')
  })

  it('gives a locked item no navigation anywhere it is drawn', async () => {
    const w = mountLocked()
    // Sidebar and bottom bar each render one real link and one placeholder.
    expect(w.findAllComponents(RouterLinkStub)).toHaveLength(2)
    for (const el of w.findAll('a[aria-disabled="true"]')) {
      expect(el.attributes('href')).toBeUndefined()
      await el.trigger('click')
    }
    expect(w.emitted('navigate')).toBeUndefined()
  })
})
