/**
 * The glyph set, in one place.
 *
 * Every icon this package can draw is described here as geometry, never as
 * markup: a shape and its numbers. Two things follow from that. The drawing
 * components stay tiny, and a name is data — it can be stored in a database,
 * carried in an exported configuration file and read back in another
 * deployment, and it will draw the same mark there.
 *
 * Names describe the SHAPE, never what an application uses it for. A beetle is
 * `beetle` whether it marks a defect, an inspection or a pest report; naming it
 * for one of those would make it wrong for the other two.
 *
 * The set is deliberately fixed and small. An application that lets people
 * choose a glyph is choosing from something a stranger's deployment also has —
 * an open set of uploads would be an image nobody else can resolve.
 */

/** One drawn element of a glyph, at the family's stroke weight. */
export type IconPart =
  | { shape: 'path'; d: string; cap?: true; join?: true }
  | { shape: 'circle'; cx: number; cy: number; r: number }
  | { shape: 'rect'; x: number; y: number; width: number; height: number; rx?: number }

/** Every glyph name the package knows. */
export type IconName =
  | 'alert'
  | 'beaker'
  | 'beetle'
  | 'bolt'
  | 'box'
  | 'calendar'
  | 'cart'
  | 'chat'
  | 'check'
  | 'clipboard'
  | 'clock'
  | 'doc'
  | 'flame'
  | 'grid'
  | 'lock'
  | 'mail'
  | 'pen'
  | 'people'
  | 'plus'
  | 'ruler'
  | 'shield'
  | 'star'
  | 'tag'
  | 'target'
  | 'truck'
  | 'wrench'

/**
 * The geometry of each glyph, drawn on a 24×24 grid with no fill — the stroke
 * is the drawing, so a glyph inherits the colour of the text around it.
 */
