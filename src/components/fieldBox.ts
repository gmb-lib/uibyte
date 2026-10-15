// The one box a text field and a select are drawn as, so the two always look alike.
// Internal: not exported from the package entry.
//
// Two sizes: `md`, the box of a form, and `sm`, the compact box of a control that
// sits inside a list's row or beside a few words, where a form's box would make
// the row taller than its text.

export type FieldSize = 'md' | 'sm'

const fieldBoxBase =
  'w-full border bg-surface text-ink placeholder:text-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus disabled:cursor-not-allowed disabled:bg-band disabled:text-muted'

const fieldBoxSizes: Record<FieldSize, string> = {
  md: 'rounded-[9px] px-[11px] py-2 text-[13.5px]',
  sm: 'rounded-[8px] px-2 py-[5px] text-[13px]',
}

export const fieldBoxClass = (size: FieldSize = 'md'): string => `${fieldBoxBase} ${fieldBoxSizes[size]}`

export const fieldBorder = (invalid: boolean | undefined): string =>
  invalid ? 'border-status-late' : 'border-line'
