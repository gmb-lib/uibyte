import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import IdentityCodeField from './IdentityCodeField.vue'
import { parseIdentityCode, type IdentityCodeError } from '../lib/identity-code'
import type { CountryGroup } from './types'
import * as kit from '../index'

// Identity values are built from repeated digits at run time, never written as literals:
// an identifier-shaped constant in a published repository could be a real person's code.
const LV_BARE = '5'.repeat(11)
const LV_WRITTEN = `${'5'.repeat(6)}-${'5'.repeat(5)}`
const EE_BARE = '3'.repeat(11)
// A code of a country no group below offers, and whose format is not known.
const GB_BARE = '6'.repeat(5)

const nearby: CountryGroup = {
  key: 'nearby',
  label: 'Nearby',
  countries: [
    { code: 'LV', label: 'Latvia' },
    { code: 'EE', label: 'Estonia' },
  ],
}
const further: CountryGroup = { key: 'further', label: 'Further away', countries: [{ code: 'PT', label: 'Portugal' }] }
const groups = [nearby, further]

// Each test starts on an empty page: two mounts would otherwise share ids and lines.
enableAutoUnmount(afterEach)

// The host's sentence. In an application it is worded in the reader's language; here it
// spells out what it was given, so a test can read it back.
const say = (e: IdentityCodeError, country: string): string =>
  `${country}: ${e.problem}${e.expected !== undefined ? ` ${e.expected}/${e.actual}` : ''}`

const base = { countries: groups, label: 'Identity code', countryLabel: 'Country that issued it', describe: say }

/** The field in a host that keeps both values, as `v-model` and `v-model:country` do. */
function field(props: Record<string, unknown> = {}, start: { code?: string; country?: string } = {}) {
  const code = ref(start.code ?? '')
  const country = ref(start.country ?? 'LV')
  const Host = defineComponent({
    setup: () => () =>
      h(IdentityCodeField, {
        ...base,
        modelValue: code.value,
        'onUpdate:modelValue': (v: string) => (code.value = v),
        country: country.value,
        'onUpdate:country': (v: string) => (country.value = v),
        ...props,
      }),
  })
  const w = mount(Host, { attachTo: document.body })
  const box = () => w.get('input')
  return {
    w,
    code,
    country,
    box,
    choice: () => w.get('select'),
    frame: () => box().element.parentElement as HTMLElement,
    alert: () => w.find('[role="alert"]'),
    async type(text: string) {
      await box().setValue(text)
    },
    async leave() {
      await box().trigger('blur')
    },
  }
}

/** The field with values the host has not passed back — what it does on its own. */
function bare(props: Record<string, unknown> = {}) {
  return mount(IdentityCodeField, {
    props: { ...base, modelValue: '', country: 'LV', ...props },
    attachTo: document.body,
  })
}

