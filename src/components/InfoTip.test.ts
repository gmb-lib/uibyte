import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import InfoTip from './InfoTip.vue'

const TEXT = 'A line that explains the setting in a few sentences.'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

function make(props = {}) {
  return mount(InfoTip, {
    props: { label: 'About this setting', ...props },
    slots: { default: TEXT },
    attachTo: document.body,
  })
}

const panelOf = (w: ReturnType<typeof make>) =>
  document.getElementById(w.get('button').attributes('aria-controls') as string) as HTMLElement
const isOpen = (w: ReturnType<typeof make>) =>
  w.get('button').attributes('aria-expanded') === 'true' && panelOf(w).style.display !== 'none'

describe('InfoTip', () => {
  it('is a real button of type button, named by the label prop', () => {
    const w = make()
    const b = w.get('button')
    expect(b.element.tagName).toBe('BUTTON')
    expect(b.attributes('type')).toBe('button')
    expect(b.attributes('aria-label')).toBe('About this setting')
  })

  it('is closed at first: aria-expanded is false and the panel is hidden', () => {
    const w = make()
    expect(w.get('button').attributes('aria-expanded')).toBe('false')
    expect(panelOf(w).style.display).toBe('none')
  })

  it('refers to its panel by aria-controls, and the id is on the panel that holds the text', () => {
    const w = make()
    const panel = panelOf(w)
    expect(panel).not.toBeNull()
    expect(panel.textContent).toContain(TEXT)
  })

  it('renders the default slot as the panel text', async () => {
    const w = make()
    await w.get('button').trigger('click')
    expect(panelOf(w).textContent).toContain(TEXT)
  })

  it('opens on mouse hover', async () => {
    const w = make()
    await w.trigger('mouseenter')
    expect(isOpen(w)).toBe(true)
  })

  it('opens on keyboard focus', async () => {
    const w = make()
    await w.get('button').trigger('focus')
    expect(isOpen(w)).toBe(true)
  })

  it('opens on a press', async () => {
    const w = make()
    await w.get('button').trigger('click')
    expect(isOpen(w)).toBe(true)
  })

  it('closes on a second press', async () => {
    const w = make()
    await w.get('button').trigger('click')
    await w.get('button').trigger('click')
    expect(isOpen(w)).toBe(false)
  })

  it('a press after the focus that came with it still ends open, and the next press closes', async () => {
    const w = make()
    await w.get('button').trigger('focus')
    await w.get('button').trigger('click')
    expect(isOpen(w)).toBe(true)
    await w.get('button').trigger('click')
    expect(isOpen(w)).toBe(false)
  })

  it('closes on Escape and keeps the focus on the button', async () => {
    const w = make()
    const b = w.get('button')
    ;(b.element as HTMLElement).focus()
    await b.trigger('click')
    expect(isOpen(w)).toBe(true)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await w.vm.$nextTick()
    expect(isOpen(w)).toBe(false)
    expect(document.activeElement).toBe(b.element)
  })

  it('closes on blur', async () => {
    const w = make()
    await w.get('button').trigger('focus')
    await w.get('button').trigger('blur')
    expect(isOpen(w)).toBe(false)
  })

  it('closes on a press outside it, and not on a press inside its panel', async () => {
    const w = make()
    await w.get('button').trigger('click')
    panelOf(w).dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await w.vm.$nextTick()
    expect(isOpen(w)).toBe(true)
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await w.vm.$nextTick()
    expect(isOpen(w)).toBe(false)
  })

  it('closes after a short delay when the mouse leaves, and stays if it comes back', async () => {
    const w = make()
    await w.trigger('mouseenter')
    await w.trigger('mouseleave')
    expect(isOpen(w)).toBe(true)
    await w.trigger('mouseenter')
    vi.advanceTimersByTime(1000)
    await w.vm.$nextTick()
    expect(isOpen(w)).toBe(true)
    await w.trigger('mouseleave')
    vi.advanceTimersByTime(1000)
    await w.vm.$nextTick()
    expect(isOpen(w)).toBe(false)
  })

  it('stays open after a press when the pointer leaves, and a second press closes it', async () => {
    const w = make()
    await w.trigger('mouseenter')
    await w.get('button').trigger('click')
    await w.trigger('mouseleave')
    vi.advanceTimersByTime(1000)
    await w.vm.$nextTick()
    expect(isOpen(w)).toBe(true)
    await w.get('button').trigger('click')
    expect(isOpen(w)).toBe(false)
  })

  it('has a pressable box of 24 by 24 px around an 18 px drawn circle, and the ring on the box', () => {
    const w = make()
    const b = w.get('button')
    expect(b.classes()).toContain('h-6')
    expect(b.classes()).toContain('w-6')
    expect(b.classes().join(' ')).toContain('focus-visible:outline-focus')
    const circle = w.get('button span')
    expect(circle.classes()).toContain('h-[18px]')
    expect(circle.classes()).toContain('w-[18px]')
  })

  describe('placement', () => {
    // jsdom draws nothing, so the window and the boxes are stated here: a 900 px high window, the button
    // at the given top, and a panel as tall as given, drawn below the button as it starts.
    function place(buttonTop: number, panelHeight: number) {
      vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(900)
      vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(390)
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
        const box = (top: number, height: number) =>
          ({ top, bottom: top + height, left: 20, right: 200, width: 180, height, x: 20, y: top }) as DOMRect
        if (this.tagName === 'BUTTON') return box(buttonTop, 24)
        if (this.id.endsWith('-panel')) return box(buttonTop + 24, panelHeight)
        return box(0, 0)
      })
    }
    const opened = async (w: ReturnType<typeof make>) => {
      await w.get('button').trigger('click')
      await w.vm.$nextTick()
      await w.vm.$nextTick()
    }
    const isAbove = (w: ReturnType<typeof make>) => panelOf(w).classList.contains('bottom-full')

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('opens below the button when there is room', async () => {
      place(100, 200)
      const w = make()
      await opened(w)
      expect(isAbove(w)).toBe(false)
      expect(panelOf(w).classList.contains('top-full')).toBe(true)
    })

    it('opens above, keeping its gap, when it would pass the bottom and there is more room above', async () => {
      place(780, 200)
      const w = make()
      await opened(w)
      expect(isAbove(w)).toBe(true)
      expect(panelOf(w).classList.contains('pb-1.5')).toBe(true)
    })

    it('stays below when it would pass the bottom but there is even less room above', async () => {
      place(300, 700)
      const w = make()
      await opened(w)
      expect(isAbove(w)).toBe(false)
    })
  })

  it('does not close on blur while the pointer is over its panel, so the text can be selected', async () => {
    const w = make()
    await w.trigger('mouseenter')
    await w.get('button').trigger('blur')
    expect(isOpen(w)).toBe(true)
  })

  it('draws the mark as text hidden from a reader, and the panel with the kit tokens', () => {
    const w = make()
    const mark = w.get('button span')
    expect(mark.text()).toBe('i')
    expect(mark.attributes('aria-hidden')).toBe('true')
    expect(w.get('button').classes().join(' ')).toContain('focus-visible:outline-focus')
    const box = panelOf(w).firstElementChild as HTMLElement
    expect(box.className).toContain('bg-console')
    expect(box.className).toContain('text-console-text')
    expect(box.className).toContain('max-w-[min(440px,calc(100vw-32px))]')
  })
})
