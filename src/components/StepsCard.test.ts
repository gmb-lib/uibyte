import { describe, expect, it } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { StepsCard } from '../index'
import StepsCardFile from './StepsCard.vue'
import type { StepItem } from './types'

const labels = { done: 'Done', now: 'To do now' }

const step = (key: string, done: boolean, extra: Partial<StepItem> = {}): StepItem => ({
  key,
  title: `Title ${key}`,
  text: `Text ${key}`,
  done,
  ...extra,
})

const act = (key: string) => ({ label: `Go ${key}`, href: `https://example.test/${key}` })

function mountCard(steps: StepItem[], props: Record<string, unknown> = {}) {
  return mount(StepsCardFile, { props: { heading: 'Set up', steps, labels, ...props } })
}

const stepEl = (w: ReturnType<typeof mountCard>, key: string) => w.get(`[data-step="${key}"]`)

describe('StepsCard', () => {
  it('draws the heading and the note as given', () => {
    const w = mountCard([step('a', false)], { heading: '1 of 3 done', note: 'Hide it later' })
    expect(w.get('h3').text()).toBe('1 of 3 done')
    expect(w.text()).toContain('Hide it later')
  })

  it('draws no note element without a note', () => {
    const w = mountCard([step('a', false)])
    expect(w.get('h3').element.parentElement?.children).toHaveLength(1)
    expect(w.text()).not.toContain('Hide it later')
  })

  it('is a region named by its heading, with the steps as an ordered list', () => {
    const w = mountCard([step('a', false)], { level: 2 })
    const heading = w.get('h2')
    expect(w.element.tagName).toBe('SECTION')
    expect(w.attributes('aria-labelledby')).toBe(heading.attributes('id'))
    expect(w.find('h3').exists()).toBe(false)
    expect(w.get('ol').findAll('li')).toHaveLength(1)
  })

  it('marks the first step now and the rest open, and only the first draws its action', () => {
    const w = mountCard([
      step('a', false, { action: act('a') }),
      step('b', false, { action: act('b') }),
      step('c', false, { action: act('c') }),
    ])
    expect(stepEl(w, 'a').attributes('data-step-state')).toBe('now')
    expect(stepEl(w, 'b').attributes('data-step-state')).toBe('open')
    expect(stepEl(w, 'c').attributes('data-step-state')).toBe('open')
    expect(stepEl(w, 'a').findAll('a')).toHaveLength(1)
    expect(stepEl(w, 'b').find('a').exists()).toBe(false)
    expect(stepEl(w, 'c').find('a').exists()).toBe(false)
    expect(w.findAll('a')).toHaveLength(1)
  })

  it('shows a done step with its tick hidden from a reader and its done word present', () => {
    const w = mountCard([
      step('a', true, { action: act('a') }),
      step('b', false, { action: act('b') }),
      step('c', false),
    ])
    const done = stepEl(w, 'a')
    expect(done.attributes('data-step-state')).toBe('done')
    const tick = done.get('[aria-hidden="true"]:not(.font-mono)')
    expect(tick.text()).toContain('✓')
    expect(done.get('.sr-only').text()).toBe(', Done')
    expect(done.find('a').exists()).toBe(false)
  })

  it('marks only the step to do now as the current step, with its now word', () => {
    const w = mountCard([step('a', true), step('b', false), step('c', false)])
    const now = stepEl(w, 'b')
    expect(now.attributes('aria-current')).toBe('step')
    expect(now.get('.sr-only').text()).toBe(', To do now')
    expect(stepEl(w, 'a').attributes('aria-current')).toBeUndefined()
    expect(stepEl(w, 'c').attributes('aria-current')).toBeUndefined()
    expect(w.findAll('[aria-current]')).toHaveLength(1)
    expect(stepEl(w, 'c').find('.sr-only').exists()).toBe(false)
  })

  it('has no step to do now and no action once every step is done', () => {
    const w = mountCard([step('a', true, { action: act('a') }), step('b', true, { action: act('b') })])
    expect(w.findAll('[data-step-state="now"]')).toHaveLength(0)
    expect(w.findAll('[data-step-state="done"]')).toHaveLength(2)
    expect(w.find('a').exists()).toBe(false)
    expect(w.find('[aria-current]').exists()).toBe(false)
  })

  it('draws nothing like a link or a button for a step to do now without an action', () => {
    const w = mountCard([step('a', false)], { linkComponent: RouterLinkStub })
    expect(stepEl(w, 'a').attributes('data-step-state')).toBe('now')
    expect(w.find('a').exists()).toBe(false)
    expect(w.find('button').exists()).toBe(false)
    expect(w.findComponent(RouterLinkStub).exists()).toBe(false)
  })

  it('draws an address as a plain anchor even when a link component is given', () => {
    const w = mountCard([step('a', false, { action: act('a') })], { linkComponent: RouterLinkStub })
    const a = w.get('a')
    expect(a.attributes('href')).toBe('https://example.test/a')
    expect(a.text()).toBe('Go a')
    expect(w.findComponent(RouterLinkStub).exists()).toBe(false)
  })

  it('draws a place inside the application with the link component, handed exactly its props', () => {
    const linkProps = { to: { name: 'printer' } }
    const w = mountCard([step('a', false, { action: { label: 'Open', linkProps } })], {
      linkComponent: RouterLinkStub,
    })
    const link = w.getComponent(RouterLinkStub)
    expect(link.props('to')).toEqual(linkProps.to)
    expect(link.text()).toBe('Open')
    expect(link.classes()).toContain('focus-visible:outline-focus')
  })

  it('falls back to a plain anchor for a place inside the application when no link component is given', () => {
    const w = mountCard([step('a', false, { action: { label: 'Open', linkProps: { href: '/printer' } } })])
    const a = w.get('a')
    expect(a.attributes('href')).toBe('/printer')
    expect(a.text()).toBe('Open')
  })

  it('puts its literal grid classes on the list, three columns by default', () => {
    const three = mountCard([step('a', false)]).get('ol').classes()
    expect(three).toEqual(expect.arrayContaining(['grid-cols-3', '@max-[640px]:grid-cols-1']))
    expect(three).not.toContain('grid-cols-5')
    const five = mountCard([step('a', false)], { columns: 5 }).get('ol').classes()
    expect(five).toEqual(
      expect.arrayContaining(['grid-cols-5', '@max-[980px]:grid-cols-3', '@max-[640px]:grid-cols-1']),
    )
    expect(five).not.toContain('grid-cols-3')
    const explicit = mountCard([step('a', false)], { columns: 3 }).get('ol').classes()
    expect(explicit).toContain('grid-cols-3')
  })

  it('writes each step key and state on its element', () => {
    const w = mountCard([step('a', true), step('b', false), step('c', false)])
    const rows = w.findAll('li')
    expect(rows.map((r) => r.attributes('data-step'))).toEqual(['a', 'b', 'c'])
    expect(rows.map((r) => r.attributes('data-step-state'))).toEqual(['done', 'now', 'open'])
  })

  it('wraps a long word inside its column instead of widening the card', () => {
    const w = mountCard([step('a', false, { title: 'x'.repeat(80), text: 'y'.repeat(80) })])
    expect(stepEl(w, 'a').classes()).toContain('min-w-0')
    expect(stepEl(w, 'a').get('b').classes()).toContain('break-words')
    expect(stepEl(w, 'a').get('small').classes()).toContain('break-words')
  })

  it('draws the heading and an empty list for no steps, without failing', () => {
    const w = mountCard([])
    expect(w.get('h3').text()).toBe('Set up')
    expect(w.get('ol').findAll('li')).toHaveLength(0)
  })

  it('is exported from the package entry', () => {
    expect(StepsCard).toBe(StepsCardFile)
  })
})