describe('IdentityCodeField — the pair, drawn as one field', () => {
  it('draws the country’s choice and the code’s box in one frame, each with its own name', () => {
    const f = field()
    expect(f.choice().attributes('aria-label')).toBe('Country that issued it')
    expect(f.box().attributes('aria-label')).toBe('Identity code')
    expect(f.frame().contains(f.choice().element)).toBe(true)
  })

  it('types the code in a box that neither completes nor corrects it, in mono', () => {
    const box = field().box()
    expect(box.attributes('autocomplete')).toBe('off')
    expect(box.attributes('spellcheck')).toBe('false')
    expect(box.classes()).toContain('font-mono')
  })

  it('offers the host’s countries: a group with a label under its heading, one without plainly', () => {
    const f = field({ countries: [nearby, { key: 'more', countries: [{ code: 'PT', label: 'Portugal' }] }] })
    const headings = f.w.findAll('optgroup')
    expect(headings.map((g) => g.attributes('label'))).toEqual(['Nearby'])
    expect(headings[0].findAll('option').map((o) => [o.attributes('value'), o.text()])).toEqual([
      ['LV', 'Latvia'],
      ['EE', 'Estonia'],
    ])
    const plain = f.w.findAll('select > option')
    expect(plain.map((o) => [o.attributes('value'), o.text()])).toEqual([['PT', 'Portugal']])
  })

  it('shows the country the host chose, and tells the host when another is chosen', async () => {
    const f = field({}, { country: 'EE' })
    expect((f.choice().element as HTMLSelectElement).value).toBe('EE')
    await f.choice().setValue('PT')
    expect(f.country.value).toBe('PT')
  })

  it('draws the choice’s arrow for the eye only', () => {
    const arrow = field().w.get('select + svg')
    expect(arrow.attributes('aria-hidden')).toBe('true')
  })

  it('draws focus once, on the frame, for whichever half has it', () => {
    const f = field()
    expect(f.frame().className).toContain('focus-within:outline-focus')
    expect(f.frame().className).toContain('focus-within:outline-2')
    expect(f.box().classes()).toContain('focus-visible:outline-none')
    expect(f.choice().classes()).toContain('focus-visible:outline-none')
  })

  it('narrows the choice before the box: the choice is capped near half the frame, the box takes the rest', () => {
    const f = field()
    const holder = f.choice().element.parentElement as HTMLElement
    expect(holder.className).toContain('max-w-[50%]')
    expect(holder.className).toContain('min-w-0')
    expect(f.box().classes()).toEqual(expect.arrayContaining(['min-w-0', 'flex-1']))
    expect((f.w.element as HTMLElement).className).toContain('max-w-[420px]')
  })
})

describe('IdentityCodeField — settling what was typed', () => {
  it('settles a usable code on leaving the box: the national spelling', async () => {
    const f = field()
    await f.type(LV_BARE)
    await f.leave()
    expect(f.code.value).toBe(LV_WRITTEN)
    expect(f.country.value).toBe('LV')
  })

  it('settles on Enter, and Enter does not send the form around it', async () => {
    const f = field()
    await f.type(LV_BARE)
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    f.box().element.dispatchEvent(enter)
    await nextTick()
    expect(f.code.value).toBe(LV_WRITTEN)
    // A browser sends a form on Enter in its box unless the key is stopped there.
    expect(enter.defaultPrevented).toBe(true)
  })

  it('settles again when the country changes, beside the country now chosen', async () => {
    const f = field({}, { code: '1234', country: 'PT' })
    await f.leave()
    expect(f.alert().exists()).toBe(false)
    await f.choice().setValue('LV')
    expect(f.country.value).toBe('LV')
    expect(f.alert().text()).toBe('LV: length 11/4')
  })

  it('moves the choice to the code’s own country when the host offers it', async () => {
    const f = field()
    await f.type(`PNOEE-${EE_BARE}`)
    await f.leave()
    expect(f.country.value).toBe('EE')
    expect(f.code.value).toBe(EE_BARE)
  })

  it('moves the choice for a country carried by a cross-border wrapper too', async () => {
    const f = field()
    await f.type(`EE/LV/${EE_BARE}`)
    await f.leave()
    expect(f.country.value).toBe('EE')
    expect(f.code.value).toBe(EE_BARE)
  })

  it('keeps the whole code, and the choice, when the code’s country is not offered', async () => {
    const f = field({ settled: 'One identity.' })
    await f.type(`PNOGB-${GB_BARE}`)
    await f.leave()
    expect(f.country.value).toBe('LV')
    expect(f.code.value).toBe(`PNOGB-${GB_BARE}`)
    // Read back beside the choice, it is still the code that was typed — not a Latvian one.
    const again = parseIdentityCode(f.code.value, f.country.value)
    expect(again.ok && again.stored).toBe(`PNOGB-${GB_BARE}`)
    expect(f.w.text()).toContain('One identity.')
  })

  it('keeps the whole code from a cross-border wrapper whose country is not offered', async () => {
    const f = field()
    await f.type(`GB/LV/${GB_BARE}`)
    await f.leave()
    expect(f.country.value).toBe('LV')
    expect(f.code.value).toBe(`PNOGB-${GB_BARE}`)
  })

  it('settles an empty box to nothing', async () => {
    const f = field({ settled: 'One identity.' })
    await f.leave()
    await f.type('   ')
    await f.leave()
    expect(f.alert().exists()).toBe(false)
    expect(f.w.text()).not.toContain('One identity.')
    expect(f.code.value).toBe('   ')
    expect(f.box().attributes('aria-invalid')).toBeUndefined()
  })
})