export const iconGlyphs: Record<IconName, readonly IconPart[]> = {
  alert: [
    { shape: 'path', d: 'M12 3 2 20.5h20L12 3z', join: true },
    { shape: 'path', d: 'M12 10v4.5M12 17.5v.5', cap: true },
  ],
  beaker: [
    {
      shape: 'path',
      d: 'M9.5 3h5M10.5 3v6L6 18.5A2 2 0 0 0 7.8 21.5h8.4a2 2 0 0 0 1.8-3L13.5 9V3',
      join: true,
    },
  ],
  beetle: [
    { shape: 'path', d: 'M8 9.5a4 4 0 0 1 8 0v4a4 4 0 0 1-8 0z', join: true },
    { shape: 'path', d: 'M4 9h4M16 9h4M4 15h4M16 15h4M9.5 6.5 8 4.5M14.5 6.5 16 4.5', cap: true },
  ],
  bolt: [{ shape: 'path', d: 'M13 2 4 14h7l-1 8 9-12h-7l1-8z', join: true }],
  box: [
    { shape: 'path', d: 'M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9z', join: true },
    { shape: 'path', d: 'M3 7.5 12 12l9-4.5M12 12v9', join: true },
  ],
  calendar: [
    { shape: 'rect', x: 3, y: 5, width: 18, height: 16, rx: 2 },
    { shape: 'path', d: 'M3 10h18M8 3v4M16 3v4', cap: true },
  ],
  cart: [
    { shape: 'circle', cx: 9.5, cy: 19, r: 1.6 },
    { shape: 'circle', cx: 17, cy: 19, r: 1.6 },
    { shape: 'path', d: 'M3 4h2.2l2.6 10.5h10L20 7.5H6.2', join: true },
  ],
  chat: [
    {
      shape: 'path',
      d: 'M21 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 2.5 1-4.4A7.5 7.5 0 0 1 13.5 4 7.5 7.5 0 0 1 21 11.5z',
      join: true,
    },
  ],
  check: [{ shape: 'path', d: 'M4 12.5l5 5L20 6.5', cap: true, join: true }],
  clipboard: [
    { shape: 'rect', x: 5, y: 4.5, width: 14, height: 16.5, rx: 2 },
    { shape: 'path', d: 'M9.5 4.5V3.5h5v1', join: true },
    { shape: 'path', d: 'M9 11h6M9 15h4', cap: true },
  ],
  clock: [
    { shape: 'circle', cx: 12, cy: 12, r: 9 },
    { shape: 'path', d: 'M12 6.5V12l4 2.5', cap: true, join: true },
  ],
  doc: [
    { shape: 'path', d: 'M14 3v5h5', join: true },
    { shape: 'path', d: 'M7 3h7l5 5v13H5V5a2 2 0 0 1 2-2z', join: true },
  ],
  flame: [
    {
      shape: 'path',
      d: 'M12 3s5 4.5 5 9a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 1.5 1 2.5 2 3 .5-3-1-5.5 1-7.5z',
      join: true,
    },
  ],
  grid: [
    { shape: 'rect', x: 3, y: 3, width: 7, height: 7, rx: 1.5 },
    { shape: 'rect', x: 14, y: 3, width: 7, height: 7, rx: 1.5 },
    { shape: 'rect', x: 3, y: 14, width: 7, height: 7, rx: 1.5 },
    { shape: 'rect', x: 14, y: 14, width: 7, height: 7, rx: 1.5 },
  ],
  lock: [
    { shape: 'rect', x: 4.5, y: 10.5, width: 15, height: 10, rx: 2 },
    { shape: 'path', d: 'M8 10.5V7.5a4 4 0 0 1 8 0v3' },
  ],
  mail: [
    { shape: 'rect', x: 3, y: 5, width: 18, height: 14, rx: 2 },
    { shape: 'path', d: 'M4 7l8 5 8-5', cap: true, join: true },
  ],
  pen: [
    { shape: 'path', d: 'M12 20h9', cap: true },
    { shape: 'path', d: 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z', join: true },
  ],
  people: [
    { shape: 'circle', cx: 9, cy: 8, r: 3.5 },
    { shape: 'path', d: 'M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6', cap: true },
    { shape: 'path', d: 'M16 5.2a3.5 3.5 0 0 1 0 5.6M17.5 14.4A6 6 0 0 1 21 20', cap: true },
  ],
  plus: [{ shape: 'path', d: 'M12 5v14M5 12h14', cap: true }],
  ruler: [
    { shape: 'path', d: 'M3 15 15 3l6 6L9 21z', join: true },
    { shape: 'path', d: 'M7 11l2 2M10 8l2 2M13 5l2 2', cap: true },
  ],
  shield: [
    { shape: 'path', d: 'M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z', join: true },
    { shape: 'path', d: 'M9 11.5l2 2 4-4.5', cap: true, join: true },
  ],
  star: [
    {
      shape: 'path',
      d: 'M12 3.5l2.6 5.5 6 .9-4.3 4.2 1 6-5.3-2.8-5.3 2.8 1-6L3.4 9.9l6-.9L12 3.5z',
      join: true,
    },
  ],
  tag: [
    { shape: 'path', d: 'M3 12V3.5h8.5L21 13l-8.5 8.5L3 12z', join: true },
    { shape: 'circle', cx: 7.5, cy: 7.5, r: 1.3 },
  ],
  target: [
    { shape: 'circle', cx: 12, cy: 12, r: 8.5 },
    { shape: 'circle', cx: 12, cy: 12, r: 3.5 },
  ],
  truck: [
    { shape: 'path', d: 'M3 6.5h11v9H3zM14 9.5h3.5L21 13v2.5h-7z', join: true },
    { shape: 'circle', cx: 7, cy: 18, r: 1.8 },
    { shape: 'circle', cx: 17, cy: 18, r: 1.8 },
  ],
  wrench: [
    {
      shape: 'path',
      d: 'M15.5 3.5a5 5 0 0 0-6.2 6.2L3 16v5h5l6.3-6.3a5 5 0 0 0 6.2-6.2l-3.2 3.2-2.8-.7-.7-2.8 3.2-3.2z',
      join: true,
    },
  ],
}

/**
 * Every name, alphabetically — the order the picker offers them in unless a
 * host says otherwise.
 */
export const iconNames: readonly IconName[] = Object.keys(iconGlyphs).sort() as IconName[]

/**
 * Whether this package can draw a name.
 *
 * Worth having because the names an application holds are DATA: one stored
 * years ago, or written by a newer version of this package, may not be in the
 * set in front of you. Asking is how a host decides what to do about that; the
 * drawing component simply draws nothing.
 */
export function isIconName(name: string): name is IconName {
  // Asked of the object's OWN members only: a stored value of `toString` must
  // not resolve to something every object inherits.
  return Object.prototype.hasOwnProperty.call(iconGlyphs, name)
}
