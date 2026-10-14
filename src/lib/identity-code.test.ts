import { describe, expect, it } from 'vitest'
import {
  collapsedInput,
  displayIdentityCode,
  identityCodePattern,
  parseIdentityCode,
} from './identity-code'

// Every identity value below is assembled at run time from repeated digits, never
// written as a literal: an identifier-shaped constant in a published repository is
// indistinguishable from a real person's code. The test person is two parts of one
// Latvian code; each spelling of them is built from those same two parts.
const HALF6 = '5'.repeat(6)
const HALF5 = '5'.repeat(5)
const LV_WRITTEN = `${HALF6}-${HALF5}`
const LV_BARE = `${HALF6}${HALF5}`
const LV_STORED = `PNOLV-${LV_BARE}`
const EE_BARE = '3'.repeat(11)
const OTHER = '7'.repeat(11)
const PT_BARE = '9'.repeat(9)
// A code of a country whose format is not known, so nothing refuses its length.
const GB_BARE = '6'.repeat(5)

// The four spellings a service receives of ONE person's code, plus the two a form
// produces on the way (a pasted space, a stored value pasted back). Every one of them is
// the same human, and the whole point of the field is that they end up as one value.
const ONE_PERSON = [
  `PNOLV-${LV_WRITTEN}`,
  LV_STORED,
  LV_WRITTEN,
  LV_BARE,
  `${HALF6} ${HALF5}`,
  `  ${LV_WRITTEN}  `,
]

function stored(raw: string, country = 'LV'): string {
  const r = parseIdentityCode(raw, country)
  if (!r.ok) throw new Error(`expected ${raw} to be usable, got ${r.problem}`)

  return r.stored
}

function problem(raw: string, country = 'LV'): string {
  const r = parseIdentityCode(raw, country)
  if (r.ok) throw new Error(`expected ${raw} to be refused, got ${r.stored}`)

  return r.problem
}

describe('parseIdentityCode — one identity, however it is written', () => {
  it('collapses every spelling of one code to the same stored value', () => {
    const all = ONE_PERSON.map((raw) => stored(raw))
    expect(new Set(all)).toEqual(new Set([LV_STORED]))
  })

  it('is idempotent: canonicalising a stored value returns it unchanged', () => {
    expect(stored(LV_STORED)).toBe(LV_STORED)
  })

  it('believes a country stated in the code over the one chosen beside it', () => {
    const r = parseIdentityCode(`PNOEE-${EE_BARE}`, 'LV')
    expect(r.ok && r.stored).toBe(`PNOEE-${EE_BARE}`)
    expect(r.ok && r.code.country).toBe('EE')
    expect(r.ok && r.code.countryFromValue).toBe(true)
  })

  it('uses the chosen country only when the code names none', () => {
    expect(stored(EE_BARE, 'EE')).toBe(`PNOEE-${EE_BARE}`)
    const r = parseIdentityCode(EE_BARE, 'EE')
    expect(r.ok && r.code.countryFromValue).toBe(false)
  })

  it('keeps two countries with the same digits apart', () => {
    expect(stored(OTHER, 'EE')).not.toBe(stored(OTHER, 'LT'))
  })

  it('unwraps a cross-border code and keeps the country the code belongs to', () => {
    expect(stored(`LV/EE/${LV_WRITTEN}`)).toBe(LV_STORED)
  })

  it('unwraps a code wrapped twice, and the innermost country stands', () => {
    // Each pass strips one country pair, so the value shortens every time and the loop
    // ends. The country left standing is the one written closest to the code.
    expect(stored(`LV/EE/EE/LT/${LV_WRITTEN}`)).toBe(`PNOEE-${LV_BARE}`)
  })

  it('accepts a lower-case code and a lower-case country', () => {
    expect(stored(`pnolv-${LV_WRITTEN}`, 'lv')).toBe(LV_STORED)
  })

  it('accepts the other natural-person identity types the standard defines', () => {
    expect(stored(`PASSK-P${'3'.repeat(7)}`)).toBe(`PASSK-P${'3'.repeat(7)}`)
    expect(stored(`IDCBE-${'8'.repeat(12)}`)).toBe(`IDCBE-${'8'.repeat(12)}`)
    expect(stored(`TINEL-${'4'.repeat(9)}`)).toBe(`TINEL-${'4'.repeat(9)}`)
  })
})