describe('IdentityCodeField — a refusal, in the host’s words', () => {
  it('says the host’s sentence under the field, announced, and marks the box by it', async () => {
    const f = field()
    await f.type('ABCDE12345')
    await f.leave()
    const alert = f.alert()
    expect(alert.text()).toBe('LV: ambiguous')
    expect(f.box().attributes('aria-invalid')).toBe('true')
    expect(f.box().attributes('aria-describedby')?.split(' ')).toContain(alert.attributes('id'))
  })

  it('draws the frame in the refusal colour while it says why — never the colour alone', async () => {
    const f = field()
    expect(f.frame().className).toContain('border-line')
    await f.type('ABCDE12345')
    await f.leave()
    expect(f.frame().className).toContain('border-status-late')
    expect(f.frame().className).not.toContain('border-line')
    expect(f.alert().text()).not.toBe('')
    expect(f.alert().classes()).toContain('text-status-late-fg')
  })

  it('hands the host the refusal and the country it was read beside', async () => {
    const sentence = vi.fn(say)
    const f = field({ describe: sentence })
    await f.type('1234')
    await f.leave()
    expect(sentence).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, problem: 'length', expected: 11, actual: 4 }),
      'LV',
    )

    // A code that names its own country is held to that country's format, and the sentence
    // names that country — not the one chosen beside the box.
    sentence.mockClear()
    await f.type(`PNOEE-${'3'.repeat(3)}`)
    await f.leave()
    expect(f.country.value).toBe('LV')
    expect(sentence).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, problem: 'length', country: 'EE', expected: 11, actual: 3 }),
      'EE',
    )
    expect(sentence).not.toHaveBeenCalledWith(expect.anything(), 'LV')
    expect(f.alert().text()).toBe('EE: length 11/3')

    // A refusal that is not about a country's format names no country of its own, and is
    // described beside the one chosen.
    sentence.mockClear()
    await f.type('ABCDE12345')
    await f.leave()
    expect(sentence).toHaveBeenCalledWith(expect.objectContaining({ ok: false, problem: 'ambiguous' }), 'LV')
  })

  it('takes both lines away the moment something is typed', async () => {
    const refused = bare({ modelValue: 'ABCDE12345' })
    await refused.get('input').trigger('blur')
    expect(refused.find('[role="alert"]').exists()).toBe(true)
    await refused.get('input').setValue('ABCDE1234')
    expect(refused.find('[role="alert"]').exists()).toBe(false)
    expect(refused.get('input').attributes('aria-invalid')).toBeUndefined()
    expect((refused.get('input').element.parentElement as HTMLElement).className).toContain('border-line')

    const usable = bare({ modelValue: LV_WRITTEN, settled: 'One identity.' })
    await usable.get('input').trigger('blur')
    expect(usable.text()).toContain('One identity.')
    await usable.get('input').setValue(`${LV_WRITTEN}1`)
    expect(usable.text()).not.toContain('One identity.')
  })

  it('takes them away when the host replaces the value — a form emptied once sent', async () => {
    const f = field({ settled: 'One identity.' })
    await f.type(LV_BARE)
    await f.leave()
    expect(f.w.text()).toContain('One identity.')
    f.code.value = ''
    await nextTick()
    expect(f.w.text()).not.toContain('One identity.')
  })
})

