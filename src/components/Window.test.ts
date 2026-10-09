import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import FindField from './FindField.vue'
import Window from './Window.vue'

const words = { title: 'Edit the item', closeLabel: 'Close' }
const form = '<p>Change what it is called.</p><input id="name" /><button>Clear</button>'

// The window opens on the page's body, and the primitive under it keeps one
// stack of layers for the whole page, so every window is taken down after its
// test. After-hooks run last-registered first: unmount, then clear the body.
afterEach(() => {
  document.body.innerHTML = ''
})
enableAutoUnmount(afterEach)

const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')
const closeMark = () => document.querySelector<HTMLElement>('[aria-label="Close"]')
const press = (el: Element) =>
  el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 }))
const key = (el: Element, k: string, shiftKey = false) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, shiftKey, bubbles: true, cancelable: true }))

// Focus moves, and the press-outside listener starts, a turn after the window opens.
async function settle() {
  await flushPromises()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await flushPromises()
}

async function opened(props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) {
  const w = mount(Window, {
    props: { ...words, open: true, ...props },
    slots: { default: form, ...slots },
    attachTo: document.body,
  })
  await settle()
  return w
}

// A host that opens the window from a button and closes it when asked.
const Host = defineComponent({
  setup() {
    const open = ref(false)
    return () =>
      h('div', [
        h('button', { id: 'opener', onClick: () => (open.value = true) }, 'Edit…'),
        h(
          Window,
          { ...words, open: open.value, 'onUpdate:open': (v: boolean) => (open.value = v) },
          { default: () => h('input', { id: 'name' }) },
        ),
      ])
  },
})