describe('parseIdentityCode — the refusals, which are the only explanation a person gets', () => {
  it('refuses an organisation: the code taken here names a person', () => {
    const r = parseIdentityCode(`NTRLV-${'4'.repeat(11)}`, 'LV')
    expect(r.ok).toBe(false)
    expect(!r.ok && r.problem).toBe('notAPerson')
    expect(!r.ok && r.type).toBe('NTR')
  })

  it('refuses an identity type it does not know, and names it', () => {
    const r = parseIdentityCode(`ABCLV-${LV_BARE}`, 'LV')
    expect(!r.ok && r.problem).toBe('unknownType')
    expect(!r.ok && r.type).toBe('ABC')
  })

  it('refuses a locally defined type rather than reading it as an identifier', () => {
    expect(problem(`EI:SE-${'2'.repeat(12)}`)).toBe('unknownType')
  })

  it('refuses a bare code when no country is available', () => {
    expect(problem(LV_WRITTEN, '')).toBe('countryMissing')
    expect(problem(LV_WRITTEN, 'L')).toBe('countryMissing')
    expect(problem(LV_WRITTEN, '12')).toBe('countryMissing')
  })

  it('refuses a code that begins like a type but carries none', () => {
    expect(problem('ABCDE12345')).toBe('ambiguous')
  })

  it('refuses characters an identity code is not written in', () => {
    expect(problem(`${HALF6}#${HALF5}`)).toBe('malformed')
    expect(problem('PNOLV-')).toBe('malformed')
    // A Cyrillic А looks like an A and must not be able to pass as one.
    expect(problem('АБ12345')).toBe('malformed')
  })

  it('refuses nothing at all', () => {
    expect(problem('')).toBe('empty')
    expect(problem('   ')).toBe('empty')
  })

  it('checks the length of a personal number where the country writes one, and counts', () => {
    const r = parseIdentityCode(LV_BARE.slice(0, 10), 'LV')
    expect(!r.ok && r.problem).toBe('length')
    expect(!r.ok && r.expected).toBe(11)
    expect(!r.ok && r.actual).toBe(10)
    expect(!r.ok && r.country).toBe('LV')
    expect(problem(`${LV_BARE}1`)).toBe('length')
  })

  it('names the country whose format refused a code — the code’s own, when it names one', () => {
    const own = parseIdentityCode(`PNOEE-${'3'.repeat(3)}`, 'LV')
    expect(!own.ok && own.problem).toBe('length')
    expect(!own.ok && own.country).toBe('EE')

    const wrapped = parseIdentityCode(`EE/LV/${'3'.repeat(3)}`, 'LV')
    expect(!wrapped.ok && wrapped.problem).toBe('length')
    expect(!wrapped.ok && wrapped.country).toBe('EE')

    const letter = parseIdentityCode(`PNOLT-${'3'.repeat(10)}A`, 'LV')
    expect(!letter.ok && letter.problem).toBe('digits')
    expect(!letter.ok && letter.country).toBe('LT')

    // A refusal that is not about a country's format names no country.
    const malformed = parseIdentityCode('АБ12345', 'LV')
    expect(!malformed.ok && malformed.problem).toBe('malformed')
    expect(!malformed.ok && malformed.country).toBeUndefined()
  })

  it('refuses a letter inside a personal number of a country that writes digits', () => {
    expect(problem(`${HALF6.slice(0, 5)}A${HALF5}`)).toBe('digits')
  })

  it('is lenient where the format is not known — a country with no shape rule is not refused', () => {
    expect(stored(PT_BARE, 'PT')).toBe(`PNOPT-${PT_BARE}`)
    expect(stored('1234', 'RO')).toBe('PNORO-1234')
  })

  it('applies the length rule to each Baltic country', () => {
    expect(problem('123', 'EE')).toBe('length')
    expect(problem('123', 'LT')).toBe('length')
  })

  it('does not apply a personal-number shape to another identity type', () => {
    // A Latvian passport number is not eleven digits, and must not be refused as one.
    expect(stored(`PASLV-LV${'6'.repeat(7)}`)).toBe(`PASLV-LV${'6'.repeat(7)}`)
  })
})

