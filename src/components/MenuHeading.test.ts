import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import Menu from './Menu.vue'
import type { MenuItem } from './types'

const items: MenuItem[] = [
  { key: 'a', label: 'First' },
  { key: 'b', label: 'Second' },
  { key: 'c', label: 'Third' },
]

afterEach(() => {
  document.body.innerHTML = ''
})

async function open(w: ReturnType<typeof mount>) {
  ;(w.get('button').element as HTMLElement).focus()
  await w.get('button').trigger('keydown', { key: 'Enter' })
  await flushPromises()
}

const listed = () => Array.from(document.body.querySelectorAll<HTMLElement>('[role^="menuitem"]'))
const list = () => document.body.querySelector('[role="menu"]') as HTMLElement
const keyOn = (el: Element, key: string) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))

// Whatever draws the heading's words: the smallest element holding them.
function headingOf(text: string): HTMLElement | undefined {
  return Array.from(list().querySelectorAll<HTMLElement>('*')).find(
    (el) => el.textContent === text && el.children.length === 0,
  )
}

describe('Menu with a heading', () => {
  it.each([
    ['a choice among options', { modelValue: 'b' }],
    ['a list of acts', {}],
  ])('draws the heading in the opened list, as %s, and not among the choices', async (_name, extra) => {
    const w = mount(Menu, { props: { label: 'Where', heading: 'Places', items, ...extra }, attachTo: document.body })
    await open(w)
    const heading = headingOf('Places')
    expect(heading).toBeDefined()
    expect(list().contains(heading as HTMLElement)).toBe(true)
    expect(listed().map((el) => el.textContent?.replace('✓', '').trim())).toEqual(['First', 'Second', 'Third'])
    // Above the choices, not between or after them.
    const first = listed()[0]
    expect((heading as HTMLElement).compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('names the group of choices for a reader by the heading', async () => {
    for (const extra of [{ modelValue: 'a' }, {}]) {
      const w = mount(Menu, { props: { label: 'Where', heading: 'Places', items, ...extra }, attachTo: document.body })
      await open(w)
      const group = listed()[0].closest('[role="group"]') as HTMLElement
      expect(group).not.toBeNull()
      const named = document.getElementById(group.getAttribute('aria-labelledby') ?? '')
      expect(named?.textContent).toBe('Places')
      expect(named).toBe(headingOf('Places'))
      w.unmount()
      document.body.innerHTML = ''
    }
  })

  it('draws a heading that cannot be focused or pressed, and is no item', async () => {
    const w = mount(Menu, { props: { label: 'Where', heading: 'Places', items, modelValue: 'a' }, attachTo: document.body })
    await open(w)
    const heading = headingOf('Places') as HTMLElement
    expect(heading.hasAttribute('tabindex')).toBe(false)
    expect(heading.tabIndex).toBe(-1)
    expect(heading.getAttribute('role')).toBeNull()
    // What the primitive marks every real item with, and navigates by.
    expect(heading.hasAttribute('data-reka-collection-item')).toBe(false)
    expect(list().querySelectorAll('[data-reka-collection-item]')).toHaveLength(3)
    expect(listed().every((el) => el.hasAttribute('data-reka-collection-item'))).toBe(true)
    expect(listed().includes(heading)).toBe(false)

    heading.click()
    await flushPromises()
    expect(w.emitted('select')).toBeUndefined()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(listed()).toHaveLength(3)
  })

  it('is passed over by the arrow keys, the first and the last choice meeting across it', async () => {
    const w = mount(Menu, { props: { label: 'Where', heading: 'Places', items, modelValue: 'a' }, attachTo: document.body })
    await open(w)
    const heading = headingOf('Places') as HTMLElement
    const seen: Element[] = []
    const landed = () => {
      const now = document.activeElement as HTMLElement
      seen.push(now)
      expect(now).not.toBe(heading)
      expect(now.contains(heading)).toBe(false)
    }
    listed()[0].focus()
    for (const k of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'Home', 'End']) {
      keyOn(document.activeElement ?? list(), k)
      await flushPromises()
      landed()
    }
    // Every stop was one of the choices.
    for (const el of seen) expect(listed()).toContain(el)
  })

  it('holds a headed list under a spread button to the button’s width, and leaves every other list unbounded', async () => {
    const widths = async (props: Record<string, unknown>) => {
      const w = mount(Menu, { props: { label: 'Where', items, ...props }, attachTo: document.body })
      await open(w)
      const classes = [...list().classList]
      w.unmount()
      document.body.innerHTML = ''
      return classes.filter((c) => c.includes('-w-'))
    }
    expect(await widths({ block: true, heading: 'Places' })).toEqual([
      'min-w-[var(--reka-dropdown-menu-trigger-width)]',
      'max-w-[var(--reka-dropdown-menu-trigger-width)]',
    ])
    expect(await widths({ block: true })).toEqual(['min-w-[var(--reka-dropdown-menu-trigger-width)]'])
    expect(await widths({ heading: 'Places' })).toEqual(['min-w-[190px]'])
  })

  it('draws no heading element at all without one, with or without a choice made', async () => {
    for (const extra of [{ modelValue: 'a' }, {}]) {
      const w = mount(Menu, { props: { label: 'Where', items, ...extra }, attachTo: document.body })
      await open(w)
      expect(list().querySelector('[id]')).toBeNull()
      expect(list().querySelector('[aria-labelledby]')).toBeNull()
      expect(list().querySelector('h1,h2,h3,h4,h5,h6,[role="heading"]')).toBeNull()
      // Every child of the list is a choice (or the group holding the choices), none a heading.
      const direct = Array.from(list().children)
      const radio = direct.filter((el) => el.getAttribute('role') === 'group')
      if (extra.modelValue) {
        expect(direct).toHaveLength(1)
        expect(radio).toHaveLength(1)
      } else {
        expect(direct.every((el) => el.getAttribute('role')?.startsWith('menuitem'))).toBe(true)
      }
      w.unmount()
      document.body.innerHTML = ''
    }
  })
})
