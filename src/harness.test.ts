import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

// Proves the test harness itself — a component mounts against a real DOM and its
// rendered output is inspectable. Every component test that follows relies on
// this, so it is worth failing loudly here rather than inside the first feature.
describe('test harness', () => {
  it('mounts a component and renders it into the DOM', () => {
    const Probe = defineComponent({
      props: { label: { type: String, required: true } },
      setup: (props) => () => h('span', { class: 'probe' }, props.label),
    })

    const wrapper = mount(Probe, { props: { label: 'rendered' } })

    expect(wrapper.get('span.probe').text()).toBe('rendered')
    expect(wrapper.element.ownerDocument).toBe(document)
  })
})
