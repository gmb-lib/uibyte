import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SelectField from './SelectField.vue'
import type { SelectOption } from './types'

const options: SelectOption[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma', disabled: true },
]

const select = (w: ReturnType<typeof mount>) => w.get('select')

describe('SelectField', () => {
  it('is a native select drawing every option in the host words', () => {
    const w = mount(SelectField, { props: { modelValue: 'a', options, ariaLabel: 'Kind' } })
    expect(select(w).element.tagName).toBe('SELECT')
    expect(w.findAll('option').map((o) => o.text())).toEqual(['Alpha', 'Beta', 'Gamma'])
    expect(w.findAll('option').map((o) => o.attributes('value'))).toEqual(['a', 'b', 'c'])
  })

  it('shows the chosen option and hands back a new choice', async () => {
    const w = mount(SelectField, { props: { modelValue: 'b', options, ariaLabel: 'Kind' } })
    expect((select(w).element as HTMLSelectElement).value).toBe('b')
    await select(w).setValue('a')
    expect(w.emitted('update:modelValue')).toEqual([['a']])
  })

  it('follows the value when the host changes it', async () => {
    const w = mount(SelectField, { props: { modelValue: 'a', options, ariaLabel: 'Kind' } })
    await w.setProps({ modelValue: 'b' })
    expect((select(w).element as HTMLSelectElement).value).toBe('b')
  })

  it('marks a disabled option disabled, still drawn', () => {
    const w = mount(SelectField, { props: { modelValue: 'a', options, ariaLabel: 'Kind' } })
    expect(w.findAll('option')[2]?.attributes('disabled')).toBeDefined()
    expect(w.findAll('option')[0]?.attributes('disabled')).toBeUndefined()
  })

  it('draws a first empty option for the placeholder, chosen while nothing is', () => {
    const w = mount(SelectField, { props: { modelValue: '', options, ariaLabel: 'Kind', placeholder: 'Choose' } })
    const first = w.findAll('option')[0]
    expect(first?.text()).toBe('Choose')
    expect(first?.attributes('value')).toBe('')
    expect((select(w).element as HTMLSelectElement).value).toBe('')
  })

  it('draws no empty option without a placeholder', () => {
    const w = mount(SelectField, { props: { modelValue: 'a', options, ariaLabel: 'Kind' } })
    expect(w.findAll('option')).toHaveLength(3)
  })

  it('draws the label and ties it to the select', () => {
    const w = mount(SelectField, { props: { modelValue: 'a', options, label: 'Kind' } })
    expect(w.get('label').text()).toBe('Kind')
    expect(w.get('label').attributes('for')).toBe(select(w).attributes('id'))
    expect(select(w).attributes('aria-label')).toBeUndefined()
  })

  it('takes its accessible name from ariaLabel when the host draws its own label', () => {
    const w = mount(SelectField, { props: { modelValue: 'a', options, ariaLabel: 'Role: Anna' } })
    expect(w.find('label').exists()).toBe(false)
    expect(select(w).attributes('aria-label')).toBe('Role: Anna')
  })

  it('puts the id on the select', () => {
    const w = mount(SelectField, { props: { modelValue: 'a', options, id: 'kind' } })
    expect(select(w).attributes('id')).toBe('kind')
  })

  it('describes the select by its hint', () => {
    const w = mount(SelectField, { props: { modelValue: 'a', options, ariaLabel: 'x', hint: 'Sets the window' } })
    const hint = w.get('p')
    expect(select(w).attributes('aria-describedby')).toBe(hint.attributes('id'))
  })

  it('marks it invalid and says the error, announced', () => {
    const w = mount(SelectField, { props: { modelValue: '', options, ariaLabel: 'x', error: 'Choose one' } })
    expect(select(w).attributes('aria-invalid')).toBe('true')
    expect(select(w).classes()).toContain('border-status-late')
    expect(w.get('[role="alert"]').text()).toBe('Choose one')
    expect(select(w).attributes('aria-describedby')).toBe(w.get('[role="alert"]').attributes('id'))
  })

  it('is not invalid unless asked', () => {
    const w = mount(SelectField, { props: { modelValue: 'a', options, ariaLabel: 'x' } })
    expect(select(w).attributes('aria-invalid')).toBeUndefined()
  })

  it('can be disabled', () => {
    const w = mount(SelectField, { props: { modelValue: 'a', options, ariaLabel: 'x', disabled: true } })
    expect(select(w).attributes('disabled')).toBeDefined()
  })

  it('puts class on the outer element and other attributes on the select', () => {
    const w = mount(SelectField, {
      props: { modelValue: 'a', options, ariaLabel: 'x' },
      attrs: { class: 'max-w-[180px]', 'data-role': '' },
    })
    expect(w.classes()).toContain('max-w-[180px]')
    expect(select(w).attributes('data-role')).toBeDefined()
  })
})
