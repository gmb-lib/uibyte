import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SuggestField from './SuggestField.vue'
import type { SuggestMatch } from './types'

const matches: SuggestMatch[] = [
  { id: 'm-1', label: 'Steel plate', hint: 'Grade S235, 10 mm' },
  { id: 'm-2', label: 'Steel pipe' },
  { id: 'm-3', label: 'Steel beam', hint: 'Grade S355' },
]

function make(props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  return mount(SuggestField, {
    props: { modelValue: '', matches, label: 'Name', ...props },
    slots,
    attachTo: document.body,
  })
}

/** A box that holds what it is given, as a host's `v-model` would. */
async function typeInto(w: ReturnType<typeof make>, text: string) {
  await w.get('input').setValue(text)
  await w.setProps({ modelValue: text })
}

async function reach(w: ReturnType<typeof make>, text = 'ste') {
  await w.get('input').trigger('focus')
  await typeInto(w, text)
}

const options = (w: ReturnType<typeof make>) => w.findAll('[role="option"]')
const key = (w: ReturnType<typeof make>, k: string) => w.get('input').trigger('keydown', { key: k })

describe('SuggestField — the typed text', () => {
  it('hands back what is typed, letter by letter, and a match never replaces it', async () => {
    const w = make({ matches })
    const box = w.get('input')
    await box.trigger('focus')
    for (const text of ['s', 'st', 'ste']) {
      await box.setValue(text)
      await w.setProps({ modelValue: text })
    }
    expect(w.emitted('update:modelValue')).toEqual([['s'], ['st'], ['ste']])
    expect((box.element as HTMLInputElement).value).toBe('ste')
    // The matches arriving, shown and moved through, change nothing in the box.
    await key(w, 'ArrowDown')
    expect((box.element as HTMLInputElement).value).toBe('ste')
    expect(w.emitted('update:modelValue')).toHaveLength(3)
  })

  it('follows the value when the host changes it', async () => {
    const w = make({ modelValue: 'a' })
    await w.setProps({ modelValue: 'b' })
    expect((w.get('input').element as HTMLInputElement).value).toBe('b')
  })
})

