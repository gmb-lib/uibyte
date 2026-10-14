// A person's identity code, as it is typed into a form and as a service stores it. One
// person's code is written several ways — from an ID card or an identity provider it
// carries the identity type and the country ("PNOLV-XXXXXX-XXXXX"), while a person types
// only their national code, with or without its separator. Compared character by
// character those are different people.
//
// A service collapses them to one stored spelling and compares that. This module is the
// screen's copy of the same rule, and it is here for one reason: a service that refuses a
// code often cannot say which character to change, so the reason has to be given, in
// words a person can act on, before anything is sent.
//
// Whatever a form sends is canonicalised again by the service that receives it, which is
// what makes it safe for the rule to live twice: this copy is input and display polish and
// cannot decide an identity. It answers what the service answers — the same checks in the
// same order, the same refusals — plus one layer a service does not need: a per-country
// length check, which exists only where a person types.
//
// No word lives here. A refusal is a reason code and its numbers; the sentence that
// explains it, and every country's name, belong to the application.

// The identity types recognised. The natural-person ones are taken; a legal-person one is
// refused (see `PERSON_TYPES`).
const KNOWN_TYPES = new Set(['PNO', 'NTR', 'PAS', 'IDC', 'TIN'])

// An identity code typed here names a person, and nobody proves who they are as an
// organisation — so an organisation's code is refused, with its own reason, rather than
// taken as somebody's. `NTR` is a national trade-register number, carried in a
// certificate's organizationIdentifier rather than its serialNumber.
//
// The service that receives the code makes the same split and refuses an organisation
// whatever a form sends. The list is written here because a browser cannot ask the
// service first, and because a screen's job is to explain the refusal before a person has
// sent anything — not to decide it.
const PERSON_TYPES = new Set(['PNO', 'PAS', 'IDC', 'TIN'])

// The type given to a code that arrives with none of its own: a code typed into a
// personal-code field is a personal number.
const PERSONAL_NUMBER = 'PNO'

// A code that names its own type and country: three letters, two letters, then the
// hyphen the standard puts there. The hyphen is required — without it there is no
// telling a prefix from an identifier that happens to start with letters.
const PREFIXED = /^([A-Za-z]{3})([A-Za-z]{2})-([\s\S]*)$/
// A nationally defined type (two letters and a colon). None is recognised, so the shape
// exists here only to be refused as a prefix rather than mistaken for an identifier.
const LOCAL_PREFIXED = /^[A-Za-z]{2}:[A-Za-z]{2}-/
// The shape a code takes when it crosses a border in a login: the country of the code,
// the country that asked for it, then the code.
const CROSS_BORDER = /^([A-Za-z]{2})\/([A-Za-z]{2})\/([\s\S]+)$/

/**
 * Why a code cannot be used. Each one is a case where sending anything at all would mean
 * sending a guess — and only the screen can say which.
 */
export type IdentityCodeProblem =
  | 'empty'
  | 'malformed'
  | 'unknownType'
  | 'notAPerson'
  | 'ambiguous'
  | 'countryMissing'
  | 'length'
  | 'digits'

/** A code taken apart. */
export interface IdentityCode {
  /** The identity type, e.g. "PNO" for a national personal number. */
  type: string
  /**
   * The two-letter country whose register issued the identifier. Part of the identity:
   * the same digits in two countries belong to two people.
   */
  country: string
  /** The identifier itself, separators removed and upper-cased. */
  identifier: string
  /**
   * True when the value named its own type and country ("PNOEE-…") rather than taking
   * the chosen one. A country carried by a cross-border wrapper ("EE/LV/…") wins too, but
   * is not marked here — compare `country` with the chosen one to know where it stands.
   */
  countryFromValue: boolean
}

/** A code that can be used. */
export interface IdentityCodeOk {
  ok: true
  code: IdentityCode
  /** The one spelling a service stores and compares. */
  stored: string
  /**
   * What a person is shown: their national code written the way their country writes it
   * where that is known, and the whole stored code everywhere else.
   */
  display: string
}

