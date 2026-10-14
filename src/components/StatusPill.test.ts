import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusPill from './StatusPill.vue'
import { statusRoles } from '../theme/tokens'

describe('StatusPill', () => {
  // The release gate: a status is never conveyed by colour alone. Both the text
  // and a glyph have to be there for every role, with no way to switch them off.
  it.each(statusRoles)('renders %s with a label and an icon, not colour alone', (status) => {
    const w = mount(StatusPill, { props: { status, label: `${status} label` } })
    expect(w.text()).toBe(`${status} label`)
    expect(w.find('svg').exists()).toBe(true)
  })

  it('hides the icon from assistive technology, since the label already says it', () => {
    const w = mount(StatusPill, { props: { status: 'late', label: 'Overdue' } })
    expect(w.get('svg').attributes('aria-hidden')).toBe('true')
  })

  it('draws a different glyph for each role', () => {
    const glyphs = statusRoles.map(
      (status) => mount(StatusPill, { props: { status, label: 'x' } }).get('svg').html(),
    )
    expect(new Set(glyphs).size).toBe(statusRoles.length)
  })

  // Two roles deliberately share a hue and are told apart by their glyph, so
  // that pair is worth its own assertion rather than relying on the sweep above.
  it('separates the two roles that share a hue', () => {
    const blocked = mount(StatusPill, { props: { status: 'blocked', label: 'x' } }).get('svg').html()
    const approaching = mount(StatusPill, { props: { status: 'approaching', label: 'x' } })
      .get('svg')
      .html()
    expect(blocked).not.toBe(approaching)
  })

  it('paints from the role pair so a repointed role carries the pill with it', () => {
    const w = mount(StatusPill, { props: { status: 'ontrack', label: 'Done' } })
    expect(w.classes()).toContain('bg-status-ontrack-bg')
    expect(w.classes()).toContain('text-status-ontrack-fg')
  })

  it('has a compact size that keeps the icon and the label', () => {
    const w = mount(StatusPill, { props: { status: 'idle', label: 'Draft', size: 'sm' } })
    expect(w.text()).toBe('Draft')
    expect(w.find('svg').exists()).toBe(true)
  })

  // The three looks are volume, never meaning. Soft is the default and must
  // render exactly as it always has; the two new looks are opt-in.
  it('defaults to the soft look', () => {
    const w = mount(StatusPill, { props: { status: 'late', label: 'Overdue' } })
    expect(w.classes()).toContain('bg-status-late-bg')
    expect(w.classes()).toContain('text-status-late-fg')
  })

  it('paints the solid look from the derived solid pair', () => {
    const w = mount(StatusPill, {
      props: { status: 'late', label: 'Overdue', look: 'solid' },
    })
    expect(w.classes()).toContain('bg-status-late-solid-bg')
    expect(w.classes()).toContain('text-status-late-solid-fg')
    // The loud look keeps the role glyph — loudness changes nothing about the
    // never-colour-alone anatomy.
    expect(w.find('svg').exists()).toBe(true)
    expect(w.text()).toBe('Overdue')
  })

  it('draws the outline look as a bordered surface with a role-coloured dot', () => {
    const w = mount(StatusPill, {
      props: { status: 'ontrack', label: 'In work', look: 'outline' },
    })
    expect(w.classes()).toContain('bg-surface')
    expect(w.classes()).toContain('border-line')
    expect(w.classes()).toContain('text-ink')
    // The quiet look swaps the glyph for a dot, and the dot stays out of the
    // accessibility tree — the label carries the status.
    expect(w.find('svg').exists()).toBe(false)
    const dot = w.get('span[aria-hidden="true"]')
    expect(dot.classes()).toContain('bg-status-ontrack')
    expect(w.text()).toBe('In work')
  })

  it('keeps a visible mark and the label in every look', () => {
    for (const look of ['soft', 'solid', 'outline'] as const) {
      const w = mount(StatusPill, { props: { status: 'late', label: 'x', look } })
      expect(w.text()).toBe('x')
      expect(w.find('svg').exists() || w.find('span[aria-hidden="true"]').exists()).toBe(true)
    }
  })

  // Every role carries its own pair in every look, so none borrows another's
  // colour — the newest role included.
  it.each(statusRoles)('paints %s from its own pair in every look', (status) => {
    const soft = mount(StatusPill, { props: { status, label: 'x' } })
    const solid = mount(StatusPill, { props: { status, label: 'x', look: 'solid' } })
    const outline = mount(StatusPill, { props: { status, label: 'x', look: 'outline' } })
    expect(soft.classes()).toContain(`bg-status-${status}-bg`)
    expect(solid.classes()).toContain(`bg-status-${status}-solid-bg`)
    expect(outline.get('span > span').classes()).toContain(`bg-status-${status}`)
  })

  describe('a glyph of the host’s', () => {
    const roleMark = (): string => mount(StatusPill, { props: { status: 'late', label: 'x' } }).get('svg').html()

    // The glyph says more than the role — a lock, say — and takes the mark's place:
    // drawn at the pill's own size and weight, hidden from a reader, with the
    // label and the role's colours as they were.
    it('draws the host’s glyph where the role’s mark sits, at the pill’s size, hidden from a reader', () => {
      const w = mount(StatusPill, { props: { status: 'late', label: 'Not open', icon: 'lock' } })
      const marks = w.findAll('svg')
      expect(marks).toHaveLength(1)
      const mark = marks[0]
      expect(mark.attributes('aria-hidden')).toBe('true')
      expect(mark.attributes('width')).toBe('12')
      expect(mark.attributes('stroke-width')).toBe('2.4')
      expect(mark.element).toBe(w.element.firstElementChild)
      // The lock's body and shackle, and none of the role's own glyph.
      expect(mark.find('rect').exists()).toBe(true)
      expect(mark.html()).not.toBe(roleMark())
      expect(mark.find('path[d="M12 4.5 21 19.5H3z"]').exists()).toBe(false)
      expect(w.text()).toBe('Not open')
      expect(w.classes()).toEqual(expect.arrayContaining(['bg-status-late-bg', 'text-status-late-fg']))
    })

    it('draws it in place of the dot in the outline look', () => {
      const w = mount(StatusPill, { props: { status: 'idle', label: 'Not included', look: 'outline', icon: 'lock' } })
      expect(w.findAll('span[aria-hidden="true"]')).toHaveLength(0)
      expect(w.get('svg').attributes('aria-hidden')).toBe('true')
      expect(w.get('svg').find('rect').exists()).toBe(true)
      expect(w.classes()).toEqual(expect.arrayContaining(['bg-surface', 'border-line']))
      expect(w.text()).toBe('Not included')
    })

    // A glyph name can be data; one this version does not know must not leave the
    // pill without a mark.
    it('keeps the role’s own mark for a name it does not know, and in every look', () => {
      for (const look of ['soft', 'solid'] as const) {
        const known = mount(StatusPill, { props: { status: 'late', label: 'x', look, icon: 'lock' } })
        const unknown = mount(StatusPill, { props: { status: 'late', label: 'x', look, icon: 'no-such-glyph' } })
        expect(known.get('svg').html()).not.toBe(roleMark())
        expect(unknown.get('svg').html()).toBe(roleMark())
      }
      const outline = mount(StatusPill, { props: { status: 'late', label: 'x', look: 'outline', icon: 'no-such-glyph' } })
      expect(outline.find('svg').exists()).toBe(false)
      expect(outline.get('span[aria-hidden="true"]').classes()).toContain('bg-status-late')
    })
  })

  it('marks closed work apart from work on track, by shape as well as colour', () => {
    const glyph = (status: 'closed' | 'ontrack') => mount(StatusPill, { props: { status, label: 'x' } }).get('svg').html()
    expect(glyph('closed')).not.toBe(glyph('ontrack'))
    expect(mount(StatusPill, { props: { status: 'closed', label: 'x' } }).find('svg circle').exists()).toBe(true)
  })
})
