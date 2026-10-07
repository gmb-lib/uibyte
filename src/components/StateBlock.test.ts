import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StateBlock from './StateBlock.vue'

describe('StateBlock', () => {
  it('says a read is under way politely, in the host’s words', () => {
    const w = mount(StateBlock, { props: { state: 'loading', text: 'Reading…' } })
    expect(w.get('[role="status"]').text()).toBe('Reading…')
    expect(w.find('[role="alert"]').exists()).toBe(false)
  })

  it('says an empty answer politely: what is true, and what to do', () => {
    const w = mount(StateBlock, {
      props: { state: 'empty', title: 'Nothing added yet', text: 'Add the first one.' },
      slots: { actions: '<button>Add one</button>' },
    })
    expect(w.get('[role="status"]').text()).toBe('Nothing added yetAdd the first one.')
    expect(w.text()).toContain('Add one')
  })

  // A failure is the one a reader must not miss, so it interrupts.
  it('says a failure at once', () => {
    const w = mount(StateBlock, { props: { state: 'failed', title: 'The list is not answering', text: 'Nothing is lost.' } })
    expect(w.get('[role="alert"]').text()).toBe('The list is not answeringNothing is lost.')
    expect(w.find('[role="status"]').exists()).toBe(false)
  })

  it('draws a failure in its own look, apart from an empty answer', () => {
    const failed = mount(StateBlock, { props: { state: 'failed', title: 'Not answering' } })
    const empty = mount(StateBlock, { props: { state: 'empty', title: 'Nothing yet' } })
    expect(failed.classes()).toContain('border-l-status-blocked')
    expect(empty.classes()).not.toContain('border-l-status-blocked')
  })

  it('offers to try again when the host gives the words, and asks the host to do it', async () => {
    const w = mount(StateBlock, { props: { state: 'failed', title: 'Not answering', retryLabel: 'Try again' } })
    const button = w.get('button')
    expect(button.text()).toBe('Try again')
    await button.trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
  })

  // With another way on beside it, a retry without words would still be drawn —
  // an empty button a reader hears as "button" and nothing else.
  it('offers no retry it was not given words for, even beside the host’s own actions', () => {
    const w = mount(StateBlock, {
      props: { state: 'failed', title: 'Not answering' },
      slots: { actions: '<a href="/back">Back</a>' },
    })
    expect(w.find('button').exists()).toBe(false)
    expect(w.text()).toContain('Back')
  })

  it('offers a retry only for a failure — never for a read that answered or is still going', () => {
    for (const state of ['loading', 'empty'] as const) {
      const w = mount(StateBlock, { props: { state, title: 'x', retryLabel: 'Try again' } })
      expect(w.find('button').exists()).toBe(false)
    }
  })

  // The announcement carries what happened; the buttons are not read out with it.
  it('keeps the actions out of the announcement', () => {
    const w = mount(StateBlock, {
      props: { state: 'failed', title: 'Not answering', retryLabel: 'Try again' },
      slots: { actions: '<a href="/back">Back</a>' },
    })
    const alert = w.get('[role="alert"]')
    expect(alert.find('button').exists()).toBe(false)
    expect(alert.find('a').exists()).toBe(false)
    expect(w.text()).toContain('Back')
  })

  it('draws no actions while a read is still under way', () => {
    const w = mount(StateBlock, { props: { state: 'loading' }, slots: { actions: '<button>Add one</button>' } })
    expect(w.find('button').exists()).toBe(false)
  })

  // There is no prop a service's code could travel through, so no screen can
  // print one here by accident.
  it('takes words and a state, and nothing a code could be passed in', () => {
    expect(Object.keys(StateBlock.props ?? {}).sort()).toEqual(['retryLabel', 'size', 'state', 'text', 'title'])
  })

  it('draws no word of its own', () => {
    for (const state of ['loading', 'empty', 'failed'] as const) {
      expect(mount(StateBlock, { props: { state } }).text()).toBe('')
    }
  })

  it('centres a page’s empty state and keeps a block’s quiet', () => {
    const page = mount(StateBlock, { props: { state: 'empty', title: 'Nothing yet', size: 'page' } })
    const block = mount(StateBlock, { props: { state: 'empty', title: 'Nothing yet' } })
    expect(page.classes()).toContain('text-center')
    expect(block.classes()).not.toContain('text-center')
  })

  it('says which state it is in, for a host’s own tests', () => {
    expect(mount(StateBlock, { props: { state: 'failed' } }).attributes('data-state')).toBe('failed')
  })
})
