// The one box a text field and a select are drawn as, so the two always look alike.
// Internal: not exported from the package entry.

export const fieldBoxClass =
  'w-full rounded-[9px] border bg-surface px-[11px] py-2 text-[13.5px] text-ink placeholder:text-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus disabled:cursor-not-allowed disabled:bg-band disabled:text-muted'

export const fieldBorder = (invalid: boolean | undefined): string =>
  invalid ? 'border-status-late' : 'border-line'