describe('what a person sees', () => {
  it('shows a Latvian personal number the way Latvia writes it', () => {
    const r = parseIdentityCode(LV_BARE, 'LV')
    expect(r.ok && r.display).toBe(LV_WRITTEN)
  })

  it('shows the whole stored code where the country s own spelling is not known', () => {
    const r = parseIdentityCode(EE_BARE, 'EE')
    expect(r.ok && r.display).toBe(`PNOEE-${EE_BARE}`)
  })

  it('never renders two different principals alike', () => {
    const shown = [
      displayIdentityCode(`PNOEE-${OTHER}`),
      displayIdentityCode(`PNOLT-${OTHER}`),
      displayIdentityCode(`NTREE-${OTHER}`),
      displayIdentityCode(`PASEE-${OTHER}`),
      displayIdentityCode(`IDCEE-${OTHER}`),
    ]
    expect(new Set(shown).size).toBe(shown.length)
  })

  it('shows a stored code it cannot take apart exactly as it is', () => {
    expect(displayIdentityCode('not a code')).toBe('not a code')
    expect(displayIdentityCode('XYZLV-123')).toBe('XYZLV-123')
    expect(displayIdentityCode('')).toBe('')
  })

  it('round-trips: what is displayed can be typed back in and reaches the same person', () => {
    for (const raw of ONE_PERSON) {
      const first = parseIdentityCode(raw, 'LV')
      expect(first.ok).toBe(true)
      if (!first.ok) return
      const again = parseIdentityCode(first.display, first.code.country)
      expect(again.ok && again.stored).toBe(first.stored)
    }
  })

  it('offers an example only for a country whose format is known', () => {
    expect(identityCodePattern('LV')).toBe('XXXXXX-XXXXX')
    expect(identityCodePattern('EE')).toBe('XXXXXXXXXXX')
    expect(identityCodePattern('LT')).toBe('XXXXXXXXXXX')
    expect(identityCodePattern('PT')).toBe('')
  })
})

describe('collapsedInput — what the box keeps once a code is settled', () => {
  it('collapses the box to the national code when the country beside it is the code s own', () => {
    const r = parseIdentityCode(`PNOLV-${LV_WRITTEN}`, 'LV')
    expect(r.ok && collapsedInput(r.code, 'LV')).toBe(LV_WRITTEN)
    // The choice moved to the code's own country first, so it is the one beside the box.
    const ee = parseIdentityCode(`PNOEE-${EE_BARE}`, 'LV')
    expect(ee.ok && collapsedInput(ee.code, 'EE')).toBe(EE_BARE)
  })

  it('keeps a non-personal-number whole in the box, because its type is part of it', () => {
    const r = parseIdentityCode(`PASSK-P${'3'.repeat(7)}`, 'LV')
    expect(r.ok && collapsedInput(r.code, 'SK')).toBe(`PASSK-P${'3'.repeat(7)}`)
  })

  it('round-trips what the box itself collapsed to', () => {
    const r = parseIdentityCode(LV_BARE, 'LV')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const again = parseIdentityCode(collapsedInput(r.code, 'LV'), 'LV')
    expect(again.ok && again.stored).toBe(r.stored)
  })

  // A code can name a country that is not beside the box — one the list on the screen
  // does not offer, so the choice cannot follow it. Its country then has nowhere else to
  // be shown, and dropping it would make the box name somebody else.
  it('keeps the whole code when the country beside the box is not the code s own', () => {
    const gb = parseIdentityCode(`PNOGB-${GB_BARE}`, 'LV')
    expect(gb.ok && collapsedInput(gb.code, 'LV')).toBe(`PNOGB-${GB_BARE}`)
    const ee = parseIdentityCode(`PNOEE-${EE_BARE}`, 'LV')
    expect(ee.ok && collapsedInput(ee.code, 'LV')).toBe(`PNOEE-${EE_BARE}`)
  })

  it('reads back as the same person beside the same choice, whatever country the code named', () => {
    const cases: Array<[string, string]> = [
      [`PNOGB-${GB_BARE}`, 'LV'], // a country whose format is not known: refused for its length if dropped
      [`PNOEE-${OTHER}`, 'LV'], // same length in both countries: another person, silently, if dropped
      [`EE/LV/${OTHER}`, 'LV'], // the country carried by a cross-border wrapper
      [`GB/LV/${GB_BARE}`, 'LV'],
      [LV_BARE, 'LV'],
    ]
    for (const [raw, beside] of cases) {
      const first = parseIdentityCode(raw, beside)
      expect(first.ok).toBe(true)
      if (!first.ok) return
      const again = parseIdentityCode(collapsedInput(first.code, beside), beside)
      expect(again.ok && again.stored, raw).toBe(first.stored)
    }
  })

  it('compares the country beside the box in any case', () => {
    const r = parseIdentityCode(LV_BARE, 'lv')
    expect(r.ok && collapsedInput(r.code, 'lv')).toBe(LV_WRITTEN)
  })
})