describe('SuggestField — the list', () => {
  it('shows only with focus, a value and matches', async () => {
    const w = make()
    // no focus, no value
    expect(w.find('[role="listbox"]').exists()).toBe(false)
    // focus, empty value
    await w.get('input').trigger('focus')
    expect(w.find('[role="listbox"]').exists()).toBe(false)
    // focus, value, matches
    await typeInto(w, 'ste')
    expect(w.find('[role="listbox"]').exists()).toBe(true)
    // focus, value, no matches
    await w.setProps({ matches: [] })
    expect(w.find('[role="listbox"]').exists()).toBe(false)
    // value and matches, no focus
    await w.setProps({ matches })
    await w.get('input').trigger('blur')
    expect(w.find('[role="listbox"]').exists()).toBe(false)
  })

  it('draws each label with its hint under it, in the order given, and does not filter', async () => {
    const w = make()
    await reach(w, 'zzz')
    expect(options(w).map((o) => o.text())).toEqual([
      'Steel plate Grade S235, 10 mm',
      'Steel pipe',
      'Steel beam Grade S355',
    ])
    expect(options(w)[0]!.find('small').text()).toBe('Grade S235, 10 mm')
    expect(options(w)[1]!.find('small').exists()).toBe(false)
  })

  it('is in the page flow, not a floating layer', async () => {
    const w = make()
    await reach(w)
    let el: HTMLElement | null = w.get('[role="listbox"]').element as HTMLElement
    while (el && el !== w.element) {
      expect(el.className).not.toMatch(/\b(absolute|fixed)\b/)
      el = el.parentElement
    }
  })

  it('draws the footer slot under the list, only while the list is shown', async () => {
    const w = make({}, { footer: 'Keep typing to use your own text' })
    expect(w.text()).not.toContain('Keep typing')
    await reach(w)
    const list = w.get('[role="listbox"]').element
    const footer = w.findAll('p').find((p) => p.text() === 'Keep typing to use your own text')!
    expect(footer).toBeTruthy()
    expect(list.compareDocumentPosition(footer.element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // Said, not chosen: outside the listbox.
    expect(list.contains(footer.element)).toBe(false)
  })

  it('closes on blur', async () => {
    const w = make()
    await reach(w)
    await w.get('input').trigger('blur')
    expect(w.find('[role="listbox"]').exists()).toBe(false)
  })

  it('reopens when typing goes on after Escape', async () => {
    const w = make()
    await reach(w)
    await key(w, 'Escape')
    expect(w.find('[role="listbox"]').exists()).toBe(false)
    await typeInto(w, 'stee')
    expect(w.find('[role="listbox"]').exists()).toBe(true)
  })
})

describe('SuggestField — the keyboard', () => {
  it('moves a highlight with the arrows, none at first, and aria-activedescendant follows', async () => {
    const w = make()
    await reach(w)
    const box = w.get('input')
    expect(box.attributes('aria-activedescendant')).toBeUndefined()
    expect(options(w).some((o) => o.attributes('aria-selected') === 'true')).toBe(false)

    await key(w, 'ArrowDown')
    expect(box.attributes('aria-activedescendant')).toBe(options(w)[0]!.attributes('id'))
    expect(options(w)[0]!.attributes('aria-selected')).toBe('true')
    expect(options(w)[1]!.attributes('aria-selected')).toBe('false')

    await key(w, 'ArrowDown')
    expect(box.attributes('aria-activedescendant')).toBe(options(w)[1]!.attributes('id'))
    await key(w, 'ArrowUp')
    expect(box.attributes('aria-activedescendant')).toBe(options(w)[0]!.attributes('id'))
    // Past the first goes round to the last.
    await key(w, 'ArrowUp')
    expect(box.attributes('aria-activedescendant')).toBe(options(w)[2]!.attributes('id'))
  })

  it('takes the highlighted match on Enter: emits it, closes the list, leaves the value', async () => {
    const w = make()
    await reach(w)
    await key(w, 'ArrowDown')
    await key(w, 'ArrowDown')
    await key(w, 'Enter')
    expect(w.emitted('take')).toEqual([[matches[1]]])
    expect(w.find('[role="listbox"]').exists()).toBe(false)
    expect((w.get('input').element as HTMLInputElement).value).toBe('ste')
    expect(w.emitted('update:modelValue')).toHaveLength(1)
  })

  it('does nothing to the list on Enter when none is highlighted, and does not block the form', async () => {
    const w = make()
    await reach(w)
    const ev = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true, bubbles: true })
    w.get('input').element.dispatchEvent(ev)
    await w.vm.$nextTick()
    expect(w.emitted('take')).toBeUndefined()
    expect(ev.defaultPrevented).toBe(false)
    expect(w.find('[role="listbox"]').exists()).toBe(true)
  })

  it('closes on Escape and keeps the text and the focus', async () => {
    const w = make()
    const box = w.get('input')
    ;(box.element as HTMLInputElement).focus()
    await reach(w)
    await key(w, 'Escape')
    expect(w.find('[role="listbox"]').exists()).toBe(false)
    expect((box.element as HTMLInputElement).value).toBe('ste')
    expect(document.activeElement).toBe(box.element)
    expect(w.emitted('take')).toBeUndefined()
  })

  it('does not take anything on Tab', async () => {
    const w = make()
    await reach(w)
    await key(w, 'ArrowDown')
    const ev = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true, bubbles: true })
    w.get('input').element.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(false)
    expect(w.emitted('take')).toBeUndefined()
  })

  it('starts again with none highlighted when more is typed', async () => {
    const w = make()
    await reach(w)
    await key(w, 'ArrowDown')
    await typeInto(w, 'stee')
    expect(w.get('input').attributes('aria-activedescendant')).toBeUndefined()
  })
})

describe('SuggestField — pressing a match', () => {
  it('emits take with the match and closes the list', async () => {
    const w = make()
    await reach(w)
    await options(w)[2]!.trigger('click')
    expect(w.emitted('take')).toEqual([[matches[2]]])
    expect(w.find('[role="listbox"]').exists()).toBe(false)
    expect(w.emitted('update:modelValue')).toHaveLength(1)
  })

  it('does not take the focus from the box when pressed', async () => {
    const w = make()
    await reach(w)
    const ev = new MouseEvent('mousedown', { cancelable: true, bubbles: true })
    options(w)[0]!.element.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
  })
})

