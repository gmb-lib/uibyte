import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FilePick from './FilePick.vue'

const pdf = (name = 'scan.pdf') => new File(['x'], name, { type: 'application/pdf' })

// jsdom will not let a test set a file input's `files`, nor give its `value` a
// file path, so both are stood in on the element itself.
function choose(input: HTMLInputElement, files: File[]): string[] {
  const written: string[] = []
  Object.defineProperty(input, 'files', { configurable: true, get: () => files })
  Object.defineProperty(input, 'value', {
    configurable: true,
    get: () => (written.length ? written[written.length - 1] : 'C:\\fakepath\\chosen'),
    set: (v: string) => written.push(v),
  })
  input.dispatchEvent(new Event('change'))
  return written
}

describe('FilePick', () => {
  it('draws the words it was given, and nothing of its own', () => {
    const w = mount(FilePick, { props: { label: 'Add an attachment' } })
    expect(w.text()).toBe('Add an attachment')
  })

  it('is a label around a native file input, which takes its name from the words', () => {
    const w = mount(FilePick, { props: { label: 'Add an attachment' } })
    expect(w.element.tagName).toBe('LABEL')
    const input = w.get('input')
    expect(input.attributes('type')).toBe('file')
    expect(input.classes()).toContain('sr-only')
    expect(input.element.closest('label')).toBe(w.element)
  })

  it('shows the keyboard focus on the label, since the input is hidden', () => {
    const w = mount(FilePick, { props: { label: 'x' } })
    expect(w.classes()).toContain('has-[:focus-visible]:outline-focus')
  })

  it('hands the chooser the accept rule and whether several may be chosen', () => {
    const w = mount(FilePick, { props: { label: 'x', accept: '.pdf,image/*', multiple: true } })
    expect(w.get('input').attributes('accept')).toBe('.pdf,image/*')
    expect((w.get('input').element as HTMLInputElement).multiple).toBe(true)
  })

  it('takes one file by default', () => {
    const w = mount(FilePick, { props: { label: 'x' } })
    expect((w.get('input').element as HTMLInputElement).multiple).toBe(false)
  })

  it('emits what was chosen', () => {
    const w = mount(FilePick, { props: { label: 'x', multiple: true } })
    const files = [pdf('a.pdf'), pdf('b.pdf')]
    choose(w.get('input').element as HTMLInputElement, files)
    expect(w.emitted('files')).toEqual([[files]])
  })

  it('empties the input after a pick, so the same file can be chosen again', () => {
    const w = mount(FilePick, { props: { label: 'x' } })
    const written = choose(w.get('input').element as HTMLInputElement, [pdf()])
    expect(written).toEqual([''])
  })

  it('emits nothing for an empty pick', () => {
    const w = mount(FilePick, { props: { label: 'x' } })
    choose(w.get('input').element as HTMLInputElement, [])
    expect(w.emitted('files')).toBeUndefined()
  })

  it('refuses nothing itself: a file the accept rule would not offer is still handed over', () => {
    const w = mount(FilePick, { props: { label: 'x', accept: '.pdf' } })
    const odd = new File(['x'], 'photo.png', { type: 'image/png' })
    choose(w.get('input').element as HTMLInputElement, [odd])
    expect(w.emitted('files')).toEqual([[[odd]]])
  })

  it('is dimmed and does nothing when disabled', () => {
    const w = mount(FilePick, { props: { label: 'x', disabled: true } })
    expect(w.get('input').attributes('disabled')).toBeDefined()
    expect(w.classes()).toContain('opacity-50')
    choose(w.get('input').element as HTMLInputElement, [pdf()])
    expect(w.emitted('files')).toBeUndefined()
  })
})