/** A code that cannot be used, and why. */
export interface IdentityCodeError {
  ok: false
  problem: IdentityCodeProblem
  /** The offending identity type, for the two problems that name one. */
  type?: string
  /**
   * For 'length' and 'digits': the country whose format refused the code. That is the
   * code's own country, which is not always the one chosen beside it — a code that names
   * its country ("PNOEE-…") is held to that country's format.
   */
  country?: string
  /** For 'length': how many digits the country's format has… */
  expected?: number
  /** …and how many were given. */
  actual?: number
}

export type IdentityCodeResult = IdentityCodeOk | IdentityCodeError

// The separators different systems put between a code's groups, none of which is part of
// the code.
function isSeparator(ch: string): boolean {
  return /\s/.test(ch) || ch === '-' || ch === '.' || ch === '/'
}

// Reduce the part after the identity type to the form that is stored. Only ASCII letters
// and digits survive: an identity code is written in them, and a letter from another
// alphabet that merely looks like one must not be able to pass as it.
function toIdentifier(part: string): string | null {
  let out = ''
  for (const ch of part) {
    if (isSeparator(ch)) continue
    if (ch >= '0' && ch <= '9') {
      out += ch
      continue
    }
    if (ch >= 'A' && ch <= 'Z') {
      out += ch
      continue
    }
    if (ch >= 'a' && ch <= 'z') {
      out += ch.toUpperCase()
      continue
    }

    return null
  }

  return out || null
}

// An identifier that opens with the five letters an identity type and a country are
// written in cannot be told from a code that names its own type.
function beginsLikeAPrefix(identifier: string): boolean {
  return identifier.length >= 5 && /^[A-Za-z]{5}/.test(identifier)
}

// How a country writes its own personal number, where that is known. Cosmetic: nothing
// compares a displayed value. Latvia writes six digits, a hyphen and five; the leading
// group was once a date of birth and since 2017 need not be, so the split is on length
// alone and never on what the digits mean.
const NATIONAL_SPLITS: Record<string, (identifier: string) => string | null> = {
  LV: (id) => (id.length === 11 && /^[0-9]+$/.test(id) ? `${id.slice(0, 6)}-${id.slice(6)}` : null),
}

// The shape a country's personal number takes, where the format is known. Length and
// characters only, never a checksum: a typed code is a reference to somebody, matched
// strictly later, when that person proves who they are — so a checksum rule written for
// one country would only add a way to refuse a real person from another. A country
// absent here is checked leniently, which is deliberate.
const NATIONAL_SHAPES: Record<string, { digits: number }> = {
  LV: { digits: 11 },
  EE: { digits: 11 },
  LT: { digits: 11 },
}

function fail(problem: IdentityCodeProblem, extra: Partial<IdentityCodeError> = {}): IdentityCodeError {
  return { ok: false, problem, ...extra }
}

function assemble(code: IdentityCode): IdentityCodeOk {
  const stored = `${code.type}${code.country}-${code.identifier}`

  return { ok: true, code, stored, display: displayOf(code) }
}

// What to show a person. The country and the type are never dropped except where the
// country's own spelling identifies the code on its own — "XXXXXX-XXXXX" reads as a
// personal number to a Latvian and to nobody else. Everywhere else the stored code is
// shown, because a bare identifier would render a person, a foreign namesake holding the
// same digits and an organisation's register number as one identical string. What a
// person is shown can be typed back in and reaches that same person.
function displayOf(code: IdentityCode): string {
  if (code.type === PERSONAL_NUMBER) {
    const split = NATIONAL_SPLITS[code.country]
    if (split) {
      const spelled = split(code.identifier)
      if (spelled) return spelled
    }
  }

  return `${code.type}${code.country}-${code.identifier}`
}

/**
 * Turn what somebody typed into the one spelling a service stores, using the country
 * chosen beside it.
 *
 * `country` is consulted only when the value names none of its own: a country carried in
 * the value always wins, and one that contradicts the chosen one is not an error — another
 * system's spelling and a person's typing are both allowed to be right.
 */