describe('Window', () => {
  it('stays closed until asked, then is a modal dialog named by its own visible title', async () => {
    const w = mount(Window, {
      props: { ...words, open: false },
      slots: { default: '<p>BODY</p>' },
      attachTo: document.body,
    })
    expect(dialog()).toBeNull()

    await w.setProps({ open: true })
    await settle()
    const d = dialog()
    expect(d?.getAttribute('aria-modal')).toBe('true')
    const title = document.getElementById(d?.getAttribute('aria-labelledby') ?? '')
    expect(title?.textContent?.trim()).toBe('Edit the item')
    expect(title?.tagName).toBe('H2')
    expect(title?.classList.contains('sr-only')).toBe(false)
    expect(d?.textContent).toContain('BODY')
  })

  // The close mark comes first in the window, but a person opened it to fill it in.
  it('moves focus to the first thing in its body that takes it, not to the close mark', async () => {
    await opened()
    expect(document.activeElement?.id).toBe('name')
  })

  // In a browser a field hidden from view does not take focus. The window moves
  // on to the next thing that does, rather than leaving focus on the page behind.
  // (The test stands one in by a field whose focus does nothing.)
  it('passes over something in its body that does not take focus', async () => {
    const unseen = (el: unknown) => {
      if (el instanceof HTMLElement) el.focus = () => {}
    }
    await opened({}, { default: () => [h('input', { id: 'unseen', ref: unseen }), h('input', { id: 'seen' })] })
    expect(document.activeElement?.id).toBe('seen')
  })

  it('takes focus itself when its body has nothing to focus', async () => {
    await opened({}, { default: '<p>Nothing to fill in.</p>' })
    expect(document.activeElement).toBe(dialog())
  })

  it('keeps Tab inside: past the last it comes back to the first, and back again', async () => {
    await opened({}, { footer: '<button id="save">Save</button>' })
    const save = document.getElementById('save') as HTMLElement
    save.focus()
    key(save, 'Tab')
    expect(document.activeElement).toBe(closeMark())
    key(closeMark() as HTMLElement, 'Tab', true)
    expect(document.activeElement).toBe(save)
  })

  it('closes on Escape', async () => {
    const w = await opened()
    key(document.activeElement as HTMLElement, 'Escape')
    await settle()
    expect(w.emitted('update:open')).toEqual([[false]])
    expect(dialog()).toBeNull()
  })

  // A field inside that uses Escape for itself — a find field closing its list —
  // has answered it, and the window stays; the next Escape is the window's.
  it('leaves an Escape to a field inside that uses it, and closes on the next', async () => {
    const field = { options: [{ key: 'a', label: 'Anna' }], modelValue: '', label: 'Find', noMatch: 'Nobody' }
    const w = await opened({}, { default: () => h(FindField, field) })
    const box = document.activeElement as HTMLElement
    expect(box.getAttribute('aria-expanded')).toBe('true')

    key(box, 'Escape')
    await settle()
    expect(w.emitted('update:open')).toBeUndefined()
    expect(box.getAttribute('aria-expanded')).toBe('false')

    key(box, 'Escape')
    await settle()
    expect(w.emitted('update:open')).toEqual([[false]])
  })

  it('closes by its close mark, a button named in the host’s words with a visible focus ring', async () => {
    const w = await opened()
    const mark = closeMark() as HTMLElement
    expect(mark.tagName).toBe('BUTTON')
    expect(mark.textContent?.trim()).toBe('')
    expect(mark.className).toContain('focus-visible:outline-focus')
    mark.click()
    await settle()
    expect(w.emitted('update:open')).toEqual([[false]])
  })

  it('closes on a press outside it, and not on one inside', async () => {
    const w = await opened()
    press(dialog()?.querySelector('p') as HTMLElement)
    await settle()
    expect(w.emitted('update:open')).toBeUndefined()

    press(dialog()?.parentElement as HTMLElement)
    await settle()
    expect(w.emitted('update:open')).toEqual([[false]])
  })

  it('while busy, Escape, the close mark and a press outside all do nothing', async () => {
    const w = await opened({ busy: true })
    expect(dialog()?.getAttribute('aria-busy')).toBe('true')
    expect(closeMark()?.getAttribute('aria-disabled')).toBe('true')

    key(document.activeElement as HTMLElement, 'Escape')
    closeMark()?.click()
    press(dialog()?.parentElement as HTMLElement)
    await settle()
    expect(w.emitted('update:open')).toBeUndefined()
    expect(dialog()).not.toBeNull()

    // Once the work is done, the way out is back.
    await w.setProps({ busy: false })
    closeMark()?.click()
    await settle()
    expect(w.emitted('update:open')).toEqual([[false]])
  })

  // Busy holds the person's ways out, not the host's: a save that answers closes it.
  it('closes when the host closes it, busy or not', async () => {
    const w = await opened({ busy: true })
    await w.setProps({ open: false })
    await settle()
    expect(dialog()).toBeNull()
  })

  it('gives focus back to what opened it when it closes', async () => {
    const w = mount(Host, { attachTo: document.body })
    const opener = w.get('#opener').element as HTMLElement
    opener.focus()
    await w.get('#opener').trigger('click')
    await settle()
    expect(document.activeElement?.id).toBe('name')

    closeMark()?.click()
    // The primitive hands focus back on a timer, after the window has gone.
    await vi.waitFor(() => expect(dialog()).toBeNull())
    await vi.waitFor(() => expect(document.activeElement).toBe(opener))
  })

  it('hides the page behind from a reader while it is open', async () => {
    const w = mount(Host, { attachTo: document.body })
    const opener = w.get('#opener').element as HTMLElement
    expect(opener.closest('[aria-hidden="true"]')).toBeNull()
    await w.get('#opener').trigger('click')
    await settle()
    expect(opener.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(dialog()?.closest('[aria-hidden="true"]')).toBeNull()

    closeMark()?.click()
    await vi.waitFor(() => expect(dialog()).toBeNull())
    expect(opener.closest('[aria-hidden="true"]')).toBeNull()
  })

  it('holds the page behind still while it is open', async () => {
    const w = await opened()
    expect(document.body.style.overflow).toBe('hidden')
    await w.setProps({ open: false })
    await settle()
    expect(document.body.style.overflow).toBe('')
  })

  it('sits on a backdrop over the whole page', async () => {
    await opened()
    const backdrop = dialog()?.parentElement as HTMLElement
    expect(backdrop.parentElement).toBe(document.body)
    expect(backdrop.classList.contains('fixed')).toBe(true)
    expect(backdrop.classList.contains('inset-0')).toBe(true)
    expect(backdrop.classList.contains('bg-console/40')).toBe(true)
  })

  // Folded by the width of the space it opens in, as the rest of the kit folds,
  // not by a media query.
  it('folds to the full width when the space it opens in is narrow', async () => {
    await opened()
    expect(dialog()?.parentElement?.classList.contains('@container')).toBe(true)
    expect(dialog()?.classList.contains('@max-[640px]:w-full')).toBe(true)
    expect(dialog()?.classList.contains('@max-[640px]:max-w-none')).toBe(true)
  })

  it('is a short form’s width unless asked to be wide', async () => {
    const w = await opened()
    expect(dialog()?.classList.contains('max-w-[560px]')).toBe(true)
    await w.setProps({ size: 'wide' })
    expect(dialog()?.classList.contains('max-w-[760px]')).toBe(true)
  })

  it('draws the footer under the body, only when given one', async () => {
    const plain = await opened({}, { default: '<p>BODY</p>' })
    expect(dialog()?.lastElementChild?.textContent?.trim()).toBe('BODY')
    plain.unmount()

    await opened({}, { default: '<p>BODY</p>', footer: '<button>Save</button>' })
    expect(dialog()?.lastElementChild?.textContent?.trim()).toBe('Save')
  })

  it('says only the host’s words', async () => {
    await opened({}, { default: '<p>BODY</p>', footer: '<span>FOOT</span>' })
    expect(dialog()?.textContent?.replace(/\s/g, '')).toBe('EdittheitemBODYFOOT')
  })
})
