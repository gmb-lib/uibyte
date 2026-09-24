import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Icon from './Icon.vue'
import NavIcon from './NavIcon.vue'
import { iconGlyphs, iconNames, isIconName } from './icons'
import type { NavIconName } from './types'

const SVG_NS = 'http://www.w3.org/2000/svg'

describe('Icon', () => {
  it.each(iconNames)('draws %s with every part of its geometry', (name) => {
    const w = mount(Icon, { props: { name } })
    const svg = w.get('svg')
    const drawn = svg.element.querySelectorAll('path, circle, rect')
    expect(drawn).toHaveLength(iconGlyphs[name].length)
  })

  // The whole set is data a host may store, export and read back elsewhere, so
  // an empty glyph would be a mark that renders as nothing in one deployment
  // and as a shape in the next.
  it.each(iconNames)('gives %s something to draw at all', (name) => {
    expect(iconGlyphs[name].length).toBeGreaterThan(0)
  })

  // The ruled behaviour for a name this version does not know: nothing at all.
  // Not a placeholder, not a question mark, not an empty box holding space.
  it('draws nothing for a name it does not know', () => {
    const w = mount(Icon, { props: { name: 'no-such-glyph' } })
    expect(w.find('svg').exists()).toBe(false)
    expect(w.html()).toBe('<!--v-if-->')
  })

  it('draws nothing when no name was chosen', () => {
    expect(mount(Icon, { props: { name: '' } }).find('svg').exists()).toBe(false)
  })

  // Parts are drawn by element rather than as markup, so the namespace is worth
  // asserting: a <path> created in the HTML namespace looks right in the markup
  // and draws nothing on screen.
  it('creates its parts in the drawing namespace, not the document one', () => {
    const w = mount(Icon, { props: { name: 'truck' } })
    const drawn = [...w.get('svg').element.querySelectorAll('path, circle')]
    // Not a vacuous loop: the glyph is a body and two wheels.
    expect(drawn).toHaveLength(3)
    for (const el of drawn) expect(el.namespaceURI).toBe(SVG_NS)
  })

  it('carries the geometry through, number for number', () => {
    const rect = mount(Icon, { props: { name: 'calendar' } }).get('rect').element
    expect(rect.getAttribute('x')).toBe('3')
    expect(rect.getAttribute('width')).toBe('18')
    expect(rect.getAttribute('rx')).toBe('2')
  })

  it('rounds a cap or a join only where the glyph asks for one', () => {
    const paths = mount(Icon, { props: { name: 'doc' } }).findAll('path')
    expect(paths[0]?.attributes('stroke-linejoin')).toBe('round')
    expect(paths[0]?.attributes('stroke-linecap')).toBeUndefined()
  })

  it('is decoration unless it is given a name', () => {
    const w = mount(Icon, { props: { name: 'wrench' } })
    expect(w.get('svg').attributes('aria-hidden')).toBe('true')
    expect(w.get('svg').attributes('role')).toBeUndefined()
  })

  it('announces itself as an image when the host names it', () => {
    const w = mount(Icon, { props: { name: 'wrench', label: 'Machining' } })
    expect(w.get('svg').attributes('role')).toBe('img')
    expect(w.get('svg').attributes('aria-label')).toBe('Machining')
    expect(w.get('svg').attributes('aria-hidden')).toBeUndefined()
  })

  it('draws at the size it is asked for, and at the family size otherwise', () => {
    expect(mount(Icon, { props: { name: 'star' } }).get('svg').attributes('width')).toBe('17')
    expect(mount(Icon, { props: { name: 'star', size: 28 } }).get('svg').attributes('width')).toBe(
      '28',
    )
  })

  it('draws a different mark for every name', () => {
    const marks = iconNames.map((name) => mount(Icon, { props: { name } }).get('svg').html())
    expect(new Set(marks).size).toBe(iconNames.length)
  })

  it('offers its names alphabetically, so a grid is not in definition order', () => {
    expect([...iconNames]).toEqual([...iconNames].sort())
  })
})

describe('isIconName', () => {
  it('says yes to every name in the set', () => {
    for (const name of iconNames) expect(isIconName(name)).toBe(true)
  })

  it('says no to a name from somewhere else', () => {
    expect(isIconName('sprocket')).toBe(false)
    expect(isIconName('')).toBe(false)
  })

  // A plain object's inherited members are not glyphs; asking must not say they
  // are, or a stored value of "toString" would draw whatever that resolves to.
  it('says no to what every object inherits', () => {
    expect(isIconName('toString')).toBe(false)
    expect(isIconName('constructor')).toBe(false)
  })
})

describe('NavIcon', () => {
  const navNames: NavIconName[] = [
    'grid',
    'doc',
    'pen',
    'plus',
    'shield',
    'mail',
    'clock',
    'people',
    'lock',
    'gear',
  ]

  it.each(navNames)('draws %s from the same geometry as the rest of the set', (name) => {
    const nav = mount(NavIcon, { props: { name } }).get('svg').html()
    const icon = mount(Icon, { props: { name } }).get('svg').html()
    expect(nav).toBe(icon)
  })

  // A navigation row always gets a glyph: one blank space in a column of marks
  // reads as a broken row, which is a different message from "nothing here".
  it('falls back to a mark rather than leaving a hole', () => {
    const w = mount(NavIcon, { props: { name: 'not-a-nav-glyph' as NavIconName } })
    expect(w.find('svg').exists()).toBe(true)
    expect(w.get('svg').html()).toBe(mount(Icon, { props: { name: 'shield' } }).get('svg').html())
  })

  it('keeps the family size and takes one when asked', () => {
    expect(mount(NavIcon, { props: { name: 'grid' } }).get('svg').attributes('width')).toBe('17')
    expect(mount(NavIcon, { props: { name: 'grid', size: 22 } }).get('svg').attributes('width')).toBe(
      '22',
    )
  })
})
