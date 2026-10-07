import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FindField from './FindField.vue'
import type { FindOption } from './types'

const people: FindOption[] = [
  { key: 'k-anna', label: 'Anna Ozola', note: 'holds 2 items' },
  { key: 'k-valdis', label: 'Valdis Krūmiņš' },
  { key: 'k-gone', label: 'Ilze Bērziņa', note: 'has left', disabled: true },
  { key: 'k-janis', label: 'Jānis Liepa' },
]

function one(props: Record<string, unknown> = {}) {
  return mount(FindField, {
    props: { options: people, modelValue: '', label: 'Find a person', noMatch: 'Nobody matches', ...props },
    attachTo: document.body,
  })
}

function several(props: Record<string, unknown> = {}) {
  return mount(FindField, {
    props: { options: people, modelValue: [], multiple: true, label: 'Add people', noMatch: 'Nobody matches', ...props },
    attachTo: document.body,
  })
}

const optionTexts = (w: ReturnType<typeof one>) => w.findAll('[role="option"]').map((o) => o.text())

describe('FindField — one at a time', () => {
  it('is a combobox named for what it finds, closed until used', () => {
    const w = one()
    const box = w.get('input')
    expect(box.attributes('role')).toBe('combobox')
    expect(box.attributes('aria-label')).toBe('Find a person')
    expect(box.attributes('aria-expanded')).toBe('false')
    expect(w.find('[role="listbox"]').exists()).toBe(false)
  })

  it('opens its matches under the box when it is reached, each with its note', async () => {
    const w = one()
    await w.get('input').trigger('focus')
    expect(w.get('input').attributes('aria-expanded')).toBe('true')
    expect(w.get('input').attributes('aria-controls')).toBe(w.get('[role="listbox"]').attributes('id'))
    expect(optionTexts(w)).toEqual(['Anna Ozola holds 2 items', 'Valdis Krūmiņš', 'Ilze Bērziņa has left', 'Jānis Liepa'])
  })

  it('finds by what is typed, without the marks over letters and in any case', async () => {
    const w = one()
    await w.get('input').setValue('KRUMINS')
    expect(optionTexts(w)).toEqual(['Valdis Krūmiņš'])
  })

  it('finds by the note too', async () => {
    const w = one()
    await w.get('input').setValue('holds')
    expect(optionTexts(w)).toEqual(['Anna Ozola holds 2 items'])
  })

  it('says when nothing matches, in the host’s words, and opens no empty list', async () => {
    const w = one()
    await w.get('input').setValue('zzz')
    expect(w.get('[role="status"]').text()).toBe('Nobody matches')
    expect(w.find('[role="listbox"]').exists()).toBe(false)
    expect(w.get('input').attributes('aria-expanded')).toBe('false')
  })

  it('moves through the matches with the arrow keys, stepping over one that cannot be chosen', async () => {
    const w = one()
    const box = w.get('input')
    await box.trigger('focus')
    const activeText = () => document.getElementById(box.attributes('aria-activedescendant') ?? '')?.textContent?.trim()
    expect(activeText()).toBe('Anna Ozola holds 2 items')
    await box.trigger('keydown', { key: 'ArrowDown' })
    expect(activeText()).toBe('Valdis Krūmiņš')
    await box.trigger('keydown', { key: 'ArrowDown' })
    expect(activeText()).toBe('Jānis Liepa')
    await box.trigger('keydown', { key: 'ArrowUp' })
    expect(activeText()).toBe('Valdis Krūmiņš')
  })

  it('takes the active match on Enter, tells the host its key, and closes', async () => {
    const w = one()
    const box = w.get('input')
    await box.trigger('focus')
    await box.trigger('keydown', { key: 'ArrowDown' })
    await box.trigger('keydown', { key: 'Enter' })
    expect(w.emitted('update:modelValue')).toEqual([['k-valdis']])
    expect(w.find('[role="listbox"]').exists()).toBe(false)
    expect((box.element as HTMLInputElement).value).toBe('Valdis Krūmiņš')
  })

  it('takes a match that is clicked', async () => {
    const w = one()
    await w.get('input').trigger('focus')
    await w.findAll('[role="option"]')[3].trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['k-janis']])
  })

  it('shows one that cannot be chosen, says so, and never takes it', async () => {
    const w = one()
    await w.get('input').trigger('focus')
    const gone = w.findAll('[role="option"]')[2]
    expect(gone.attributes('aria-disabled')).toBe('true')
    await gone.trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  // Typing is looking, not choosing: a key never comes from the keyboard.
  it('never chooses from typing alone', async () => {
    const w = one()
    await w.get('input').setValue('k-anna')
    await w.get('input').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.emitted('update:query')?.at(-1)).toEqual(['k-anna'])
  })

  it('shows the chosen one by name, and goes back to it when left half-typed', async () => {
    const w = one({ modelValue: 'k-anna' })
    const box = w.get('input')
    expect((box.element as HTMLInputElement).value).toBe('Anna Ozola')
    await box.trigger('focus')
    await box.setValue('Val')
    await box.trigger('blur')
    expect((box.element as HTMLInputElement).value).toBe('Anna Ozola')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('opens on everything, not on the chosen name alone', async () => {
    const w = one({ modelValue: 'k-anna' })
    await w.get('input').trigger('focus')
    expect(w.findAll('[role="option"]')).toHaveLength(4)
    expect(w.get('[aria-selected="true"]').text()).toContain('Anna Ozola')
  })

  it('follows a choice made elsewhere', async () => {
    const w = one({ modelValue: 'k-anna' })
    await w.setProps({ modelValue: 'k-janis' })
    expect((w.get('input').element as HTMLInputElement).value).toBe('Jānis Liepa')
  })

  it('offers the way back to nothing chosen when given its words', async () => {
    const w = one({ modelValue: 'k-anna', clearLabel: 'Nobody' })
    await w.get('input').trigger('focus')
    const first = w.findAll('[role="option"]')[0]
    expect(first.text()).toBe('Nobody')
    await first.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['']])
  })

  // Seen in a render: with the way back first, Enter after typing cleared the
  // choice instead of taking what was found.
  it('makes the first match the active one once something is typed, not the way back', async () => {
    const w = one({ clearLabel: 'Nobody' })
    const box = w.get('input')
    await box.setValue('oz')
    expect(optionTexts(w)).toEqual(['Anna Ozola holds 2 items'])
    await box.trigger('keydown', { key: 'Enter' })
    expect(w.emitted('update:modelValue')).toEqual([['k-anna']])
  })

  it('closes on Escape, and clears what was typed on a second Escape', async () => {
    const w = one()
    const box = w.get('input')
    await box.setValue('an')
    await box.trigger('keydown', { key: 'Escape' })
    expect(w.find('[role="listbox"]').exists()).toBe(false)
    await box.trigger('keydown', { key: 'Escape' })
    expect((box.element as HTMLInputElement).value).toBe('')
    expect(w.emitted('update:query')?.at(-1)).toEqual([''])
  })

  it('draws the first few of many, and says there are more', async () => {
    const w = one({ limit: 2, moreText: 'Type more to narrow it' })
    await w.get('input').trigger('focus')
    expect(w.findAll('[role="option"]')).toHaveLength(2)
    expect(w.text()).toContain('Type more to narrow it')
  })

  // A list that could not be read is said, and nothing is offered in its place —
  // least of all a box to type a key into.
  it('says a list that could not be read, at once, and offers nothing instead', async () => {
    const w = one({ failed: 'The people could not be read' })
    expect(w.get('[role="alert"]').text()).toBe('The people could not be read')
    expect(w.get('input').attributes('disabled')).toBeDefined()
    await w.get('input').trigger('focus')
    expect(w.find('[role="listbox"]').exists()).toBe(false)
    expect(w.findAll('input')).toHaveLength(1)
  })

  it('says the list is still being read, and opens nothing yet', async () => {
    const w = one({ loading: 'Reading the people…' })
    await w.get('input').trigger('focus')
    expect(w.get('[role="status"]').text()).toBe('Reading the people…')
    expect(w.find('[role="listbox"]').exists()).toBe(false)
  })

  it('shows a visible focus ring', () => {
    expect(one().get('input').classes()).toContain('focus-visible:outline-focus')
  })
})

