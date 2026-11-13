import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import AppShell from './AppShell.vue'
import type { NavItem, ShellLabels } from './types'

const items: NavItem[] = [
  { key: 'home', label: 'Home', icon: 'grid', linkProps: { to: { name: 'home' } } },
  { key: 'files', label: 'Files', icon: 'doc', linkProps: { to: { name: 'files' } } },
]
const labels: ShellLabels = {
  skipToContent: 'Skip',
  openMenu: 'Open menu',
  menu: 'Menu',
  close: 'Close',
  primaryNav: 'Primary',
  section: 'Workspace',
}

afterEach(() => {
  document.body.innerHTML = ''
})

const mountShell = (slots: Record<string, unknown>) =>
  mount(AppShell, {
    props: { items, labels, linkComponent: RouterLinkStub },
    slots: { brand: '<span>BRAND</span>', 'sidebar-footer': '<span>FOOT</span>', default: '<p>page</p>', ...slots },
    attachTo: document.body,
  })

// The drawer's code is fetched on first open, so the dialog arrives a moment after the press.
async function openDrawer(w: ReturnType<typeof mountShell>): Promise<HTMLElement> {
  await w.get('button[aria-label="Open menu"]').trigger('click')
  await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull(), { timeout: 5000 })
  await flushPromises()
  return document.querySelector('[role="dialog"]') as HTMLElement
}

const before = (a: Node, b: Node) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
const squeeze = (html: string) => html.replace(/\s+/g, ' ').trim()

// The sidebar this frame drew before the slot existed, taken from that version's
// own output for these props and slots and written out here.
const sidebarBefore = `<aside class="sticky top-0 hidden h-screen w-[250px] shrink-0 bg-console text-console-text lg:flex">
  <div class="flex h-full w-full flex-col px-3.5 pb-[18px] pt-[18px]">
    <div class="pb-3"><span>BRAND</span></div>
    <nav class="flex flex-col gap-[3px]" aria-label="Primary">
      <p class="pb-2 font-mono text-[10px] font-medium uppercase leading-none tracking-[0.12em] text-muted-strong">Workspace</p>
      <!-- A placeholder link: no href, so it navigates nowhere and stays
               out of the tab order, while assistive technology still reads it
               and hears it is unavailable. --><a class="flex items-center gap-[11px] rounded-[9px] px-3 py-2.5 text-sm font-medium text-console-muted hover:bg-white/[0.07] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-console-focus" active-class="bg-white/[0.07] !text-white"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
          <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
          <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
          <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
        </svg><span class="min-w-0 flex-1 truncate">Home</span>
        <!--v-if-->
      </a>
      <!-- A placeholder link: no href, so it navigates nowhere and stays
               out of the tab order, while assistive technology still reads it
               and hears it is unavailable. --><a class="flex items-center gap-[11px] rounded-[9px] px-3 py-2.5 text-sm font-medium text-console-muted hover:bg-white/[0.07] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-console-focus" active-class="bg-white/[0.07] !text-white"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
          <path d="M14 3v5h5" stroke-linejoin="round"></path>
          <path d="M7 3h7l5 5v13H5V5a2 2 0 0 1 2-2z" stroke-linejoin="round"></path>
        </svg><span class="min-w-0 flex-1 truncate">Files</span>
        <!--v-if-->
      </a>
    </nav>
    <div class="mt-auto flex flex-col gap-3 pt-5"><span>FOOT</span></div>
  </div>
</aside>`

describe('AppShell, sidebar-top', () => {
  it('draws it in the sidebar after the brand and before the navigation', () => {
    const w = mountShell({ 'sidebar-top': '<span id="top">TOP</span>' })
    const aside = w.get('aside').element
    const top = aside.querySelector('#top') as Element
    expect(top).not.toBeNull()
    expect(before(aside.querySelector('span') as Element, top)).toBe(true)
    expect(aside.textContent).toContain('BRAND')
    expect(before(top, aside.querySelector('nav') as Element)).toBe(true)
    expect(aside.textContent?.indexOf('BRAND')).toBeLessThan(aside.textContent?.indexOf('TOP') ?? -1)
    expect(aside.textContent?.indexOf('TOP')).toBeLessThan(aside.textContent?.indexOf('Home') ?? -1)
  })

  it('draws it in the opened drawer in the same place: under the brand, above the navigation', async () => {
    const w = mountShell({ 'sidebar-top': '<span id="top-drawer">TOP</span>', 'brand-drawer': '<span id="brand-drawer">BRAND</span>' })
    const dialog = await openDrawer(w)
    const brand = dialog.querySelector('#brand-drawer') as Element
    const top = dialog.querySelector('#top-drawer') as Element
    const nav = dialog.querySelector('nav') as Element
    expect(top).not.toBeNull()
    expect(before(brand, top)).toBe(true)
    expect(before(top, nav)).toBe(true)
  })

  // A slot whose content renders nothing (a place line with no places) must not leave a padded box.
  it('hides its box, in the sidebar and in the drawer, when what fills it renders nothing', async () => {
    const w = mountShell({ 'sidebar-top': '<span id="top-sidebar">TOP</span>' })
    const box = w.get('aside #top-sidebar').element.parentElement as HTMLElement
    expect(box.classList).toContain('empty:hidden')
    // A box with nothing in it is what the class hides; a comment is nothing.
    const nothing = mountShell({ 'sidebar-top': () => null })
    expect(nothing.find('aside .empty\\:hidden').exists()).toBe(true)
    expect((nothing.get('aside .empty\\:hidden').element as HTMLElement).textContent).toBe('')

    const drawer = await openDrawer(w)
    const inDrawer = drawer.querySelector('#top-sidebar')?.parentElement as HTMLElement
    expect(inDrawer.classList).toContain('empty:hidden')
    expect(inDrawer.classList).toContain('pb-3')
  })

  it('leaves the sidebar exactly as it was drawn before, when nothing fills it (written out from that version’s output)', () => {
    const w = mountShell({})
    expect(squeeze(w.get('aside').html())).toBe(squeeze(sidebarBefore))
  })

  it('draws no wrapper and no space of its own in the drawer either when nothing fills it', async () => {
    const w = mountShell({ 'brand-drawer': '<span id="brand-drawer">BRAND</span>' })
    const dialog = await openDrawer(w)
    const content = (dialog.querySelector('nav') as Element).parentElement as HTMLElement
    // The navigation is the first thing in the drawer's content.
    expect(content.firstElementChild?.tagName).toBe('NAV')
  })
})
