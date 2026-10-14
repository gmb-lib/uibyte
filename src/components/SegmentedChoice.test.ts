import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import SegmentedChoice from './SegmentedChoice.vue'
import type { SegmentedOption } from './types'
import * as kit from '../index'

const options: SegmentedOption[] = [
  { key: 'one', label: 'One way' },
  { key: 'two', label: 'Another way' },
  { key: 'three', label: 'A third way', disabled: true },
  { key: 'four', label: 'The last way' },
]

// Each test starts on an empty page, so the caret is never left on another test's group.
enableAutoUnmount(afterEach)

/** The group as the host draws it, told nothing back: what it asks for is in `emitted`. */
function group(modelValue = 'one', list: SegmentedOption[] = options) {
  const w = mount(SegmentedChoice, {
    props: { options: list, modelValue, label: 'How it is done' },
    attachTo: document.body,
  })
  return { w, radios: () => w.findAll('[role="radio"]') }
}

/** The group in a host that keeps the choice, as `v-model` does. */
function held(start = 'one', list: SegmentedOption[] = options) {
  const chosen = ref(start)
  const Host = defineComponent({
    setup: () => () =>
      h(SegmentedChoice, {
        options: list,
        label: 'How it is done',
        modelValue: chosen.value,
        'onUpdate:modelValue': (key: string) => (chosen.value = key),
      }),
  })
  const w = mount(Host, { attachTo: document.body })
  return { w, chosen, radios: () => w.findAll('[role="radio"]') }
}

/** A key pressed on an element, the event kept so a test can ask whether its default was stopped. */
function press(el: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  el.dispatchEvent(e)
  return e
}

/** What a reader hears an element named by: its words, without what is hidden from them. */
function heard(el: Element): string {
  const copy = el.cloneNode(true) as Element
  copy.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove())
  return (copy.textContent ?? '').trim()
}

