import {
  contrastRatio,
  formatHex,
  mix,
  oklchToRgb,
  parseHex,
  rgbToOklch,
  type Rgb,
} from './color'

/** How much of the role colour sits in the derived background. */
const BACKGROUND_AMOUNT = 0.12
/** How much of the role colour sits in the derived border. */
const BORDER_AMOUNT = 0.28
/** The contrast ratio a derived foreground must reach against its background. */
export const MINIMUM_CONTRAST = 4.5

/**
 * The floor for a focus ring derived against a dark surface. Deliberately far
 * above the text floor: this is an empirical number, not an arithmetic one. A
 * ring measuring 5.5:1 on a near-black surface was still reported hard to see
 * in live use — small areas of a dark saturated hue vanish long before the
 * ratio says they should — while the look that was accepted measures 9.6:1.
 * The floor sits above the measured failure and just under the accepted look.
 */
export const CONSOLE_RING_CONTRAST = 9

/** The values derived from one role colour. */
export interface DerivedRole {
  /** The role colour itself — the saturated form, used for the dot. */
  dot: string
  background: string
  foreground: string
  border: string
  /**
   * The loud look's pair: the role colour darkened until white text reads on
   * it. Always derived from the dot — an explicit background/foreground
   * override changes the quiet pair only.
   */
  solidBackground: string
  solidForeground: string
}

/** An explicit pair a host may supply to bypass derivation for one role. */
export interface RoleOverride {
  background?: string
  foreground?: string
}

export interface DeriveOptions {
  /** The surface the role is painted over. Derivation is relative to it. */
  surface: string
  /** Minimum contrast the foreground must reach. Defaults to 4.5:1. */
  minimumContrast?: number
  /** Values to use verbatim instead of deriving them. */
  override?: RoleOverride
}

/**
 * Round a colour to what a stylesheet can actually express.
 *
 * Every check below is made against the rounded value, never the exact one. A
 * colour that clears the ratio at full precision can fall a hundredth under it
 * once it is written as six hex digits, and the ratio that matters is the one
 * the browser paints.
 */
const asWritten = (color: Rgb): Rgb => parseHex(formatHex(color))

/**
 * Darken a colour until it reaches the required contrast against `background`,
 * holding hue and chroma.
 *
 * The rule is "darken until the ratio is met", not a fixed step, because a
 * fixed step is wrong for most hues: a mid-lightness yellow and a mid-lightness
 * blue carry very different luminance, so one step either leaves the yellow
 * unreadable or takes the blue to near-black. Searching for the *largest*
 * lightness that satisfies the ratio darkens each hue exactly as much as it
 * needs and no more, which is what keeps a palette looking like a palette.
 *
 * Lightness is searched in OKLCh. Contrast is measured in sRGB, since that is
 * what the accessibility requirement is defined in — the two spaces are used
 * for what each is actually for.
 */
function moveToContrast(
  color: Rgb,
  background: Rgb,
  minimum: number,
  limit: 0 | 1,
): Rgb {
  const { l: startingLightness, c, h } = rgbToOklch(color)

  const at = (lightness: number): Rgb => asWritten(oklchToRgb({ l: lightness, c, h }))
  const meets = (lightness: number): boolean =>
    contrastRatio(at(lightness), background) >= minimum

  if (meets(startingLightness)) return at(startingLightness)

  // The extreme of the chosen direction — black when darkening, white when
  // lightening — is the best this hue can do; if even that fails the caller
  // has asked for the impossible and should hear about it rather than receive
  // an illegible colour.
  if (!meets(limit)) {
    throw new Error(
      `cannot reach ${minimum}:1 against ${formatHex(background)} — no lightness of this hue gets there`,
    )
  }

  // Contrast rises monotonically toward the limit, so a binary search closes
  // on the boundary; the answer is the limit end of the bracket, which is the
  // side known to satisfy the ratio. Rounding makes the boundary slightly
  // ragged, so the result is checked rather than assumed, and stepped toward
  // the limit if the search landed on the wrong side of a rounding edge.
  let failing: number = startingLightness
  let passing: number = limit
  for (let i = 0; i < 32; i++) {
    const mid = (failing + passing) / 2
    if (meets(mid)) passing = mid
    else failing = mid
  }

  const towardLimit = (lightness: number): number =>
    limit === 0 ? Math.max(0, lightness - 0.002) : Math.min(1, lightness + 0.002)
  for (let step = 0; step < 64 && !meets(passing); step++) {
    passing = towardLimit(passing)
  }
  if (!meets(passing)) {
    throw new Error(
      `cannot reach ${minimum}:1 against ${formatHex(background)} — no lightness of this hue gets there`,
    )
  }
  return at(passing)
}

function darkenToContrast(color: Rgb, background: Rgb, minimum: number): Rgb {
  return moveToContrast(color, background, minimum, 0)
}

const WHITE: Rgb = { r: 1, g: 1, b: 1 }
const BLACK: Rgb = { r: 0, g: 0, b: 0 }

/**
 * Move a colour toward whichever extreme — white or black — has the greater
 * contrast headroom against the surface, until it reaches the required ratio.
 * Hue and chroma are held, so the adjusted colour stays recognisably itself.
 *
 * This is how a value that must read *on a surface* is derived when the
 * surface may be anything: on a dark surface the colour lightens, on a light
 * one it darkens, and a surface so middling that neither direction can reach
 * the ratio fails loudly instead of shipping an invisible value.
 */
export function adjustToContrast(
  color: string,
  surface: string,
  minimum: number,
): string {
  const surfaceRgb = parseHex(surface)
  const limit: 0 | 1 =
    contrastRatio(WHITE, surfaceRgb) >= contrastRatio(BLACK, surfaceRgb) ? 1 : 0
  return formatHex(moveToContrast(parseHex(color), surfaceRgb, minimum, limit))
}

/**
 * Derive the background, foreground and border of one role from a single value.
 *
 * One value in, three out — a host repointing a role through this function
 * cannot produce an unreadable result, which is the reason the derivation
 * exists rather than exposing every value as its own knob. The direction is
 * one-way on purpose: nothing derives the role colour from a background, so the
 * unreadable combination is unreachable rather than merely discouraged.
 *
 * An explicit override is taken verbatim and skips derivation for that value
 * alone — a host that needs an exact pair gets it, and still gets the rest
 * derived.
 */
export function deriveRole(dot: string, options: DeriveOptions): DerivedRole {
  const minimum = options.minimumContrast ?? MINIMUM_CONTRAST
  const roleColor = parseHex(dot)
  const surface = parseHex(options.surface)

  const background = asWritten(
    options.override?.background
      ? parseHex(options.override.background)
      : mix(roleColor, surface, BACKGROUND_AMOUNT),
  )

  const foreground = options.override?.foreground
    ? parseHex(options.override.foreground)
    : darkenToContrast(roleColor, background, minimum)

  const border = mix(roleColor, surface, BORDER_AMOUNT)

  // The loud pair: white text on the role colour itself, with the colour
  // darkened only as far as white legibility demands. No reference role passes
  // under white as it stands — even the darkest misses the ratio — so this is
  // always a derivation, never a pass-through by accident.
  const solidBackground = darkenToContrast(roleColor, WHITE, minimum)

  return {
    dot: formatHex(roleColor),
    background: formatHex(background),
    foreground: formatHex(foreground),
    border: formatHex(border),
    solidBackground: formatHex(solidBackground),
    solidForeground: formatHex(WHITE),
  }
}