export function parseIdentityCode(raw: string, country: string): IdentityCodeResult {
  let value = (raw ?? '').trim()
  if (!value) return fail('empty')

  let hint = (country ?? '').trim()

  // A cross-border code can arrive wrapped more than once. Each pass strips one country
  // pair, so the value shortens every time and the loop ends. The leading country is the
  // one that belongs to the code; the second says only who asked for it.
  for (;;) {
    const wrapped = CROSS_BORDER.exec(value)
    if (!wrapped) break
    hint = wrapped[1]
    value = wrapped[3].trim()
  }

  const prefixed = PREFIXED.exec(value)
  if (prefixed) {
    const type = prefixed[1].toUpperCase()
    if (!KNOWN_TYPES.has(type)) return fail('unknownType', { type })
    if (!PERSON_TYPES.has(type)) return fail('notAPerson', { type })
    const identifier = toIdentifier(prefixed[3])
    if (!identifier) return fail('malformed')

    return withShape({
      type,
      country: prefixed[2].toUpperCase(),
      identifier,
      countryFromValue: true,
    })
  }

  if (LOCAL_PREFIXED.test(value)) return fail('unknownType', { type: value.slice(0, 2).toUpperCase() })

  if (!hint) return fail('countryMissing')
  if (!/^[A-Za-z]{2}$/.test(hint)) return fail('countryMissing')

  const identifier = toIdentifier(value)
  if (!identifier) return fail('malformed')
  if (beginsLikeAPrefix(identifier)) return fail('ambiguous')

  return withShape({
    type: PERSONAL_NUMBER,
    country: hint.toUpperCase(),
    identifier,
    countryFromValue: false,
  })
}

// The screen's own layer, applied after the code is understood: does this look like a
// personal number of the country it claims? Only where that format is known.
function withShape(code: IdentityCode): IdentityCodeResult {
  const shape = code.type === PERSONAL_NUMBER ? NATIONAL_SHAPES[code.country] : undefined
  if (!shape) return assemble(code)
  if (!/^[0-9]+$/.test(code.identifier)) return fail('digits', { country: code.country })
  if (code.identifier.length !== shape.digits) {
    return fail('length', { country: code.country, expected: shape.digits, actual: code.identifier.length })
  }

  return assemble(code)
}

// What the box shows once a code is settled, given the country chosen beside it.
//
// A personal number whose own country is the one beside the box is shown as its national
// code, grouped the way its country writes it: the country is already on the screen, in
// the choice, so it is not repeated. Every other code is shown whole. A code whose type is
// not a personal number keeps its type because the type is part of what it is; and a
// personal number whose country is NOT the one beside the box — a country the choice does
// not offer, say — keeps its country, because the box is then the only place it can be
// seen. Dropped, the bare digits would be read beside the wrong country: refused for their
// length at best, and at worst taken as somebody else's code without a word.
export function collapsedInput(code: IdentityCode, beside: string): string {
  if (code.type === PERSONAL_NUMBER && code.country === (beside ?? '').trim().toUpperCase()) {
    const split = NATIONAL_SPLITS[code.country]
    if (split) {
      const spelled = split(code.identifier)
      if (spelled) return spelled
    }

    return code.identifier
  }

  return `${code.type}${code.country}-${code.identifier}`
}

/**
 * The example an empty box shows for a country whose format is known — `X` for each digit,
 * grouped the way the country writes it — and an empty string for any other.
 */
export function identityCodePattern(country: string): string {
  if (!NATIONAL_SHAPES[country]) return ''

  return country === 'LV' ? 'XXXXXX-XXXXX' : 'XXXXXXXXXXX'
}

/**
 * Show a stored code — the spelling a service holds and answers with. A value this cannot
 * take apart is shown unchanged: a display is cosmetic, and seeing the raw value serves a
 * person better than seeing nothing.
 */
export function displayIdentityCode(stored: string): string {
  const value = (stored ?? '').trim()
  const match = /^([A-Z]{3})([A-Z]{2})-([A-Z0-9]+)$/.exec(value)
  if (!match || !KNOWN_TYPES.has(match[1])) return stored

  return displayOf({
    type: match[1],
    country: match[2],
    identifier: match[3],
    countryFromValue: true,
  })
}
