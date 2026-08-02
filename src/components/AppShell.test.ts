import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import AppShell from './AppShell.vue'
import type { NavItem, ShellLabels } from './types'

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
})
