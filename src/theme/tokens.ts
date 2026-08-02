import { formatHex, parseHex } from './color'
import { deriveRole, type DerivedRole, type RoleOverride } from './derive'

/**
 * The four surface roles. A host may repoint any of them; what each surface is
 * *for* does not change with its colour.
 */
export const surfaceRoles = ['ink', 'paper', 'band', 'console'] as const
export type SurfaceRole = (typeof surfaceRoles)[number]

/**
 * The five status roles. A status is always rendered as colour **and** an icon
 * **and** a text label — never colour alone.
 */
export const statusRoles = [
  'ontrack',
  'blocked',
  'approaching',
  'late',
  'idle',
] as const
export type StatusRole = (typeof statusRoles)[number]

/**
 * The reference look. These are the values the family ships with, not a
 * constraint: a host re-skinning the product replaces them.
 */
export const referenceSurfaces: Record<SurfaceRole, string> = {
  ink: '#16181B',
  paper: '#F4F3EF',
  band: '#FBFAF7',
  console: '#0E1114',
}

export const referenceStatus: Record<StatusRole, string> = {
  ontrack: '#0E9E6B',
  blocked: '#D79A2B',
  approaching: '#E8B23A',
  late: '#D2524D',
  idle: '#9AA0A6',
}

/**
 * The two type roles. The split is semantic rather than decorative: if a value
 * was produced by the system — an identifier, a timestamp, a duration, a code —
 * it is set in mono. That one rule carries most of the family's character.
 *
 * Only the stacks are declared here. The font files themselves are the host's
 * to serve, so a host that has not loaded them degrades to the fallbacks rather
 * than to a broken layout.
 */
export const typeRoles = ['sans', 'mono'] as const
export type TypeRole = (typeof typeRoles)[number]

export const referenceType: Record<TypeRole, string> = {
  sans: '"Hanken Grotesk", ui-sans-serif, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, "Cascadia Code", monospace',
}

/**
 * The support layer: structural values the components need that carry no status
 * meaning and take part in no derivation.
 *
 * Kept separate from the roles on purpose. The roles are the semantic core —
 * few, named for meaning, and legible by construction. These are the hairlines,
 * text tones, corners and elevation that any application chrome needs, and a
 * host repoints them freely. Nothing here decides whether something is late or
 * on track.
 *
 * The list is exactly what the shipped components use. It grows when a
 * component needs it to, never speculatively.
 */
export const supportColors = {
  /** Raised light surfaces — cards, fields, rows sitting above the page. */
  surface: '#FFFFFF',
  /** Hairlines and borders on light surfaces. */
  line: '#E6E3DC',
  /** Secondary text. */
  muted: '#6B7177',
  /** Secondary text needing a little more weight against a light surface. */
  'muted-strong': '#5A5F66',
  /** The quietest readable text — placeholders, disabled affordances. */
  faint: '#9AA0A6',
  /** Panels raised above a console surface. */
  'console-raised': '#14181C',
  /** Hairlines on a console surface. */
  'console-line': '#20262B',
  /** Primary text on a console surface. */
  'console-text': '#E8EAE7',
  /** Secondary text on a console surface. */
  'console-muted': '#8A9298',
  /** Text and fills that must read as an accent against a console surface. */
  'console-accent': '#2BD18C',
  /**
   * The keyboard focus ring. Its own token because a visible focus indicator is
   * a release requirement, and a host must be able to repoint it without
   * repointing a status role that happens to share its colour today.
   */
  focus: '#0E9E6B',
} as const

export type SupportColor = keyof typeof supportColors

/** Corner radii, named for what they are put on rather than by size. */
export const radii = {
  pill: '999px',
  card: '14px',
  btn: '10px',
  chip: '7px',
} as const

/** The one elevation the components use: a console panel lifted off the page. */
export const shadows = {
  console: '0 34px 70px -24px rgba(14, 17, 20, 0.5)',
} as const

export interface ThemeInput {
  /** Values to use instead of the reference ones. Anything omitted keeps its reference value. */
  surfaces?: Partial<Record<SurfaceRole, string>>
  status?: Partial<Record<StatusRole, string>>
  type?: Partial<Record<TypeRole, string>>
  /** Exact pairs, per role, for a host that needs a specific one. */
  overrides?: Partial<Record<StatusRole, RoleOverride>>
}

export interface Theme {
  surfaces: Record<SurfaceRole, string>
  status: Record<StatusRole, DerivedRole>
  type: Record<TypeRole, string>
}

/**
 * Resolve a full theme: the surfaces as given, and every status role's
 * background, foreground and border derived from its single value.
 *
 * This is the supported way to repoint the palette. Setting the role variables
 * directly in a stylesheet changes the dots but leaves the derived values as
 * they were, so the pills stop matching the palette they came from.
 */
export function buildTheme(input: ThemeInput = {}): Theme {
  const surfaces = { ...referenceSurfaces, ...input.surfaces }
  const status = { ...referenceStatus, ...input.status }

  return {
    surfaces,
    type: { ...referenceType, ...input.type },
    status: Object.fromEntries(
      statusRoles.map((role) => [
        role,
        deriveRole(status[role], {
          surface: surfaces.paper,
          override: input.overrides?.[role],
        }),
      ]),
    ) as Record<StatusRole, DerivedRole>,
  }
}

/**
 * Render a theme as the custom-property block a stylesheet imports. Emitted
 * rather than hand-written so the published values cannot drift from the rule
 * that produced them.
 */
export function themeCss(theme: Theme = buildTheme()): string {
  const lines = [
    '@theme {',
    // Normalised on the way out so a hand-typed surface and a derived value are
    // never written in two different styles in the same file.
    ...surfaceRoles.map(
      (role) => `  --color-${role}: ${formatHex(parseHex(theme.surfaces[role]))};`,
    ),
    '',
  ]

  for (const role of statusRoles) {
    const derived = theme.status[role]
    lines.push(
      `  --color-status-${role}: ${derived.dot};`,
      `  --color-status-${role}-bg: ${derived.background};`,
      `  --color-status-${role}-fg: ${derived.foreground};`,
      `  --color-status-${role}-border: ${derived.border};`,
      '',
    )
  }

  lines.push(
    ...typeRoles.map((role) => `  --font-${role}: ${theme.type[role]};`),
    '',
    ...Object.entries(supportColors).map(
      ([name, value]) => `  --color-${name}: ${formatHex(parseHex(value))};`,
    ),
    '',
    ...Object.entries(radii).map(([name, value]) => `  --radius-${name}: ${value};`),
    '',
    ...Object.entries(shadows).map(([name, value]) => `  --shadow-${name}: ${value};`),
    '}',
  )
  return lines.join('\n')
}
