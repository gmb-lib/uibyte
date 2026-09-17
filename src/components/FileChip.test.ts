import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FileChip from './FileChip.vue'
import { contrastRatio, formatHex, oklchToRgb, parseHex } from '../theme/color'
import { deriveRole, MINIMUM_CONTRAST } from '../theme/derive'
import { buildTheme, referenceStatus, referenceSurfaces, statusRoles, supportColors } from '../theme/tokens'

const ratioOf = (a: string, b: string): number => contrastRatio(parseHex(a), parseHex(b))

describe('FileChip', () => {
  it('shows the name it was given', () => {
    const w = mount(FileChip, { props: { name: 'north-bay-layout.pdf' } })
    expect(w.text()).toContain('north-bay-layout.pdf')
  })

  it.each([
    ['north-bay-layout.pdf', 'PDF'],
    ['column-bases-rev2.dwg', 'DWG'],
    ['SHEET.Xlsx', 'XLSX'],
    ['archive.tar.gz', 'GZ'],
  ])('marks %s with %s, from the name alone', (name, expected) => {
    expect(mount(FileChip, { props: { name } }).text()).toContain(expected)
  })

  // A mark that guesses is worse than no mark: it tells a person the file is
  // something it is not.
  it.each([
    ['no suffix at all', 'drawing'],
    ['nothing after the dot', 'drawing.'],
    ['a suffix too long to be one', 'report.final-revision'],
    ['a dotfile, whose name is not a suffix', '.gitignore'],
  ])('draws no mark when the name has %s', (_case, name) => {
    const w = mount(FileChip, { props: { name } })
    const marks = w.findAll('[aria-hidden="true"]').map((n) => n.text())
    expect(marks.every((m) => m === '')).toBe(true)
  })

  it('keeps the mark away from assistive technology, since the name already ends with it', () => {
    const w = mount(FileChip, { props: { name: 'plan.pdf' } })
    const hidden = w.findAll('[aria-hidden="true"]').map((n) => n.text())
    expect(hidden).toContain('PDF')
  })

  it('draws the facts in the order they were given', () => {
    const w = mount(FileChip, { props: { name: 'plan.pdf', meta: ['1.8 MB', 'who', 'when'] } })
    const text = w.text()
    expect(text.indexOf('1.8 MB')).toBeLessThan(text.indexOf('who'))
    expect(text.indexOf('who')).toBeLessThan(text.indexOf('when'))
  })

  it('does not announce the separators it draws between the facts', () => {
    const w = mount(FileChip, { props: { name: 'plan.pdf', meta: ['a', 'b', 'c'] } })
    const separators = w.findAll('span').filter((n) => n.text().trim() === '·')
    expect(separators.length).toBe(2)
    for (const s of separators) expect(s.attributes('aria-hidden')).toBe('true')
  })

  it('draws no fact line when it was given no facts', () => {
    const w = mount(FileChip, { props: { name: 'plan.pdf' } })
    expect(w.html()).not.toContain('text-[10.5px]')
    expect(w.text()).toContain('plan.pdf')
  })

  it('paints the badge from the role pair, so a repointed role carries it', () => {
    const w = mount(FileChip, {
      props: { name: 'plan.pdf', badge: 'checked · 2 of 2', badgeStatus: 'ontrack' },
    })
    expect(w.html()).toContain('text-status-ontrack-fg')
    expect(w.text()).toContain('checked · 2 of 2')
  })

  it.each(statusRoles)('takes %s for the badge tone', (role) => {
    const w = mount(FileChip, { props: { name: 'plan.pdf', badge: 'x', badgeStatus: role } })
    expect(w.html()).toContain(`text-status-${role}-fg`)
  })

  it('draws no badge when it was given none', () => {
    const w = mount(FileChip, { props: { name: 'plan.pdf', meta: ['1 kB'] } })
    expect(w.html()).not.toContain('font-semibold')
  })

  it('renders an action only when the host supplies one', () => {
    const without = mount(FileChip, { props: { name: 'plan.pdf' } })
    expect(without.find('button').exists()).toBe(false)

    const with_ = mount(FileChip, {
      props: { name: 'plan.pdf' },
      slots: { action: '<button aria-label="remove">x</button>' },
    })
    expect(with_.get('button').attributes('aria-label')).toBe('remove')
  })

  // The badge reflects something the host has just read and never stores, so the
  // chip must hold no copy of it: the only thing that can change what it says is
  // the prop.
  it('holds nothing of its own — the badge follows the prop', async () => {
    const w = mount(FileChip, { props: { name: 'plan.pdf', badge: 'checked' } })
    expect(w.text()).toContain('checked')
    await w.setProps({ badge: undefined })
    expect(w.text()).not.toContain('checked')
  })
})

// The chip's background is `surface`, not the badge role's own soft tint, so the
// pair's guarantee has to be shown to survive the move. It does, and for a
// structural reason: the foreground is darkened until it reads against a light
// tint, and `surface` is lighter still, so the ratio can only rise.
describe('the badge reads on the chip it sits on', () => {
  it.each(statusRoles)('%s, from the reference palette', (role) => {
    const fg = buildTheme().status[role].foreground
    expect(ratioOf(fg, supportColors.surface)).toBeGreaterThanOrEqual(MINIMUM_CONTRAST)
  })

  // Reference values prove the palette we ship. Sweeping the hue circle proves
  // the claim for a host that repoints a role to something we never tried.
  it('holds across the hue circle at every chroma and lightness', () => {
    const failures: string[] = []
    for (let hue = 0; hue < 360; hue += 5) {
      for (const chroma of [0, 0.05, 0.12, 0.2, 0.32]) {
        for (const lightness of [0.15, 0.35, 0.55, 0.75, 0.95]) {
          const dot = formatHex(oklchToRgb({ l: lightness, c: chroma, h: hue }))
          const { foreground } = deriveRole(dot, { surface: referenceSurfaces.paper })
          const ratio = ratioOf(foreground, supportColors.surface)
          if (ratio < MINIMUM_CONTRAST) {
            failures.push(`${dot} (l=${lightness} c=${chroma} h=${hue}) → ${ratio.toFixed(2)}:1`)
          }
        }
      }
    }
    expect(failures).toEqual([])
  })

  it('holds when the role is repointed to a value nobody would choose', () => {
    for (const dot of ['#FFFFFF', '#FFFF00', '#00FFFF', '#FF00FF', referenceStatus.idle]) {
      const { foreground } = deriveRole(dot, { surface: referenceSurfaces.paper })
      expect(ratioOf(foreground, supportColors.surface)).toBeGreaterThanOrEqual(MINIMUM_CONTRAST)
    }
  })
})
