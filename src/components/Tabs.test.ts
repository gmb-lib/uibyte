import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Tabs from './Tabs.vue'
import type { TabItem } from './types'

const tabs: TabItem[] = [
  { key: 'one', label: 'One' },
  { key: 'two', label: 'Two', tag: '3' },
  { key: 'three', label: 'Three', disabled: true },
  { key: 'four', label: 'Four' },
]

function mountTabs(modelValue = 'one', slot = true) {
  return mount(Tabs, {
    props: { tabs, modelValue, label: 'Sections' },
    ...(slot ? { slots: { default: '<p>panel body</p>' } } : {}),
    attachTo: document.body,
  })
}

describe('Tabs', () => {
  it('draws one control per choice, and says which set they belong to', () => {
    const w = mountTabs()
    expect(w.get('[role="tablist"]').attributes('aria-label')).toBe('Sections')
    expect(w.findAll('[role="tab"]')).toHaveLength(4)
    expect(w.text()).toContain('One')
    expect(w.text()).toContain('3')
  })

  it('marks exactly one chosen, and says so where a reader will hear it', () => {
    const w = mountTabs('two')
    const chosen = w.findAll('[role="tab"]').filter((b) => b.attributes('aria-selected') === 'true')
    expect(chosen).toHaveLength(1)
    expect(chosen[0].text()).toContain('Two')
  })

  it('asks for a choice rather than making one', async () => {
    const w = mountTabs()
    await w.findAll('[role="tab"]')[1].trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['two']])

    // The strip does not move on its own: the prop still says what it said.
    expect(w.get('[role="tab"]').attributes('aria-selected')).toBe('true')
  })

  it('says nothing when the choice already made is chosen again', async () => {
    const w = mountTabs()
    await w.findAll('[role="tab"]')[0].trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  // The strip is ONE tab stop. Four choices meaning four stops is how a keyboard
  // reader ends up pressing Tab eleven times to get past a row of chips.
  it('is a single stop in the page order', () => {
    const w = mountTabs('two')
    const stops = w.findAll('[role="tab"]').map((b) => b.attributes('tabindex'))
    expect(stops).toEqual(['-1', '0', '-1', '-1'])
  })

  it('puts the stop on the first choosable one when nothing is chosen yet', () => {
    const w = mountTabs('nothing-matches')
    const stops = w.findAll('[role="tab"]').map((b) => b.attributes('tabindex'))
    expect(stops).toEqual(['0', '-1', '-1', '-1'])
  })

  // This is the half every hand-drawn copy was missing, and the reason the
  // component exists: announcing a tab list obliges the arrow keys to work.
  it('moves along the strip with the arrow keys, and wraps', async () => {
    const w = mountTabs()
    const buttons = w.findAll('[role="tab"]')

    await buttons[0].trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['two'])

    await buttons[0].trigger('keydown', { key: 'ArrowLeft' })
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['four'])
  })

  it('steps over a choice that cannot be made', async () => {
    const w = mountTabs('two')
    await w.findAll('[role="tab"]')[1].trigger('keydown', { key: 'ArrowRight' })

    // Three is disabled, so right from Two lands on Four.
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['four'])
  })

  it('goes to the ends with Home and End', async () => {
    const w = mountTabs('two')
    const buttons = w.findAll('[role="tab"]')

    await buttons[1].trigger('keydown', { key: 'End' })
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['four'])

    await buttons[1].trigger('keydown', { key: 'Home' })
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['one'])
  })

  it('ignores keys it does not own', async () => {
    const w = mountTabs()
    await w.findAll('[role="tab"]')[0].trigger('keydown', { key: 'a' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  // Shown, never hidden — the same posture as a locked navigation item. A person
  // may need to know a thing exists before they can ask for it.
  it('draws a choice that cannot be made, announces it, and refuses it', async () => {
    const w = mountTabs()
    const locked = w.findAll('[role="tab"]')[2]

    expect(locked.text()).toContain('Three')
    expect(locked.attributes('aria-disabled')).toBe('true')

    await locked.trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('never puts the only stop on a choice that cannot be made', () => {
    const w = mount(Tabs, {
      props: {
        tabs: [
          { key: 'locked', label: 'Locked', disabled: true },
          { key: 'open', label: 'Open' },
        ],
        modelValue: '',
        label: 'Sections',
      },
    })
    expect(w.findAll('[role="tab"]').map((b) => b.attributes('tabindex'))).toEqual(['-1', '0'])
  })

  it('wires the panel to the choice that opened it', () => {
    const w = mountTabs('two')
    const panel = w.get('[role="tabpanel"]')
    const chosen = w.findAll('[role="tab"]')[1]

    expect(panel.attributes('aria-labelledby')).toBe(chosen.attributes('id'))
    expect(chosen.attributes('aria-controls')).toBe(panel.attributes('id'))
    expect(panel.text()).toContain('panel body')
  })

  it('renders no panel, and promises none, when the host supplies no content', () => {
    const w = mountTabs('one', false)
    expect(w.find('[role="tabpanel"]').exists()).toBe(false)
    expect(w.get('[role="tab"]').attributes('aria-controls')).toBeUndefined()
  })

  // Two strips on one page must not share identifiers, or a panel ends up
  // labelled by somebody else's choice. Mounted inside ONE page, because that
  // is the only way the collision can happen.
  it('keeps two strips on one page apart', () => {
    const page = mount(
      {
        components: { Tabs },
        template: `
          <div>
            <Tabs :tabs="tabs" model-value="one" label="First" />
            <Tabs :tabs="tabs" model-value="one" label="Second" />
          </div>`,
        data: () => ({ tabs }),
      },
      { global: { components: { Tabs } } },
    )

    const ids = page.findAll('[role="tab"]').map((b) => b.attributes('id'))
    expect(new Set(ids).size).toBe(ids.length)
  })
})
