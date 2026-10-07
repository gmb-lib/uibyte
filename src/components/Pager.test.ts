import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Pager from './Pager.vue'

const words = { label: 'Pages', previousLabel: 'Previous page', nextLabel: 'Next page', pageLabel: (n: number) => `Page ${n}` }

const pager = (page: number, pages: number) =>
  mount(Pager, { props: { ...words, page, pages, range: `${(page - 1) * 25 + 1}–${Math.min(page * 25, 138)} of 138` } })

const drawn = (w: ReturnType<typeof pager>) =>
  w.findAll('button, span[aria-hidden="true"]').map((el) => (el.element.tagName === 'BUTTON' ? el.attributes('aria-label') : el.text()))

describe('Pager', () => {
  it('is a named navigation that says where this page sits, in the host’s words', () => {
    const w = pager(1, 6)
    expect(w.get('nav').attributes('aria-label')).toBe('Pages')
    expect(w.text()).toContain('1–25 of 138')
  })

  it('draws the first and last pages, the ones either side, and a gap for the rest', () => {
    expect(drawn(pager(4, 29))).toEqual([
      'Previous page', '‹', 'Page 1', '…', 'Page 3', 'Page 4', 'Page 5', '…', 'Page 29', 'Next page', '›',
    ])
  })

  it('draws no gap where no page is left out', () => {
    expect(drawn(pager(2, 4))).toEqual(['Previous page', '‹', 'Page 1', 'Page 2', 'Page 3', 'Page 4', 'Next page', '›'])
  })

  it('announces the page shown as the current one', () => {
    const w = pager(3, 6)
    const current = w.findAll('[aria-current="page"]')
    expect(current).toHaveLength(1)
    expect(current[0].text()).toBe('3')
  })

  it('asks for the page before, after, or the one chosen', async () => {
    const w = pager(3, 6)
    await w.get('[aria-label="Previous page"]').trigger('click')
    await w.get('[aria-label="Next page"]').trigger('click')
    await w.get('[aria-label="Page 6"]').trigger('click')
    expect(w.emitted('update:page')).toEqual([[2], [4], [6]])
  })

  it('asks for nothing when the page chosen is the one shown', async () => {
    const w = pager(3, 6)
    await w.get('[aria-label="Page 3"]').trigger('click')
    expect(w.emitted('update:page')).toBeUndefined()
  })

  it('cannot go before the first page or past the last', () => {
    expect(pager(1, 6).get('[aria-label="Previous page"]').attributes('disabled')).toBeDefined()
    expect(pager(6, 6).get('[aria-label="Next page"]').attributes('disabled')).toBeDefined()
    expect(pager(3, 6).get('[aria-label="Next page"]').attributes('disabled')).toBeUndefined()
  })

  it('offers no way through a single page, and still says where it sits', () => {
    const w = mount(Pager, { props: { ...words, page: 1, pages: 1, range: '1–12 of 12' } })
    expect(w.find('button').exists()).toBe(false)
    expect(w.text()).toBe('1–12 of 12')
  })

  it('shows a visible focus ring on its buttons', () => {
    expect(pager(2, 6).get('button').classes()).toContain('focus-visible:outline-focus')
  })
})
