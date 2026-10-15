import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TextField from './TextField.vue'

const input = (w: ReturnType<typeof mount>) => w.get('input')

describe('TextField', () => {
  it('shows the value it was given and hands back what is typed', async () => {
    const w = mount(TextField, { props: { modelValue: 'abc', ariaLabel: 'Name' } })
    expect((input(w).element as HTMLInputElement).value).toBe('abc')
    await input(w).setValue('abcd')
    expect(w.emitted('update:modelValue')).toEqual([['abcd']])
  })

  it('follows the value when the host changes it', async () => {
    const w = mount(TextField, { props: { modelValue: 'a', ariaLabel: 'Name' } })
    await w.setProps({ modelValue: 'b' })
    expect((input(w).element as HTMLInputElement).value).toBe('b')
  })

  it('is a text box unless told another type', async () => {
    const w = mount(TextField, { props: { modelValue: '', ariaLabel: 'x' } })
    expect(input(w).attributes('type')).toBe('text')
    for (const type of ['search', 'date', 'number', 'email'] as const) {
      await w.setProps({ type })
      expect(input(w).attributes('type')).toBe(type)
    }
  })

  it('draws the label and ties it to the box', () => {
    const w = mount(TextField, { props: { modelValue: '', label: 'Issuer' } })
    const label = w.get('label')
    expect(label.text()).toBe('Issuer')
    expect(label.attributes('for')).toBe(input(w).attributes('id'))
    expect(input(w).attributes('aria-label')).toBeUndefined()
  })

  it('takes its accessible name from ariaLabel when the host draws its own label', () => {
    const w = mount(TextField, { props: { modelValue: '', ariaLabel: 'Find a person' } })
    expect(w.find('label').exists()).toBe(false)
    expect(input(w).attributes('aria-label')).toBe('Find a person')
  })

  it('puts the id on the input so a host label can point at it', () => {
    const w = mount(TextField, { props: { modelValue: '', id: 'issuer' } })
    expect(input(w).attributes('id')).toBe('issuer')
  })

  it('describes the box by its hint', () => {
    const w = mount(TextField, { props: { modelValue: '', ariaLabel: 'x', hint: 'As printed' } })
    const hint = w.get('p')
    expect(hint.text()).toBe('As printed')
    expect(input(w).attributes('aria-describedby')).toBe(hint.attributes('id'))
  })

  it('has no description when it has no hint or error', () => {
    const w = mount(TextField, { props: { modelValue: '', ariaLabel: 'x' } })
    expect(input(w).attributes('aria-describedby')).toBeUndefined()
    expect(input(w).attributes('aria-invalid')).toBeUndefined()
  })

  it('marks the box invalid, in the refusal colour', () => {
    const w = mount(TextField, { props: { modelValue: '', ariaLabel: 'x', invalid: true } })
    expect(input(w).attributes('aria-invalid')).toBe('true')
    expect(input(w).classes()).toContain('border-status-late')
  })

  it('says an error under the box, announced, and is invalid with it', () => {
    const w = mount(TextField, { props: { modelValue: '', ariaLabel: 'x', error: 'Required', hint: 'Hint' } })
    const alert = w.get('[role="alert"]')
    expect(alert.text()).toBe('Required')
    expect(input(w).attributes('aria-invalid')).toBe('true')
    expect(input(w).attributes('aria-describedby')).toContain(alert.attributes('id'))
    expect(input(w).attributes('aria-describedby')?.split(' ')).toHaveLength(2)
  })

  it('can be disabled', () => {
    const w = mount(TextField, { props: { modelValue: '', ariaLabel: 'x', disabled: true } })
    expect(input(w).attributes('disabled')).toBeDefined()
  })

  it('passes name, autocomplete, inputmode, min, max and placeholder to the input', () => {
    const w = mount(TextField, {
      props: {
        modelValue: '',
        ariaLabel: 'x',
        type: 'number',
        name: 'qty',
        autocomplete: 'off',
        inputmode: 'numeric',
        min: 1,
        max: 9,
        placeholder: 'How many',
      },
    })
    const a = input(w).attributes()
    expect(a.name).toBe('qty')
    expect(a.autocomplete).toBe('off')
    expect(a.inputmode).toBe('numeric')
    expect(a.min).toBe('1')
    expect(a.max).toBe('9')
    expect(a.placeholder).toBe('How many')
  })

  it('puts class on the outer element, where a host sets the width, and other attributes on the input', () => {
    const w = mount(TextField, {
      props: { modelValue: '', ariaLabel: 'x' },
      attrs: { class: 'max-w-[240px]', 'data-find': '' },
    })
    expect(w.classes()).toContain('max-w-[240px]')
    expect(w.classes()).not.toContain('max-w-[420px]')
    expect(input(w).attributes('data-find')).toBeDefined()
    expect(input(w).classes()).not.toContain('max-w-[240px]')
  })

  it('hands a host listener on the input its events', async () => {
    let pressed = ''
    const w = mount(TextField, {
      props: { modelValue: '', ariaLabel: 'x' },
      attrs: { onKeydown: (e: KeyboardEvent) => (pressed = e.key) },
    })
    await input(w).trigger('keydown', { key: 'Enter' })
    expect(pressed).toBe('Enter')
  })
})
