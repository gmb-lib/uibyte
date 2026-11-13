import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import LanguageMenu from './LanguageMenu.vue'
import Menu from './Menu.vue'
import ScopeMenu from './ScopeMenu.vue'

const options = [
  { key: 'one', label: 'Alpha Works' },
  { key: 'two', label: 'Beta Ķemeri' },
]
const base = { label: 'Place', current: 'one', options }

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

describe('ScopeMenu', () => {
  it('with one option, and it the current one, is plain text: nothing to press, focus or open', () => {
    const w = mount(ScopeMenu, { props: { ...base, options: [options[0]] }, attachTo: document.body })
    expect(w.text()).toBe('Alpha Works')
    expect(w.find('button').exists()).toBe(false)
    expect(w.find('[tabindex]').exists()).toBe(false)
    expect(w.find('[aria-haspopup]').exists()).toBe(false)
    expect(w.find('svg').exists()).toBe(false)
    expect(w.html()).not.toContain('▾')
    expect(w.find('[role]:not([role="group"])').exists()).toBe(false)
    // A reader hears the words under the name the host gave the line.
    expect(w.get('[role="group"]').attributes('aria-label')).toBe('Place')
    expect(w.attributes('data-scope')).toBe('one')
  })

  it('with several options, is a button with the current words that says it opens a list', async () => {
    const w = mount(ScopeMenu, { props: { ...base, current: 'two' }, attachTo: document.body })
    const button = w.get('button')
    expect(button.text()).toContain('Beta Ķemeri')
    expect(button.attributes('aria-haspopup')).toBe('menu')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(w.attributes('data-scope')).toBe('two')

    await open(w)
    expect(button.attributes('aria-expanded')).toBe('true')
    const heading = Array.from(list().querySelectorAll('*')).find((el) => el.textContent === 'Place' && !el.children.length)
    expect(heading).toBeDefined()
    expect(listed().map((el) => el.textContent?.replace('✓', '').trim())).toEqual(['Alpha Works', 'Beta Ķemeri'])
    expect(listed().map((el) => el.getAttribute('aria-checked'))).toEqual(['false', 'true'])
    expect(listed().map((el) => el.querySelector('[aria-hidden="true"]')?.textContent ?? null)).toEqual([null, '✓'])
  })

  it('says which place was chosen when it is another, and nothing when it is the current one', async () => {
    const w = mount(ScopeMenu, { props: base, attachTo: document.body })
    await open(w)
    listed()[1].click()
    await flushPromises()
    expect(w.emitted('select')).toEqual([['two']])

    await open(w)
    listed()[0].click()
    await flushPromises()
    expect(w.emitted('select')).toEqual([['two']])
  })

  // The inner menu does not report a press on the choice already made, so the
  // wrapper's own guard is reached by asking it directly.
  it('emits select only for a key other than the current one, whatever the inner menu reports', async () => {
    const w = mount(ScopeMenu, { props: base, attachTo: document.body })
    const inner = w.findComponent(Menu)
    inner.vm.$emit('update:modelValue', 'one')
    await flushPromises()
    expect(w.emitted('select')).toBeUndefined()

    inner.vm.$emit('update:modelValue', 'two')
    await flushPromises()
    expect(w.emitted('select')).toEqual([['two']])
  })

  it('draws nothing when the current place is not among the options, or there are none', () => {
    const away = mount(ScopeMenu, { props: { ...base, current: 'elsewhere' } })
    expect(away.html()).toBe('<!--v-if-->')
    expect(away.find('[data-scope]').exists()).toBe(false)
    const empty = mount(ScopeMenu, { props: { ...base, options: [] } })
    expect(empty.html()).toBe('<!--v-if-->')
    expect(empty.text()).toBe('')
    const oneOther = mount(ScopeMenu, { props: { ...base, current: 'two', options: [options[0]] } })
    expect(oneOther.html()).toBe('<!--v-if-->')
  })

  it('follows its options: from several to the current one alone, the button becomes plain text', async () => {
    const w = mount(ScopeMenu, { props: base, attachTo: document.body })
    expect(w.find('button').exists()).toBe(true)
    await w.setProps({ options: [options[0]] })
    expect(w.find('button').exists()).toBe(false)
    expect(w.text()).toBe('Alpha Works')
    await w.setProps({ options })
    expect(w.find('button').exists()).toBe(true)
  })

  it('wears what the language menu wears for the same tone and width', () => {
    const scope = mount(ScopeMenu, { props: { ...base, tone: 'console', block: true } })
    const language = mount(LanguageMenu, {
      props: { languages: [{ code: 'en', name: 'English' }, { code: 'lv', name: 'Latviešu' }], modelValue: 'en', label: 'Language', tone: 'console', block: true },
    })
    expect(scope.get('button').classes().sort()).toEqual(language.get('button').classes().sort())
    expect(scope.get('button span[aria-hidden="true"]').classes()).toEqual(language.get('button span[aria-hidden="true"]').classes())
    expect(scope.classes()).toEqual(expect.arrayContaining(['flex', 'w-full']))
    expect(scope.classes()).toEqual(language.get('[role="group"]').classes())
  })

  it('opens upward and lines up as it is told', async () => {
    const w = mount(ScopeMenu, { props: { ...base, side: 'top', align: 'start' }, attachTo: document.body })
    await open(w)
    expect(list().getAttribute('data-side')).toBe('top')
    expect(list().getAttribute('data-align')).toBe('start')
  })
})
