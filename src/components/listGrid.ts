import type { ListColumn } from './types'

// The grid a list of rows is drawn on, shared by the list whose whole row is the
// way in and the list whose rows hold controls of their own — so the two line
// their columns up, head them and fold them by their own width in exactly the
// same way, and a change to one is a change to both.
//
// Each column is a track on one grid, set once per width the list can be: every
// column while wide, all but priority 3 below that. Narrow rows are not a grid
// at all — the title takes a line of its own and the other cells wrap beneath it.

/** The card every such list is drawn in. It measures itself: the folding follows its width, never the window's. */
export const listCard = '@container overflow-hidden rounded-card border border-line bg-surface'

/** The grid a header row and every row are laid on, wide and below wide. */
export const listGrid =
  'grid gap-x-[14px] px-[18px] [grid-template-columns:var(--list-wide)] @max-[1100px]:[grid-template-columns:var(--list-medium)]'

const priority = (column: ListColumn): number => column.priority ?? 2
const track = (column: ListColumn): string => column.width ?? 'minmax(0,1fr)'

/** The tracks, once per width the list can be, handed to the card as its own custom properties. */
export function listTracks(columns: ListColumn[]): Record<string, string> {
  return {
    '--list-wide': columns.map(track).join(' '),
    '--list-medium': columns.filter((c) => priority(c) < 3).map(track).join(' '),
  }
}

/** One cell's place: where it aligns, when it goes, and what it does when the list is narrow. */
export function listCellClass(column: ListColumn): string[] {
  return [
    'min-w-0',
    column.end ? 'text-end' : '',
    priority(column) === 3 ? '@max-[1100px]:hidden' : '',
    priority(column) === 1 ? '@max-[760px]:basis-full' : '@max-[760px]:text-[12.5px]',
  ]
}

/** The row's field a column draws when the host gives no cell slot for it. */
export const listValue = (row: unknown, key: string): unknown => (row as Record<string, unknown>)[key]
