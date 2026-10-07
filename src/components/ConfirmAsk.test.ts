import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import ConfirmAsk from './ConfirmAsk.vue'

const words = { question: 'Take Anna off this list?', confirmLabel: 'Take off', keepLabel: 'Keep her' }

afterEach(() => {
  document.body.innerHTML = ''
})

// A host that opens the ask from a button and closes it on either answer.
const Host = defineComponent({
  setup() {
    const asking = ref(false)
    return () =>
      h('div', [
        h('button', { id: 'opener', onClick: () => (asking.value = true) }, 'Take off…'),
        h('button', { id: 'elsewhere' }, 'Something else'),
        asking.value
          ? h(ConfirmAsk, { ...words, onConfirm: () => (asking.value = false), onKeep: () => (asking.value = false) })
          : null,
      ])
  },
})

describe('ConfirmAsk', () => {
  it('is a group named by its question and described by what it does', () => {
    const w = mount(ConfirmAsk, { props: { ...words, detail: 'This cannot be undone.' }, attachTo: document.body })
    const group = w.get('[role="group"]')
    expect(document.getElementById(group.attributes('aria-labelledby') ?? '')?.textContent).toBe(words.question)
    expect(document.getElementById(group.attributes('aria-describedby') ?? '')?.textContent).toBe('This cannot be undone.')
  })

  it('describes nothing when there is nothing more to say', () => {
    const w = mount(ConfirmAsk, { props: words })
    expect(w.attributes('aria-describedby')).toBeUndefined()
  })

  // On the answer that changes nothing, so a stray Enter is harmless.
  it('takes focus when it appears, on keeping things as they are', () => {
    mount(ConfirmAsk, { props: words, attachTo: document.body })
    expect(document.activeElement?.textContent?.trim()).toBe('Keep her')
  })

  it('tells the host which answer was given', async () => {
    const w = mount(ConfirmAsk, { props: words })
    const [act, keep] = w.findAll('button')
    await act.trigger('click')
    await keep.trigger('click')
    expect(w.emitted('confirm')).toHaveLength(1)
    expect(w.emitted('keep')).toHaveLength(1)
  })

  it('keeps things as they are on Escape', async () => {
    const w = mount(ConfirmAsk, { props: words })
    await w.trigger('keydown', { key: 'Escape' })
    expect(w.emitted('keep')).toHaveLength(1)
    expect(w.emitted('confirm')).toBeUndefined()
  })

  it('draws an act that cannot be undone in the danger look, and an ordinary one plainly', () => {
    const final = mount(ConfirmAsk, { props: { ...words, danger: true } })
    const plain = mount(ConfirmAsk, { props: words })
    expect(final.findAll('button')[0].classes()).toContain('bg-status-late-solid-bg')
    expect(plain.findAll('button')[0].classes()).not.toContain('bg-status-late-solid-bg')
  })

  it('holds both answers while the act is under way, Escape included', async () => {
    const w = mount(ConfirmAsk, { props: { ...words, busy: true } })
    for (const b of w.findAll('button')) expect(b.attributes('disabled')).toBeDefined()
    await w.trigger('keydown', { key: 'Escape' })
    expect(w.emitted('keep')).toBeUndefined()
  })

  it('gives focus back to what opened it when it goes away', async () => {
    const w = mount(Host, { attachTo: document.body })
    const opener = w.get('#opener')
    ;(opener.element as HTMLElement).focus()
    await opener.trigger('click')
    expect(document.activeElement?.textContent?.trim()).toBe('Keep her')
    await w.findAll('button').find((b) => b.text() === 'Keep her')!.trigger('click')
    expect(document.activeElement?.id).toBe('opener')
  })

  it('leaves focus where the person moved it', async () => {
    const w = mount(Host, { attachTo: document.body })
    const opener = w.get('#opener')
    ;(opener.element as HTMLElement).focus()
    await opener.trigger('click')
    ;(w.get('#elsewhere').element as HTMLElement).focus()
    await w.findAll('button').find((b) => b.text() === 'Take off')!.trigger('click')
    expect(document.activeElement?.id).toBe('elsewhere')
  })

  it('says only the host’s words', () => {
    expect(mount(ConfirmAsk, { props: words }).text()).toBe('Take Anna off this list?Take offKeep her')
  })
})
