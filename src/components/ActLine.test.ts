import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ActLine from './ActLine.vue'
import type { ActOutcome } from './types'

describe('ActLine', () => {
  it('says what an act did, politely, toned as done', () => {
    const w = mount(ActLine, { props: { outcome: 'done', text: 'Anna was added.' } })
    expect(w.get('[role="status"]').text()).toBe('Anna was added.')
    expect(w.find('[role="alert"]').exists()).toBe(false)
    expect(w.classes()).toContain('bg-status-ontrack-bg')
  })

  // A refusal is the one a person must not miss.
  it('says why an act was refused at once, toned as refused', () => {
    const w = mount(ActLine, { props: { outcome: 'refused', text: 'Only an administrator can do that.' } })
    expect(w.get('[role="alert"]').text()).toBe('Only an administrator can do that.')
    expect(w.find('[role="status"]').exists()).toBe(false)
    expect(w.classes()).toContain('bg-status-late-bg')
  })

  // Something that happened to a person, neither an act they finished nor a refusal.
  it('tells what happened to the person, politely, toned as a notice', () => {
    const w = mount(ActLine, { props: { outcome: 'notice', text: 'Your access to that place ended.' } })
    expect(w.attributes('data-outcome')).toBe('notice')
    expect(w.classes()).toContain('bg-status-blocked-bg')
    expect(w.classes()).toContain('text-status-blocked-fg')
    expect(w.classes()).not.toContain('bg-status-ontrack-bg')
    expect(w.classes()).not.toContain('bg-status-late-bg')
    expect(w.get('[role="status"]').text()).toBe('Your access to that place ended.')
    expect(w.find('[role="alert"]').exists()).toBe(false)
  })

  it('takes all three outcomes as the type of an outcome', () => {
    const all: ActOutcome[] = ['done', 'refused', 'notice']
    expect(all).toHaveLength(3)
  })

  it('puts a way on beside the sentence, outside what is announced', () => {
    const w = mount(ActLine, {
      props: { outcome: 'done', text: 'Item 21 was made.' },
      slots: { action: '<a href="/items/21">Open it</a>' },
    })
    expect(w.get('[role="status"]').find('a').exists()).toBe(false)
    expect(w.get('a').text()).toBe('Open it')
  })

  it('says nothing but the host’s sentence', () => {
    expect(mount(ActLine, { props: { outcome: 'done', text: 'Saved.' } }).text()).toBe('Saved.')
  })

  it('says which outcome it shows, for a host’s own tests', () => {
    expect(mount(ActLine, { props: { outcome: 'refused', text: 'x' } }).attributes('data-outcome')).toBe('refused')
  })
})
