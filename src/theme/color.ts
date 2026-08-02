// Colour maths for the token derivation: sRGB ↔ OKLab/OKLCh, perceptual mixing
// and the WCAG 2.1 contrast ratio.
//
// Owned rather than taken from a package because it is fixed, public maths, it
// runs when a theme is generated rather than in the application, and a design
// system whose entire legibility guarantee rests on these numbers should not
// have them change underneath it on a minor release.

/** A colour in sRGB, each channel 0–1. */
export interface Rgb {
  r: number
  g: number
  b: number
}

/** A colour in OKLCh: lightness 0–1, chroma ≥ 0, hue in degrees. */
export interface Oklch {
  l: number
  c: number
  h: number
}

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n)

/** Parse `#rgb` or `#rrggbb`. Throws on anything else — a malformed token is a
 *  build-time mistake and should never reach a stylesheet. */
export function parseHex(hex: string): Rgb {
  const s = hex.trim().replace(/^#/, '')
  const full =
    s.length === 3
      ? s
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : s
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`not a hex colour: ${hex}`)
  }
  return {
    r: parseInt(full.slice(0, 2), 16) / 255,
    g: parseInt(full.slice(2, 4), 16) / 255,
    b: parseInt(full.slice(4, 6), 16) / 255,
  }
}

export function formatHex({ r, g, b }: Rgb): string {
  const channel = (n: number): string =>
    Math.round(clamp01(n) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${channel(r)}${channel(g)}${channel(b)}`
}

const toLinear = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)

const toGamma = (c: number): number =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055

interface Oklab {
  l: number
  a: number
  b: number
}

function rgbToOklab({ r, g, b }: Rgb): Oklab {
  const lr = toLinear(r)
  const lg = toLinear(g)
  const lb = toLinear(b)

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)

  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  }
}

/** OKLab → sRGB, unclamped: channels may fall outside 0–1 when the colour is
 *  outside the sRGB gamut. Callers decide what to do about that. */
function oklabToRgbRaw({ l, a, b }: Oklab): Rgb {
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l - 0.0894841775 * a - 1.291485548 * b

  const lc = l_ * l_ * l_
  const mc = m_ * m_ * m_
  const sc = s_ * s_ * s_

  return {
    r: toGamma(4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc),
    g: toGamma(-1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc),
    b: toGamma(-0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc),
  }
}

const inGamut = ({ r, g, b }: Rgb): boolean => {
  const ok = (n: number): boolean => n >= -1e-4 && n <= 1 + 1e-4
  return ok(r) && ok(g) && ok(b)
}

export function rgbToOklch(rgb: Rgb): Oklch {
  const { l, a, b } = rgbToOklab(rgb)
  const c = Math.sqrt(a * a + b * b)
  const h = c < 1e-7 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360
  return { l, c, h }
}

/**
 * OKLCh → sRGB. A colour outside the sRGB gamut is mapped back into it by
 * reducing chroma while holding lightness and hue — the standard approach, and
 * the one that keeps a darkened colour recognisably the same colour instead of
 * letting a channel clip and shift the hue.
 */
export function oklchToRgb({ l, c, h }: Oklch): Rgb {
  const at = (chroma: number): Rgb => {
    const rad = (h * Math.PI) / 180
    return oklabToRgbRaw({
      l,
      a: Math.cos(rad) * chroma,
      b: Math.sin(rad) * chroma,
    })
  }

  const direct = at(c)
  if (inGamut(direct)) {
    return { r: clamp01(direct.r), g: clamp01(direct.g), b: clamp01(direct.b) }
  }

  let low = 0
  let high = c
  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2
    if (inGamut(at(mid))) low = mid
    else high = mid
  }
  const mapped = at(low)
  return { r: clamp01(mapped.r), g: clamp01(mapped.g), b: clamp01(mapped.b) }
}

/**
 * Mix two colours in OKLab, `amount` being how much of `color` ends up in the
 * result. Perceptual rather than sRGB mixing: a saturated colour taken down to
 * a low percentage over a light surface stays a clean tint instead of going
 * muddy, which is the whole point of a status background.
 */
export function mix(color: Rgb, base: Rgb, amount: number): Rgb {
  const a = rgbToOklab(color)
  const b = rgbToOklab(base)
  const lerp = (x: number, y: number): number => y + (x - y) * amount
  const mixed = oklabToRgbRaw({
    l: lerp(a.l, b.l),
    a: lerp(a.a, b.a),
    b: lerp(a.b, b.b),
  })
  return { r: clamp01(mixed.r), g: clamp01(mixed.g), b: clamp01(mixed.b) }
}

/** WCAG 2.1 relative luminance. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return (
    0.2126 * toLinear(clamp01(r)) +
    0.7152 * toLinear(clamp01(g)) +
    0.0722 * toLinear(clamp01(b))
  )
}

/** WCAG 2.1 contrast ratio, 1–21. Order of the arguments does not matter. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}
