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

  describe('going back', () => {
    it('offers no way back unless the host gives words for it', async () => {
      const w = mount(FoldMore<string>, { props: { items: names, moreLabel: '+ 2 more' } })
      await w.get('button').trigger('click')
      expect(w.find('button').exists()).toBe(false)
    })

    it('folds back to the limit and returns focus to the button for the rest', async () => {
      const w = mount(FoldMore<string>, {
        props: { items: names, moreLabel: '+ 2 more', fewerLabel: 'Show fewer' },
        attachTo: document.body,
      })
      expect(w.findAll('button')).toHaveLength(1)
      await w.get('button').trigger('click')
      expect(shown(w)).toEqual(names)
      expect(w.get('button').text()).toBe('Show fewer')
      await w.get('button').trigger('click')
      await nextTick()
      expect(shown(w)).toHaveLength(5)
      expect(w.get('button').text()).toBe('+ 2 more')
      expect(document.activeElement).toBe(w.get('button').element)
    })

    it('offers no way back when the list fits or the host holds it open', () => {
      const fits = mount(FoldMore<string>, { props: { items: names.slice(0, 3), moreLabel: 'x', fewerLabel: 'Show fewer' } })
      expect(fits.find('button').exists()).toBe(false)
      const held = mount(FoldMore<string>, { props: { items: names, moreLabel: 'x', fewerLabel: 'Show fewer', open: true } })
      expect(held.find('button').exists()).toBe(false)
    })
  })

  describe('keep', () => {
    const keepLiga = (n: string) => n === 'Līga'

    it('shows a kept item beyond the limit, in its place, and counts only what is still hidden', () => {
      const labels: number[] = []
      const w = mount(FoldMore<string>, {
        props: {
          items: names,
          keep: keepLiga,
          moreLabel: (n: number) => {
            labels.push(n)
            return `+ ${n} more`
          },
        },
      })
      expect(shown(w)).toEqual(['Anna', 'Jānis', 'Ilze', 'Marta', 'Pēteris', 'Līga'])
      expect(w.get('button').text()).toBe('+ 1 more')
      expect(labels.at(-1)).toBe(1)
    })

    it('keeps a kept item in its place among the shown ones', () => {
      const w = mount(FoldMore<string>, {
        props: { items: names, limit: 2, keep: (n: string) => n === 'Marta', moreLabel: 'x' },
      })
      expect(shown(w)).toEqual(['Anna', 'Jānis', 'Marta'])
    })

    it('offers no button for the rest when everything beyond the limit is kept', () => {
      const w = mount(FoldMore<string>, {
        props: { items: names, keep: (n: string) => n === 'Valdis' || n === 'Līga', moreLabel: 'x' },
      })
      expect(shown(w)).toEqual(['Anna', 'Jānis', 'Ilze', 'Marta', 'Pēteris', 'Valdis', 'Līga'])
      expect(w.find('button').exists()).toBe(false)
    })

    it('gives the slot the item’s place in the whole list', () => {
      const seen: number[] = []
      mount(FoldMore<string>, {
        props: { items: names, keep: keepLiga, moreLabel: 'x' },
        slots: {
          default: (scope: { item: string; index: number }) => {
            seen.push(scope.index)
            return scope.item
          },
        },
      })
      expect(seen).toEqual([0, 1, 2, 3, 4, 6])
    })
  })

  describe('rows layout', () => {
    it('draws each item as a block row with no separators, the button under them', () => {
      const w = mount(FoldMore<string>, { props: { items: names, moreLabel: '+ 2 more', layout: 'rows' } })
      expect(w.findAll('li')).toHaveLength(5)
      for (const li of w.findAll('li')) expect(li.classes()).toContain('block')
      expect(w.find('[aria-hidden="true"]').exists()).toBe(false)
      expect(w.get('ul').classes()).toContain('block')
      expect(w.get('button').classes()).toContain('block')
    })

    it('keeps the inline layout as the default', () => {
      const w = mount(FoldMore<string>, { props: { items: names, moreLabel: '+ 2 more' } })
      expect(w.findAll('li')[1].classes()).toContain('inline')
      expect(w.findAll('li')[1].find('[aria-hidden="true"]').exists()).toBe(true)
    })
  })
})
