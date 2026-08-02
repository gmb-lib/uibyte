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

/** The three values derived from one role colour. */
export interface DerivedRole {
  /** The role colour itself — the saturated form, used for the dot. */
  dot: string
  background: string
  foreground: string
  border: string
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
function darkenToContrast(
  color: Rgb,
  background: Rgb,
  minimum: number,
): Rgb {
  const { l: startingLightness, c, h } = rgbToOklch(color)

  const at = (lightness: number): Rgb => asWritten(oklchToRgb({ l: lightness, c, h }))
  const meets = (lightness: number): boolean =>
    contrastRatio(at(lightness), background) >= minimum

  if (meets(startingLightness)) return at(startingLightness)

  // Black against any surface light enough to host a status pill always
  // qualifies; if even that fails the caller has asked for the impossible and
  // should hear about it rather than receive an illegible colour.
  if (!meets(0)) {
    throw new Error(
      `cannot reach ${minimum}:1 against ${formatHex(background)} — no lightness of this hue is dark enough`,
    )
  }

  // Contrast rises as lightness falls, so a binary search closes on the
  // boundary; the answer is the dark end of the bracket, which is the side
  // known to satisfy the ratio. Rounding makes the boundary slightly ragged, so
  // the result is verified rather than assumed, and stepped down if the search
  // landed on the wrong side of a rounding edge.
  let tooLight = startingLightness
  let darkEnough = 0
  for (let i = 0; i < 32; i++) {
    const mid = (tooLight + darkEnough) / 2
    if (meets(mid)) darkEnough = mid
    else tooLight = mid
  }

  for (let step = 0; step < 64 && !meets(darkEnough); step++) {
    darkEnough = Math.max(0, darkEnough - 0.002)
  }
  if (!meets(darkEnough)) {
    throw new Error(
      `cannot reach ${minimum}:1 against ${formatHex(background)} — no lightness of this hue is dark enough`,
    )
  }
  return at(darkEnough)
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

  return {
    dot: formatHex(roleColor),
    background: formatHex(background),
    foreground: formatHex(foreground),
    border: formatHex(border),
  }
}
