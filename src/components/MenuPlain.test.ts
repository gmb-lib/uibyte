import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import Menu from './Menu.vue'

afterEach(() => {
  document.body.innerHTML = ''
})

const items = [
  { key: 'a', label: 'First' },
  { key: 'b', label: 'Second', disabled: true },
  { key: 'lv', label: 'Latviešu', lang: 'lv', note: 'everyone' },
]

async function opened(extra: Record<string, unknown>): Promise<string> {
  const w = mount(Menu, { props: { label: 'More', items, ...extra }, attachTo: document.body })
  ;(w.get('button').element as HTMLElement).focus()
  await w.get('button').trigger('keydown', { key: 'Enter' })
  await flushPromises()
  const html = (document.body.querySelector('[role="menu"]') as HTMLElement).outerHTML
  w.unmount()
  return html
}

// Every generated id is masked: a menu draws one more of them than it used to, so the numbers after it move.
const masked = (html: string) => html.replace(/v-\d+/g, 'v-N')

// What changes for a menu given no heading, and nothing else: an empty placeholder comment first in the
// list, and the choice group's `aria-labelledby`, which named no element, no longer drawn. Both are taken
// out of today's markup here so the rest is compared as it was.
const withoutTheDocumentedChanges = (html: string) =>
  masked(html)
    .replace(/(role="menu"[^>]*>)<!--v-if-->/, '$1')
    .replace(/ aria-labelledby="reka-menu-group-v-N"/, '')

const content =
  'data-dismissable-layer="" style="--reka-dropdown-menu-content-transform-origin: var(--reka-popper-transform-origin); --reka-dropdown-menu-content-available-width: var(--reka-popper-available-width); --reka-dropdown-menu-content-available-height: var(--reka-popper-available-height); --reka-dropdown-menu-trigger-width: var(--reka-popper-anchor-width); --reka-dropdown-menu-trigger-height: var(--reka-popper-anchor-height); outline: none; pointer-events: auto;" tabindex="-1" id="reka-dropdown-menu-content-v-N" aria-labelledby="reka-dropdown-menu-trigger-v-N" class="z-50 flex min-w-[190px] flex-col rounded-[12px] border border-line bg-surface p-1.5 shadow-[0_14px_38px_rgba(22,24,27,0.13)]" data-orientation="vertical" role="menu" aria-orientation="vertical" data-reka-menu-content="" data-state="open" data-side="bottom" data-align="end" dir="ltr"'
const item =
  'flex cursor-pointer select-none items-center justify-between gap-3 rounded-[8px] px-2.5 py-[7px] text-[13px] text-ink outline-none data-[highlighted]:bg-band focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus data-[disabled]:cursor-not-allowed data-[disabled]:text-muted'
const note =
  '<span lang="lv">Latviešu</span> <span class="ml-auto whitespace-nowrap pl-2.5 font-mono text-[11px] font-normal text-muted">everyone</span>'

// The opened list of a menu with no heading, as the version before the heading was added drew it.
const choiceBefore = `<div ${content}><div role="group" aria-labelledby="reka-menu-group-v-N"><div data-reka-collection-item="" role="menuitemradio" tabindex="-1" aria-checked="true" data-state="checked" class="${item} bg-band font-semibold" data-highlighted="">First <span aria-hidden="true" class="text-status-ontrack-fg">✓</span></div><div data-reka-collection-item="" role="menuitemradio" tabindex="-1" aria-checked="false" data-state="unchecked" class="${item}" aria-disabled="true" data-disabled="">Second <!--v-if--></div><div data-reka-collection-item="" role="menuitemradio" tabindex="-1" aria-checked="false" data-state="unchecked" class="${item}">${note}<!--v-if--></div></div></div>`
const actsBefore = `<div ${content}><div data-reka-collection-item="" role="menuitem" tabindex="-1" class="${item}" data-highlighted="">First</div><div data-reka-collection-item="" role="menuitem" tabindex="-1" class="${item}" aria-disabled="true" data-disabled="">Second</div><div data-reka-collection-item="" role="menuitem" tabindex="-1" class="${item}">${note}</div></div>`

describe('Menu given no heading', () => {
  it('opens a list of choices whose markup is the markup it drew before headings existed', async () => {
    expect(withoutTheDocumentedChanges(await opened({ modelValue: 'a' }))).toBe(masked(choiceBefore).replace(/ aria-labelledby="reka-menu-group-v-N"/, ''))
  })

  it('opens a list of acts whose markup is the markup it drew before headings existed', async () => {
    expect(withoutTheDocumentedChanges(await opened({}))).toBe(masked(actsBefore))
  })

  it('draws the placeholder comment and no group label, and nothing else is new', async () => {
    const choice = masked(await opened({ modelValue: 'a' }))
    expect(choice).toContain('dir="ltr"><!--v-if--><div role="group">')
    expect(choice).not.toContain('reka-menu-group')
    expect(masked(await opened({}))).toContain('dir="ltr"><!--v-if--><div data-reka-collection-item')
  })
})
