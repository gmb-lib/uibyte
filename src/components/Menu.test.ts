import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import Menu from './Menu.vue'
import LanguageMenu from './LanguageMenu.vue'
import type { MenuItem } from './types'

const items: MenuItem[] = [
  { key: 'a', label: 'First' },
  { key: 'b', label: 'Second' },
  { key: 'c', label: 'Third', disabled: true },
]

afterEach(() => {
  document.body.innerHTML = ''
})

// A keyboard user opens a menu from its button, so the button has focus first.
async function open(w: ReturnType<typeof mount>) {
  ;(w.get('button').element as HTMLElement).focus()
  await w.get('button').trigger('keydown', { key: 'Enter' })
  await flushPromises()
}

const listed = () => Array.from(document.body.querySelectorAll('[role^="menuitem"]'))

describe('Menu', () => {
  it('is a button that says it opens a menu, closed until asked', () => {
    const w = mount(Menu, { props: { label: 'More', items }, attachTo: document.body })
    const button = w.get('button')
    expect(button.text()).toContain('More')
    expect(button.attributes('aria-haspopup')).toBe('menu')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(listed()).toHaveLength(0)
  })

  // The list opens on the page's body, so no box the button sits in can clip it.
  it('opens its choices on the page’s body, outside the box it sits in', async () => {
    const w = mount(Menu, { props: { label: 'More', items }, attachTo: document.body })
    await open(w)
    expect(w.get('button').attributes('aria-expanded')).toBe('true')
    expect(listed().map((el) => el.textContent?.trim())).toEqual(['First', 'Second', 'Third'])
    expect(w.element.contains(listed()[0])).toBe(false)
  })

  it('tells the host which was picked, and closes', async () => {
    const w = mount(Menu, { props: { label: 'More', items }, attachTo: document.body })
    await open(w)
    ;(listed()[1] as HTMLElement).click()
    await flushPromises()
    expect(w.emitted('select')).toEqual([['b']])
    expect(listed()).toHaveLength(0)
  })

  it('shows one that cannot be picked, and never picks it', async () => {
    const w = mount(Menu, { props: { label: 'More', items }, attachTo: document.body })
    await open(w)
    expect(listed()[2].getAttribute('aria-disabled')).toBe('true')
    ;(listed()[2] as HTMLElement).click()
    await flushPromises()
    expect(w.emitted('select')).toBeUndefined()
  })

  it('closes on Escape and gives focus back to its button', async () => {
    const w = mount(Menu, { props: { label: 'More', items }, attachTo: document.body })
    await open(w)
    const content = document.body.querySelector('[role="menu"]') as HTMLElement
    content.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    // The primitive hands focus back on a timer, after the list has gone.
    await vi.waitFor(() => expect(listed()).toHaveLength(0))
    await vi.waitFor(() => expect(document.activeElement).toBe(w.get('button').element))
  })

  describe('as a choice among options', () => {
    it('says which one is chosen, to the eye and to a reader', async () => {
      const w = mount(Menu, { props: { label: 'Sort', items, modelValue: 'b' }, attachTo: document.body })
      await open(w)
      const checked = listed().map((el) => el.getAttribute('aria-checked'))
      expect(checked).toEqual(['false', 'true', 'false'])
      expect(listed()[1].querySelector('[aria-hidden="true"]')?.textContent).toBe('✓')
      expect(listed()[0].querySelector('[aria-hidden="true"]')).toBeNull()
    })

    it('asks for a new choice, and not for the one already made', async () => {
      const w = mount(Menu, { props: { label: 'Sort', items, modelValue: 'b' }, attachTo: document.body })
      await open(w)
      ;(listed()[1] as HTMLElement).click()
      await flushPromises()
      await open(w)
      ;(listed()[0] as HTMLElement).click()
      await flushPromises()
      expect(w.emitted('update:modelValue')).toEqual([['a']])
      expect(w.emitted('select')).toEqual([['b'], ['a']])
    })
  })

  it('marks words in another language with that language', async () => {
    const w = mount(Menu, { props: { label: 'More', items: [{ key: 'lv', label: 'Latviešu', lang: 'lv' }] }, attachTo: document.body })
    await open(w)
    expect(listed()[0].getAttribute('lang')).toBe('lv')
  })

  it('shows a visible focus ring on its button', () => {
    const w = mount(Menu, { props: { label: 'More', items } })
    expect(w.get('button').classes()).toContain('focus-visible:outline-focus')
  })
})

describe('LanguageMenu', () => {
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'lv', name: 'Latviešu' },
  ]

  it('names the language in use in itself, inside a group that says what it changes', () => {
    const w = mount(LanguageMenu, { props: { languages, modelValue: 'lv', label: 'Valoda' }, attachTo: document.body })
    expect(w.get('[role="group"]').attributes('aria-label')).toBe('Valoda')
    const name = w.get('button span[lang]')
    expect(name.text()).toBe('Latviešu')
    expect(name.attributes('lang')).toBe('lv')
  })

  it('draws the globe beside it, which a reader does not hear', () => {
    const w = mount(LanguageMenu, { props: { languages, modelValue: 'en', label: 'Language' } })
    expect(w.get('button svg').attributes('aria-hidden')).toBe('true')
  })

  it('lists every language in its own name, each marked with its language, the one in use checked', async () => {
    const w = mount(LanguageMenu, { props: { languages, modelValue: 'en', label: 'Language' }, attachTo: document.body })
    await open(w)
    expect(listed().map((el) => [el.textContent?.replace('✓', '').trim(), el.getAttribute('lang'), el.getAttribute('aria-checked')])).toEqual([
      ['English', 'en', 'true'],
      ['Latviešu', 'lv', 'false'],
    ])
  })

  it('tells the host the code of the language chosen', async () => {
    const w = mount(LanguageMenu, { props: { languages, modelValue: 'en', label: 'Language' }, attachTo: document.body })
    await open(w)
    ;(listed()[1] as HTMLElement).click()
    await flushPromises()
    expect(w.emitted('update:modelValue')).toEqual([['lv']])
  })
})