describe('IdentityCodeField — the quiet lines and the host’s options', () => {
  it('shows the chosen country’s pattern in the empty box, or the host’s own words', async () => {
    const f = field()
    expect(f.box().attributes('placeholder')).toBe('XXXXXX-XXXXX')
    await f.choice().setValue('PT')
    expect(f.box().attributes('placeholder')).toBeUndefined()
    expect(field({ placeholder: 'as on the ID card' }).box().attributes('placeholder')).toBe('as on the ID card')
  })

  it('draws the host’s own words in the text face, and keeps the code face for the pattern', () => {
    // A code is set in the code face, and so is the pattern that stands for one; words are not a code.
    expect(field().box().classes()).not.toContain('placeholder:font-sans')
    expect(field({ placeholder: 'as on the ID card' }).box().classes()).toContain('placeholder:font-sans')
  })

  it('draws a note under the field that the box is described by, after any refusal', async () => {
    const f = field({ note: 'To tell two people apart.' })
    const note = f.w.get('p')
    expect(note.text()).toBe('To tell two people apart.')
    expect(note.classes()).toEqual(expect.arrayContaining(['text-[12.5px]', 'text-muted-strong']))
    expect(f.box().attributes('aria-describedby')).toBe(note.attributes('id'))
    await f.type('ABCDE12345')
    await f.leave()
    expect(f.box().attributes('aria-describedby')).toBe(`${f.alert().attributes('id')} ${note.attributes('id')}`)
  })

  it('draws the settled line, with its check, only when the host gives one', async () => {
    const said = field({ settled: 'One identity.' })
    await said.type(LV_BARE)
    await said.leave()
    const line = said.w.findAll('p').find((p) => p.text() === 'One identity.')
    expect(line?.classes()).toContain('text-status-ontrack-fg')
    expect(line?.get('svg').attributes('aria-hidden')).toBe('true')

    const silent = field()
    await silent.type(LV_BARE)
    await silent.leave()
    expect(silent.w.findAll('p')).toHaveLength(0)
  })

  it('disables both halves', () => {
    const f = field({ disabled: true })
    expect(f.choice().attributes('disabled')).toBeDefined()
    expect(f.box().attributes('disabled')).toBeDefined()
  })

  it('puts the host’s id on the box, so a visible label can point at it', () => {
    const f = field({ id: 'person-code' })
    expect(f.box().attributes('id')).toBe('person-code')
    expect(f.choice().attributes('id')).toBeUndefined()
  })

  it('keeps the lines of two fields on one page apart', async () => {
    const Two = defineComponent({
      setup: () => () =>
        h('div', [
          h(IdentityCodeField, { ...base, modelValue: 'ABCDE12345', country: 'LV', note: 'First.' }),
          h(IdentityCodeField, { ...base, modelValue: 'ABCDE12345', country: 'LV', note: 'Second.' }),
        ]),
    })
    const w = mount(Two, { attachTo: document.body })
    const boxes = w.findAll('input')
    for (const box of boxes) await box.trigger('blur')
    const described = boxes.map((b) => b.attributes('aria-describedby'))
    expect(new Set(described.flatMap((d) => d?.split(' ') ?? [])).size).toBe(4)
    for (const [i, box] of boxes.entries()) {
      const ids = box.attributes('aria-describedby')?.split(' ') ?? []
      expect(ids.map((id) => w.findAll('p').find((p) => p.attributes('id') === id)?.text())).toEqual([
        'LV: ambiguous',
        i === 0 ? 'First.' : 'Second.',
      ])
    }
  })
})

describe('the package entry', () => {
  it('offers the field and the rule, and keeps the box’s own collapse inside', () => {
    expect(kit.IdentityCodeField).toBe(IdentityCodeField)
    expect(kit.parseIdentityCode).toBe(parseIdentityCode)
    expect(typeof kit.displayIdentityCode).toBe('function')
    expect(typeof kit.identityCodePattern).toBe('function')
    expect(Object.keys(kit)).not.toContain('collapsedInput')
  })
})
