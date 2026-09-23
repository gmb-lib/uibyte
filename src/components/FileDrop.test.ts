import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FileDrop from './FileDrop.vue'

const json = (name = 'settings.json') => new File(['{}'], name, { type: 'application/json' })
const png = (name = 'photo.png') => new File(['x'], name, { type: 'image/png' })

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

const drop = (files: File[]) => ({ dataTransfer: { files } })

describe('FileDrop', () => {
  it('draws the words it was given, and nothing of its own', () => {
    const w = mount(FileDrop, { props: { label: 'Drop a file here', hint: 'one JSON file' } })
    expect(w.text()).toBe('Drop a file hereone JSON file')
  })

  it('draws no hint line when it was given none', () => {
    const w = mount(FileDrop, { props: { label: 'Drop a file here' } })
    expect(w.findAll('span')).toHaveLength(1)
  })

  // The zone is a label around the real input, so the platform supplies the
  // chooser, the keyboard stop and the accessible name.
  it('is a label around a native file input, which takes its name from the zone', () => {
    const w = mount(FileDrop, { props: { label: 'Drop a file here' } })
    expect(w.element.tagName).toBe('LABEL')
    const input = w.get('input')
    expect(input.attributes('type')).toBe('file')
    expect(input.classes()).toContain('sr-only')
    expect(input.element.closest('label')).toBe(w.element)
  })

  it('shows the keyboard focus on the zone, since the input itself is hidden', () => {
    const w = mount(FileDrop, { props: { label: 'x' } })
    expect(w.classes()).toContain('has-[:focus-visible]:outline-focus')
  })

  it('hands the chooser the accept rule and whether several files may be chosen', () => {
    const w = mount(FileDrop, { props: { label: 'x', accept: '.json', multiple: true } })
    expect(w.get('input').attributes('accept')).toBe('.json')
    expect((w.get('input').element as HTMLInputElement).multiple).toBe(true)
  })

  it('hands over what was chosen', () => {
    const w = mount(FileDrop, { props: { label: 'x' } })
    const file = json()
    choose(w.get('input').element as HTMLInputElement, [file])
    expect(w.emitted('files')).toEqual([[[file]]])
  })

  // Otherwise correcting a file and choosing it again is a choice nobody hears.
  it('clears the input after every choice, so the same file can be chosen again', () => {
    const w = mount(FileDrop, { props: { label: 'x' } })
    const written = choose(w.get('input').element as HTMLInputElement, [json()])
    expect(written).toEqual([''])
  })

  it('says nothing when the chooser is closed without a choice', () => {
    const w = mount(FileDrop, { props: { label: 'x' } })
    choose(w.get('input').element as HTMLInputElement, [])
    expect(w.emitted('files')).toBeUndefined()
    expect(w.emitted('rejected')).toBeUndefined()
  })

  it('hands over what was dropped', async () => {
    const w = mount(FileDrop, { props: { label: 'x' } })
    const file = json()
    await w.trigger('drop', drop([file]))
    expect(w.emitted('files')).toEqual([[[file]]])
  })

  // The platform filters only what the chooser offers; a drop is held to the
  // same rule here, and what it refuses is handed back rather than lost.
  it('holds a drop to the accept rule and hands back what it refuses', async () => {
    const w = mount(FileDrop, { props: { label: 'x', accept: '.json,application/json', multiple: true } })
    const good = json()
    const bad = png()
    await w.trigger('drop', drop([good, bad]))
    expect(w.emitted('files')).toEqual([[[good]]])
    expect(w.emitted('rejected')).toEqual([[[bad], 'type']])
  })

  it.each([
    ['an extension, in any case', '.JSON', json('Settings.Json'), true],
    ['a media type', 'application/json', json('noextension'), true],
    ['a wildcard', 'image/*', png(), true],
    ['a wildcard, against another kind', 'image/*', json(), false],
    ['a list, none of which match', '.csv, text/plain', json(), false],
  ])('reads an accept rule naming %s', async (_case, accept, file, taken) => {
    const w = mount(FileDrop, { props: { label: 'x', accept } })
    await w.trigger('drop', drop([file]))
    expect(Boolean(w.emitted('files'))).toBe(taken)
    expect(Boolean(w.emitted('rejected'))).toBe(!taken)
  })

  // Several files onto a zone that takes one: which one was meant is not this
  // component's guess to make.
  it('refuses several files where one is taken, rather than keeping the first', async () => {
    const w = mount(FileDrop, { props: { label: 'x' } })
    const a = json('a.json')
    const b = json('b.json')
    await w.trigger('drop', drop([a, b]))
    expect(w.emitted('files')).toBeUndefined()
    expect(w.emitted('rejected')).toEqual([[[a, b], 'count']])
  })

  it('takes several files when it was told to', async () => {
    const w = mount(FileDrop, { props: { label: 'x', multiple: true } })
    const a = json('a.json')
    const b = json('b.json')
    await w.trigger('drop', drop([a, b]))
    expect(w.emitted('files')).toEqual([[[a, b]]])
  })

  // Entering a child element fires `dragleave` on the zone first; a plain flag
  // would switch the highlight off while the file is still over it.
  it('keeps the highlight while a file moves over its own children', async () => {
    const w = mount(FileDrop, { props: { label: 'x', hint: 'y' } })
    await w.trigger('dragenter')
    await w.trigger('dragenter') // onto a child
    await w.trigger('dragleave') // off the zone onto the child
    expect(w.attributes('data-dragging')).toBe('true')
    await w.trigger('dragleave') // off the zone itself
    expect(w.attributes('data-dragging')).toBeUndefined()
  })

  it('drops the highlight when the file lands', async () => {
    const w = mount(FileDrop, { props: { label: 'x' } })
    await w.trigger('dragenter')
    await w.trigger('drop', drop([json()]))
    expect(w.attributes('data-dragging')).toBeUndefined()
  })

  it('does nothing while disabled — no highlight, no drop, no choice', async () => {
    const w = mount(FileDrop, { props: { label: 'x', disabled: true } })
    expect((w.get('input').element as HTMLInputElement).disabled).toBe(true)
    await w.trigger('dragenter')
    expect(w.attributes('data-dragging')).toBeUndefined()
    await w.trigger('drop', drop([json()]))
    choose(w.get('input').element as HTMLInputElement, [json()])
    expect(w.emitted('files')).toBeUndefined()
  })
})
