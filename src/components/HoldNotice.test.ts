import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import HoldNotice from './HoldNotice.vue'

const words = { actionLabel: 'Reload' }
const sentence = 'This page is for another place now.'

afterEach(() => {
  document.body.innerHTML = ''
})
enableAutoUnmount(afterEach)

const notice = () => document.querySelector<HTMLElement>('[role="alertdialog"]')
const press = (el: Element) =>
  el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 }))
const key = (el: Element, k: string) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))

async function settle() {
  await flushPromises()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await flushPromises()
}

async function opened(props: Record<string, unknown> = {}) {
  const w = mount(HoldNotice, {
    props: { ...words, open: true, ...props },
    slots: { default: sentence },
    attachTo: document.body,
  })
  await settle()
  return w
}

// A page with something on it that could be pressed, and the notice over it.
const Page = defineComponent({
  props: { open: Boolean },
  setup(props) {
    return () =>
      h('div', [
        h('button', { id: 'under' }, 'Under'),
        h(HoldNotice, { ...words, open: props.open }, { default: () => sentence }),
      ])
  },
})

describe('HoldNotice', () => {
  it('is an alert dialog named by the sentence, with one button and focus on it, and no warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    await opened()
    const d = notice()
    expect(d).not.toBeNull()
    expect(d?.hasAttribute('data-hold')).toBe(true)
    const name = document.getElementById(d?.getAttribute('aria-labelledby') ?? '')
    expect(name?.textContent?.trim()).toBe(sentence)
    expect(d?.contains(name)).toBe(true)
    expect(d?.hasAttribute('aria-describedby')).toBe(false)
    expect(warn).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
    warn.mockRestore()
    error.mockRestore()
    const buttons = d?.querySelectorAll('button') ?? []
    expect(buttons).toHaveLength(1)
    expect(buttons[0].textContent?.trim()).toBe('Reload')
    expect(document.activeElement).toBe(buttons[0])
  })

  it('stays when Escape is pressed or a press lands outside it, and says nothing', async () => {
    const w = await opened()
    key(document.activeElement as HTMLElement, 'Escape')
    key(document.body, 'Escape')
    await settle()
    expect(notice()).not.toBeNull()

    press(notice()?.parentElement as HTMLElement)
    press(document.body)
    ;(notice()?.parentElement as HTMLElement).click()
    await settle()
    expect(notice()).not.toBeNull()
    expect(w.emitted('act')).toBeUndefined()
    expect(w.emitted()).toEqual({})
  })

  it('has no close mark: its one button is the act', async () => {
    await opened()
    expect(document.querySelector('[aria-label="Close"]')).toBeNull()
    expect(notice()?.querySelectorAll('button,[role="button"]')).toHaveLength(1)
  })

  it('tells the host once when its button is pressed', async () => {
    const w = await opened()
    ;(notice()?.querySelector('button') as HTMLElement).click()
    await settle()
    expect(w.emitted('act')).toEqual([[]])
    // Pressing it does not take the notice away: that is the host's.
    expect(notice()).not.toBeNull()
  })

  it('puts nothing of itself in the page while it is not open, and takes it away when told', async () => {
    const w = mount(HoldNotice, { props: { ...words, open: false }, slots: { default: sentence }, attachTo: document.body })
    await settle()
    expect(notice()).toBeNull()
    expect(document.body.textContent).not.toContain(sentence)
    expect(document.querySelector('[data-hold]')).toBeNull()

    await w.setProps({ open: true })
    await settle()
    expect(notice()).not.toBeNull()
    await w.setProps({ open: false })
    await settle()
    expect(notice()).toBeNull()
    expect(document.body.textContent).not.toContain(sentence)
  })

  // The same two assertions the window's tests make for the page behind it.
  it('hides the page behind from a reader and holds it still while it is open', async () => {
    const w = mount(Page, { props: { open: false }, attachTo: document.body })
    const under = w.get('#under').element as HTMLElement
    expect(under.closest('[aria-hidden="true"]')).toBeNull()

    await w.setProps({ open: true })
    await settle()
    expect(under.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(notice()?.closest('[aria-hidden="true"]')).toBeNull()
    expect(document.body.style.overflow).toBe('hidden')

    await w.setProps({ open: false })
    await settle()
    expect(under.closest('[aria-hidden="true"]')).toBeNull()
    expect(document.body.style.overflow).toBe('')
  })

  // jsdom never moves focus on a simulated Tab, so a trap cannot be proven here; what it can show is
  // that the notice holds exactly one thing that takes focus, so a trap has only one place to hold.
  it('holds one thing that takes focus, and focus is on it', async () => {
    await opened()
    const focusable = notice()?.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
    expect(focusable).toHaveLength(1)
    expect(document.activeElement).toBe(focusable?.[0])
  })

  it('is modal, and draws above the drawer and every open list (both z-50)', async () => {
    await opened()
    expect(notice()?.getAttribute('aria-modal')).toBe('true')
    const layer = (notice()?.parentElement as HTMLElement).className.match(/(?:^|\s)z-\[(\d+)\]/)
    expect(layer).not.toBeNull()
    expect(Number(layer?.[1])).toBeGreaterThan(50)
  })

  it('lets a long translated label wrap inside the panel, the button growing in height', async () => {
    const label = 'Ielādēt lapu no jauna, lai turpinātu darbu ar izvēlēto uzņēmumu '.repeat(2).slice(0, 120)
    expect(label).toHaveLength(120)
    await opened({ actionLabel: label })
    const button = notice()?.querySelector('button') as HTMLElement
    expect(button.textContent?.trim()).toBe(label.trim())
    expect(button.classList).toContain('whitespace-normal')
    expect(button.classList).toContain('h-auto')
    expect(button.classList).toContain('min-h-10')
    expect(button.classList).not.toContain('whitespace-nowrap')
    expect(button.classList).not.toContain('h-10')
  })

  // The window's own tests assert only that the body is held from scrolling, not that it takes no
  // presses; the primitive sets pointer-events on the body, which this asserts for the notice.
  it('takes no press on the page under it while it is open, and gives them back when it is not', async () => {
    const w = await opened()
    expect(document.body.style.pointerEvents).toBe('none')
    expect((notice()?.parentElement as HTMLElement).style.pointerEvents).toBe('auto')
    await w.setProps({ open: false })
    await settle()
    expect(document.body.style.pointerEvents).not.toBe('none')
  })
})