describe('SuggestField — a combobox with a listbox', () => {
  it('says so, closed and open', async () => {
    const w = make()
    const box = w.get('input')
    expect(box.attributes('role')).toBe('combobox')
    expect(box.attributes('aria-autocomplete')).toBe('list')
    expect(box.attributes('aria-expanded')).toBe('false')
    expect(box.attributes('aria-controls')).toBeUndefined()

    await reach(w)
    expect(box.attributes('role')).toBe('combobox')
    expect(box.attributes('aria-autocomplete')).toBe('list')
    expect(box.attributes('aria-expanded')).toBe('true')
    expect(box.attributes('aria-controls')).toBe(w.get('[role="listbox"]').attributes('id'))
    expect(options(w)).toHaveLength(3)
  })

  it('is named by its visible label, or by aria-label when the host hides it', async () => {
    const w = make({ label: 'Name' })
    const box = w.get('input')
    expect(w.get('label').text()).toBe('Name')
    expect(w.get('label').attributes('for')).toBe(box.attributes('id'))
    expect(box.attributes('aria-label')).toBeUndefined()

    const hidden = make({ label: undefined, ariaLabel: 'Row name' })
    expect(hidden.find('label').exists()).toBe(false)
    expect(hidden.get('input').attributes('aria-label')).toBe('Row name')
  })
})

describe('SuggestField — a fixed leading part', () => {
  it('shows the fixed text at the start, outside the value', async () => {
    const w = make({ fixed: 'Steel plate S235', modelValue: ' extra' })
    const fixed = w.get('[data-fixed]')
    expect(fixed.text()).toBe('Steel plate S235')
    expect((w.get('input').element as HTMLInputElement).value).toBe(' extra')
    expect(fixed.element.className).toContain('bg-band')
    expect(w.get('input').attributes('aria-describedby')).toContain(fixed.attributes('id'))
    // Typing still hands back only what is added.
    await w.get('input').setValue(' extra!')
    expect(w.emitted('update:modelValue')).toEqual([[' extra!']])
  })

  it('shows no match, even with a value, matches and focus', async () => {
    const w = make({ fixed: 'Steel plate', modelValue: 'x' })
    await w.get('input').trigger('focus')
    expect(w.find('[role="listbox"]').exists()).toBe(false)
    expect(w.get('input').attributes('aria-expanded')).toBe('false')
  })

  it('has no fixed part when none is given', () => {
    expect(make().find('[data-fixed]').exists()).toBe(false)
  })

  it('emits release-fixed with the text on Backspace at the start, and changes nothing itself', async () => {
    const w = make({ fixed: 'Steel plate', modelValue: 'abc' })
    const box = w.get('input')
    const el = box.element as HTMLInputElement
    el.setSelectionRange(0, 0)
    const ev = new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true, bubbles: true })
    el.dispatchEvent(ev)
    expect(w.emitted('release-fixed')).toEqual([['Steel plate']])
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(el.value).toBe('abc')
  })

  it('emits release-fixed on Backspace in an empty box', async () => {
    const w = make({ fixed: 'Steel plate', modelValue: '' })
    await key(w, 'Backspace')
    expect(w.emitted('release-fixed')).toEqual([['Steel plate']])
  })

  it('does not release on Backspace in the middle of the text, or over a selection', async () => {
    const w = make({ fixed: 'Steel plate', modelValue: 'abcdef' })
    const el = w.get('input').element as HTMLInputElement
    el.setSelectionRange(3, 3)
    await key(w, 'Backspace')
    el.setSelectionRange(0, 3)
    await key(w, 'Backspace')
    expect(w.emitted('release-fixed')).toBeUndefined()
  })

  it('emits release-fixed on a press on the fixed part', async () => {
    const w = make({ fixed: 'Steel plate', modelValue: 'abc' })
    await w.get('[data-fixed]').trigger('click')
    expect(w.emitted('release-fixed')).toEqual([['Steel plate']])
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('does not release on Backspace when nothing is fixed', async () => {
    const w = make({ modelValue: '' })
    await key(w, 'Backspace')
    expect(w.emitted('release-fixed')).toBeUndefined()
  })

  it('lets the fixed text wrap rather than be cut off', () => {
    const cls = make({ fixed: 'A very long fixed text' }).get('[data-fixed]').element.className
    expect(cls).toMatch(/break-words|whitespace-normal/)
    expect(cls).not.toMatch(/truncate|whitespace-nowrap|text-ellipsis/)
  })
})

describe('SuggestField — error and state', () => {
  it('says why under the box and marks it invalid', () => {
    const w = make({ error: 'Name is needed' })
    const box = w.get('input')
    const alert = w.get('[role="alert"]')
    expect(alert.text()).toBe('Name is needed')
    expect(box.attributes('aria-invalid')).toBe('true')
    expect(box.attributes('aria-describedby')).toContain(alert.attributes('id'))
  })

  it('is not invalid without an error', () => {
    const w = make()
    expect(w.get('input').attributes('aria-invalid')).toBeUndefined()
    expect(w.find('[role="alert"]').exists()).toBe(false)
  })

  it('can be disabled', () => {
    expect(make({ disabled: true }).get('input').attributes('disabled')).toBeDefined()
  })
})