describe('FindField — several at once', () => {
  it('is a box over a named group of ticks', () => {
    const w = several({ summary: '4 not added yet' })
    expect(w.get('[role="group"]').attributes('aria-label')).toBe('Add people')
    expect(w.findAll('input[type="checkbox"]')).toHaveLength(4)
    expect(w.text()).toContain('4 not added yet')
  })

  it('adds a ticked one to the chosen keys, and takes an unticked one away', async () => {
    const w = several({ modelValue: ['k-anna'] })
    const boxes = w.findAll('input[type="checkbox"]')
    await boxes[1].trigger('change')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([['k-anna', 'k-valdis']])
    await boxes[0].trigger('change')
    expect(w.emitted('update:modelValue')?.[1]).toEqual([[]])
  })

  it('narrows the ticks to what matches the box', async () => {
    const w = several()
    await w.get('input[type="search"]').setValue('liepa')
    expect(w.findAll('label').map((l) => l.text())).toEqual(['Jānis Liepa'])
  })

  // A search never hides a choice already made.
  it('keeps what is ticked in view, first, whatever is typed', async () => {
    const w = several({ modelValue: ['k-janis'] })
    await w.get('input[type="search"]').setValue('anna')
    expect(w.findAll('label').map((l) => l.text())).toEqual(['Jānis Liepa', 'Anna Ozola holds 2 items'])
  })

  it('cannot tick one that cannot be chosen', async () => {
    const w = several()
    const gone = w.findAll('input[type="checkbox"]')[2]
    expect(gone.attributes('disabled')).toBeDefined()
    await gone.trigger('change')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('says when nothing matches', async () => {
    const w = several()
    await w.get('input[type="search"]').setValue('zzz')
    expect(w.get('[role="status"]').text()).toBe('Nobody matches')
  })

  it('tells the host what is typed, for a list it filters itself', async () => {
    const w = several()
    await w.get('input[type="search"]').setValue('oz')
    expect(w.emitted('update:query')).toEqual([['oz']])
  })
})
