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
const list = () => document.body.querySelector('[role="menu"]') as HTMLElement

// What a reader hears for an item named by its own content: its words, less
// anything hidden from it, run together as a reader runs them.
function heard(el: Element): string {
  const walk = (n: Node): string => {
    if (n.nodeType === Node.TEXT_NODE) return n.textContent ?? ''
    if (n instanceof Element && n.getAttribute('aria-hidden') === 'true') return ''
    return Array.from(n.childNodes).map(walk).join('')
  }
  return walk(el).replace(/\s+/g, ' ').trim()
}

// What a menu called without the newer options draws, written out in full: an
// option added later must leave a menu that does not ask for it exactly as it was.
const plainButton =
  'inline-flex items-center gap-[7px] rounded-pill border border-line bg-surface px-3 py-[5px] text-[12.5px] text-ink hover:border-ink/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'
const plainList =
  'z-50 flex min-w-[190px] flex-col rounded-[12px] border border-line bg-surface p-1.5 shadow-[0_14px_38px_rgba(22,24,27,0.13)]'

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

  // One menu per row draws the same words on every button; what each acts on
  // is what tells them apart for a reader or a voice command.
  describe('with a name of its own', () => {
    it('is named by its words first, then what it acts on — and draws only its words', () => {
      const plain = mount(Menu, { props: { label: 'Move to…', items } })
      const w = mount(Menu, { props: { label: 'Move to…', about: 'notes.txt', items } })
      expect(w.get('button').attributes('aria-label')).toBe('Move to… — notes.txt')
      expect(w.get('button').text()).toBe(plain.get('button').text())
    })

    it('has no name but its words when it is not told what it acts on', () => {
      const w = mount(Menu, { props: { label: 'Move to…', items } })
      expect(w.get('button').attributes('aria-label')).toBeUndefined()
    })
  })

  describe('called without the newer options', () => {
    it('draws its button, its words and its arrow exactly as before', () => {
      const w = mount(Menu, { props: { label: 'More', items } })
      const button = w.get('button')
      expect(button.attributes('class')).toBe(plainButton)
      expect(button.findAll('span').map((s) => s.attributes())).toEqual([{}, { 'aria-hidden': 'true', class: 'text-muted' }])
    })

    it('opens the same light list below it, each item holding its words and its language as before', async () => {
      const w = mount(Menu, {
        props: { label: 'More', items: [{ key: 'a', label: 'First' }, { key: 'lv', label: 'Latviešu', lang: 'lv' }], modelValue: 'a' },
        attachTo: document.body,
      })
      await open(w)
      expect(list().getAttribute('class')).toBe(plainList)
      expect(list().getAttribute('data-side')).toBe('bottom')
      const [chosen, other] = listed()
      expect(other.getAttribute('lang')).toBe('lv')
      expect(other.children).toHaveLength(0)
      expect(other.textContent?.trim()).toBe('Latviešu')
      expect(Array.from(chosen.children).map((el) => el.textContent)).toEqual(['✓'])
    })
  })

  // A menu at the foot of a column has no room below it.
  describe('opening upward', () => {
    it('opens its list above its button when told to', async () => {
      const w = mount(Menu, { props: { label: 'More', items, side: 'top' }, attachTo: document.body })
      await open(w)
      expect(list().getAttribute('data-side')).toBe('top')
    })
  })

  describe('on the dark application menu', () => {
    it('draws its button for the dark surface: no fill of its own, the dark line, light words', () => {
      const w = mount(Menu, { props: { label: 'More', items, tone: 'console' } })
      const button = w.get('button')
      expect(button.classes()).toEqual(
        expect.arrayContaining([
          'border-console-line',
          'bg-transparent',
          'text-console-text',
          'hover:bg-white/[0.07]',
          'data-[state=open]:bg-white/[0.07]',
        ]),
      )
      expect(button.classes()).not.toEqual(expect.arrayContaining(['border-line']))
      expect(button.classes()).not.toEqual(expect.arrayContaining(['bg-surface']))
      expect(button.classes()).not.toEqual(expect.arrayContaining(['text-ink']))
      expect(button.get('span[aria-hidden="true"]').classes()).toEqual(['text-console-muted'])
    })

    // The page's ring colour all but disappears on the dark surface.
    it('shows the focus ring made for the dark surface', () => {
      const w = mount(Menu, { props: { label: 'More', items, tone: 'console' } })
      const classes = w.get('button').classes()
      expect(classes).toContain('focus-visible:outline-console-focus')
      expect(classes).not.toContain('focus-visible:outline-focus')
    })

    it('opens the same light list', async () => {
      const w = mount(Menu, { props: { label: 'More', items, tone: 'console' }, attachTo: document.body })
      await open(w)
      expect(list().getAttribute('class')).toBe(plainList)
    })

    it('is worked from the keyboard as any menu is', async () => {
      const w = mount(Menu, { props: { label: 'More', items, tone: 'console', side: 'top', block: true }, attachTo: document.body })
      await open(w)
      expect(listed()).toHaveLength(3)
      list().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await vi.waitFor(() => expect(listed()).toHaveLength(0))
      await vi.waitFor(() => expect(document.activeElement).toBe(w.get('button').element))
    })
  })

  describe('across the width of its column', () => {
    it('takes the full width, its words the room between whatever leads and the arrow', () => {
      const w = mount(Menu, { props: { label: 'More', items, block: true }, slots: { before: '<i class="lead"></i>' } })
      const button = w.get('button')
      expect(button.classes()).toEqual(expect.arrayContaining(['flex', 'w-full']))
      expect(button.classes()).not.toContain('inline-flex')
      const [words, arrow] = button.findAll('span')
      expect(words.text()).toBe('More')
      expect(words.classes()).toEqual(expect.arrayContaining(['flex-1', 'text-left']))
      expect(arrow.text()).toBe('▾')
    })

    // A spread button is as wide as its column, and its list lines up with it: no
    // floor of its own that would push it past a narrow column's edge.
    it('opens a list as wide as itself, and no wider unless its words need it', async () => {
      const w = mount(Menu, { props: { label: 'More', items, block: true }, attachTo: document.body })
      await open(w)
      expect(list().classList).toContain('min-w-[var(--reka-dropdown-menu-trigger-width)]')
      expect([...list().classList].filter((c) => c.startsWith('min-w-'))).toEqual(['min-w-[var(--reka-dropdown-menu-trigger-width)]'])
    })
  })

  // A note is in the page's language, so it must not be read in the item's.
  describe('with a note after an item’s words', () => {
    const noted: MenuItem[] = [
      { key: 'en', label: 'English', lang: 'en' },
      { key: 'lv', label: 'Latviešu', lang: 'lv', note: 'everyone here' },
    ]

    it('draws the note after the words, small, quiet and in mono', async () => {
      const w = mount(Menu, { props: { label: 'Language', items: noted, modelValue: 'en' }, attachTo: document.body })
      await open(w)
      const item = listed()[1]
      const note = item.lastElementChild as HTMLElement
      expect(note.textContent).toBe('everyone here')
      expect(Array.from(note.classList)).toEqual(expect.arrayContaining(['font-mono', 'text-[11px]', 'text-muted', 'font-normal']))
    })

    it('marks only the words with their language, so the note is read in the page’s', async () => {
      const w = mount(Menu, { props: { label: 'Language', items: noted, modelValue: 'en' }, attachTo: document.body })
      await open(w)
      const item = listed()[1]
      expect(item.hasAttribute('lang')).toBe(false)
      const marked = item.querySelectorAll('[lang]')
      expect(marked).toHaveLength(1)
      expect(marked[0].textContent).toBe('Latviešu')
      expect(marked[0].getAttribute('lang')).toBe('lv')
    })

    it('is heard as part of the item’s name, after its words', async () => {
      const w = mount(Menu, { props: { label: 'Language', items: noted, modelValue: 'lv' }, attachTo: document.body })
      await open(w)
      const item = listed()[1]
      expect(item.getAttribute('aria-label')).toBeNull()
      expect(item.getAttribute('aria-labelledby')).toBeNull()
      expect(heard(item)).toBe('Latviešu everyone here')
      expect(item.getAttribute('aria-checked')).toBe('true')
    })

    it('draws a note on an act as on a choice', async () => {
      const w = mount(Menu, { props: { label: 'Language', items: noted }, attachTo: document.body })
      await open(w)
      const item = listed()[1]
      expect(item.hasAttribute('lang')).toBe(false)
      expect(item.querySelector('[lang]')?.textContent).toBe('Latviešu')
      expect(heard(item)).toBe('Latviešu everyone here')
    })

    it('leaves an item without a note as it was', async () => {
      const w = mount(Menu, { props: { label: 'Language', items: noted }, attachTo: document.body })
      await open(w)
      expect(listed()[0].getAttribute('lang')).toBe('en')
      expect(listed()[0].children).toHaveLength(0)
    })
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

  it('sits inline, on the light surface, opening below, when told nothing more', async () => {
    const w = mount(LanguageMenu, { props: { languages, modelValue: 'en', label: 'Language' }, attachTo: document.body })
    expect(w.get('[role="group"]').attributes('class')).toBe('inline-flex')
    expect(w.get('button').attributes('class')).toBe(plainButton)
    await open(w)
    expect(list().getAttribute('data-side')).toBe('bottom')
  })

  // The language everyone here has, marked so a person can tell their own choice from it.
  it('draws a language’s note after its name, read in the page’s language', async () => {
    const marked = [
      { code: 'en', name: 'English' },
      { code: 'lv', name: 'Latviešu', note: 'everyone here' },
    ]
    const w = mount(LanguageMenu, { props: { languages: marked, modelValue: 'en', label: 'Language' }, attachTo: document.body })
    await open(w)
    const item = listed()[1]
    expect(heard(item)).toBe('Latviešu everyone here')
    expect(item.hasAttribute('lang')).toBe(false)
    expect(item.querySelector('[lang]')?.textContent).toBe('Latviešu')
    expect(listed()[0].getAttribute('lang')).toBe('en')
  })

  it('opens upward, toned for the dark menu, when its host says so', async () => {
    const w = mount(LanguageMenu, {
      props: { languages, modelValue: 'en', label: 'Language', side: 'top', tone: 'console' },
      attachTo: document.body,
    })
    expect(w.get('button').classes()).toEqual(expect.arrayContaining(['bg-transparent', 'focus-visible:outline-console-focus']))
    await open(w)
    expect(list().getAttribute('data-side')).toBe('top')
  })

  it('spans its column, group and button alike, when told to', () => {
    const w = mount(LanguageMenu, { props: { languages, modelValue: 'en', label: 'Language', block: true } })
    const group = w.get('[role="group"]')
    expect(group.classes()).toEqual(expect.arrayContaining(['flex', 'w-full']))
    expect(group.classes()).not.toContain('inline-flex')
    expect(w.get('button').classes()).toContain('w-full')
  })
})