describe('SegmentedChoice', () => {
  it('is one set of choices, named for what is being chosen, each a button that sends nothing', () => {
    const { w, radios } = group()
    expect(w.get('[role="radiogroup"]').attributes('aria-label')).toBe('How it is done')
    expect(radios()).toHaveLength(4)
    expect(radios().map((r) => r.element.tagName)).toEqual(['BUTTON', 'BUTTON', 'BUTTON', 'BUTTON'])
    // A button without a type sends the form it sits in.
    expect(radios().map((r) => r.attributes('type'))).toEqual(['button', 'button', 'button', 'button'])
    expect(radios().map((r) => heard(r.element))).toEqual(options.map((o) => o.label))
  })

  it('announces the chosen one as checked, and only that one', () => {
    expect(group('one').radios().map((r) => r.attributes('aria-checked'))).toEqual(['true', 'false', 'false', 'false'])
    expect(group('two').radios().map((r) => r.attributes('aria-checked'))).toEqual(['false', 'true', 'false', 'false'])
  })

  // The fill is a colour; the heavier words and the announcement are what make it more.
  it('draws the chosen one filled and heavier — never by its colour alone', () => {
    const [chosen, other] = group('one').radios()
    expect(chosen.classes()).toEqual(expect.arrayContaining(['bg-ink', 'text-white', 'font-semibold']))
    expect(other.classes()).toContain('text-muted-strong')
    expect(other.classes()).not.toContain('bg-ink')
    expect(other.classes()).not.toContain('font-semibold')
  })

  it('keeps the room of its heavier words, unseen and unheard, so choosing moves nothing along', () => {
    const radios = group('one').radios()
    expect(radios).toHaveLength(4)
    for (const radio of radios) {
      const room = radio.find('[aria-hidden="true"]')
      expect(room.exists()).toBe(true)
      expect(room.classes()).toEqual(expect.arrayContaining(['invisible', 'font-semibold']))
      expect(room.text()).toBe(heard(radio.element))
    }
  })

  it('asks for a choice rather than making one', async () => {
    const { w, radios } = group('one')
    await radios()[1].trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['two']])

    // The group does not move on its own: the prop still says what it said.
    expect(radios()[0].attributes('aria-checked')).toBe('true')
  })

  it('says nothing when the chosen one is chosen again', async () => {
    const { w, radios } = group('one')
    await radios()[0].trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  // A few options meaning a few stops is how a keyboard reader ends up pressing Tab
  // through every way of doing a thing to reach whatever follows them.
  it('is a single stop in the page order, on the chosen one', () => {
    expect(group('two').radios().map((r) => r.attributes('tabindex'))).toEqual(['-1', '0', '-1', '-1'])
  })

  it('puts the stop on the first that can be chosen while none is', () => {
    expect(group('').radios().map((r) => r.attributes('tabindex'))).toEqual(['0', '-1', '-1', '-1'])

    const firstLocked = [
      { key: 'locked', label: 'Locked', disabled: true },
      { key: 'open', label: 'Open' },
    ]
    expect(group('', firstLocked).radios().map((r) => r.attributes('tabindex'))).toEqual(['-1', '0'])
  })

  it('never puts the stop on an option that cannot be chosen, even the chosen one', () => {
    expect(group('three').radios().map((r) => r.attributes('tabindex'))).toEqual(['0', '-1', '-1', '-1'])
  })

  it('moves with the arrow keys and chooses as it goes', async () => {
    const { chosen, radios } = held('one')

    const right = press(radios()[0].element, 'ArrowRight')
    await nextTick()
    expect(chosen.value).toBe('two')
    // An arrow on the group is the group's: the page does not scroll under it.
    expect(right.defaultPrevented).toBe(true)

    press(radios()[1].element, 'ArrowLeft')
    await nextTick()
    expect(chosen.value).toBe('one')

    press(radios()[0].element, 'ArrowDown')
    await nextTick()
    expect(chosen.value).toBe('two')

    press(radios()[1].element, 'ArrowUp')
    await nextTick()
    expect(chosen.value).toBe('one')
  })

  it('wraps at both ends rather than stopping dead', async () => {
    const { chosen, radios } = held('one')

    press(radios()[0].element, 'ArrowLeft')
    await nextTick()
    expect(chosen.value).toBe('four')

    press(radios()[3].element, 'ArrowRight')
    await nextTick()
    expect(chosen.value).toBe('one')
  })

  it('steps over an option that cannot be chosen', async () => {
    const { chosen, radios } = held('two')

    press(radios()[1].element, 'ArrowRight')
    await nextTick()
    expect(chosen.value).toBe('four')

    press(radios()[3].element, 'ArrowLeft')
    await nextTick()
    expect(chosen.value).toBe('two')
  })

  it('goes to the first and the last that can be chosen with Home and End', async () => {
    const ends: SegmentedOption[] = [
      { key: 'shut', label: 'Shut', disabled: true },
      { key: 'first', label: 'First' },
      { key: 'middle', label: 'Middle' },
      { key: 'last', label: 'Last' },
      { key: 'closed', label: 'Closed', disabled: true },
    ]
    const { chosen, radios } = held('middle', ends)

    press(radios()[2].element, 'End')
    await nextTick()
    expect(chosen.value).toBe('last')

    press(radios()[3].element, 'Home')
    await nextTick()
    expect(chosen.value).toBe('first')
  })

  it('moves the caret with the choice, so a reader is not left on the option they left', async () => {
    const { radios } = held('one')
    press(radios()[0].element, 'ArrowRight')
    await nextTick()
    expect(document.activeElement).toBe(radios()[1].element)
  })

  it('chooses the option the caret is on with Space or Enter', () => {
    const { w, radios } = group('')

    const space = press(radios()[0].element, ' ')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['one'])
    expect(space.defaultPrevented).toBe(true)

    const enter = press(radios()[1].element, 'Enter')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['two'])
    expect(enter.defaultPrevented).toBe(true)
  })

  // Shown, never hidden: a person may need to know a way exists before they can take it.
  it('draws an option that cannot be chosen, announces it, and refuses it', async () => {
    const { w, radios } = group('one')
    const locked = radios()[2]

    expect(heard(locked.element)).toBe('A third way')
    expect(locked.attributes('aria-disabled')).toBe('true')
    expect(locked.classes()).toContain('opacity-50')

    await locked.trigger('click')
    press(locked.element, ' ')
    press(locked.element, 'Enter')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('leaves a key it does not own alone', () => {
    const { w, radios } = group('one')
    expect(press(radios()[0].element, 'a').defaultPrevented).toBe(false)
    expect(press(radios()[0].element, 'Tab').defaultPrevented).toBe(false)
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  // Alt and an arrow is the way back a page; a group that takes it keeps the reader on the page.
  it('leaves a key held with Alt, Control or Meta to the browser', () => {
    const { w, radios } = group('one')
    expect(press(radios()[0].element, 'ArrowLeft', { altKey: true }).defaultPrevented).toBe(false)
    expect(press(radios()[0].element, 'End', { ctrlKey: true }).defaultPrevented).toBe(false)
    expect(press(radios()[0].element, 'ArrowRight', { metaKey: true }).defaultPrevented).toBe(false)
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('wraps onto another line when narrow, never scrolling sideways', () => {
    const frame = group().w.get('[role="radiogroup"]')
    expect(frame.classes()).toContain('flex-wrap')
    expect(frame.classes().some((c) => c.startsWith('overflow'))).toBe(false)
  })

  it('wears the kit’s focus ring on every option', () => {
    const radios = group().radios()
    expect(radios).toHaveLength(4)
    for (const radio of radios) {
      expect(radio.classes()).toEqual(
        expect.arrayContaining(['focus-visible:outline', 'focus-visible:outline-2', 'focus-visible:outline-focus']),
      )
    }
  })

  it('draws the group, still named, with no options at all', () => {
    const { w, radios } = group('', [])
    expect(w.get('[role="radiogroup"]').attributes('aria-label')).toBe('How it is done')
    expect(radios()).toHaveLength(0)
  })

  it('is offered by the package', () => {
    expect(kit.SegmentedChoice).toBe(SegmentedChoice)
  })
})
