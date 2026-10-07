import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import FoldMore from './FoldMore.vue'

const names = ['Anna', 'Jānis', 'Ilze', 'Marta', 'Pēteris', 'Valdis', 'Līga']

afterEach(() => {
  document.body.innerHTML = ''
})

const shown = (w: ReturnType<typeof mount>) => w.findAll('li').map((li) => li.text().replace('·', '').trim())

describe('FoldMore', () => {
  it('shows the first few and the host’s words for the rest', () => {
    const w = mount(FoldMore<string>, { props: { items: names, moreLabel: '+ 2 more' } })
    expect(shown(w)).toEqual(['Anna', 'Jānis', 'Ilze', 'Marta', 'Pēteris'])
    expect(w.get('button').text()).toBe('+ 2 more')
  })

  it('separates them for the eye only', () => {
    const w = mount(FoldMore<string>, { props: { items: names.slice(0, 2), moreLabel: 'x' } })
    expect(w.findAll('li')[1].get('[aria-hidden="true"]').text()).toBe('·')
    expect(w.findAll('li')[0].find('[aria-hidden="true"]').exists()).toBe(false)
  })

  it('unfolds where it stands when the rest is asked for, and gives focus to the list', async () => {
    const w = mount(FoldMore<string>, { props: { items: names, moreLabel: '+ 2 more' }, attachTo: document.body })
    await w.get('button').trigger('click')
    await nextTick()
    expect(shown(w)).toEqual(names)
    expect(w.find('button').exists()).toBe(false)
    expect(document.activeElement).toBe(w.get('ul').element)
  })

  // A match behind the fold is a match the person never sees.
  it('shows everything while the host holds it open', () => {
    const w = mount(FoldMore<string>, { props: { items: names, moreLabel: '+ 2 more', open: true } })
    expect(shown(w)).toEqual(names)
    expect(w.find('button').exists()).toBe(false)
  })

  it('offers no fold when everything fits', () => {
    const w = mount(FoldMore<string>, { props: { items: names.slice(0, 5), moreLabel: '+ 0 more' } })
    expect(w.find('button').exists()).toBe(false)
  })

  it('folds at the limit the host gives', () => {
    const w = mount(FoldMore<string>, { props: { items: names, moreLabel: '+ 4 more', limit: 3 } })
    expect(shown(w)).toHaveLength(3)
  })

  it('draws each one through the host’s slot when given', () => {
    const w = mount(FoldMore<string>, {
      props: { items: names.slice(0, 2), moreLabel: 'x' },
      slots: { default: '<template #default="{ item }"><b>{{ item }}</b></template>' },
    })
    expect(w.findAll('b').map((b) => b.text())).toEqual(['Anna', 'Jānis'])
  })

  it('shows a visible focus ring on the words for the rest', () => {
    const w = mount(FoldMore<string>, { props: { items: names, moreLabel: '+ 2 more' } })
    expect(w.get('button').classes()).toContain('focus-visible:outline-focus')
  })
})
