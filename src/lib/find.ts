// How "find" matches, written once so every place that finds things finds them
// the same way: the find field's own list, and any list a host filters with the
// words typed into a box above it.
//
// A person types names the way they type them, not the way they are stored:
// without the marks over letters, in any case. So both sides are folded the same
// way before comparing — "krumins" finds "Krūmiņš", "Ļ" is found by "l" — and the
// typed text matches anywhere in the name, not only at its start.

/** Text as find compares it: marks over letters removed, in lower case, trimmed. */
export function foldForFind(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

/** Whether any of the texts contains what was typed. Nothing typed matches everything. */
export function findMatches(query: string, ...texts: Array<string | undefined>): boolean {
  const needle = foldForFind(query)
  if (needle === '') return true

  return texts.some((text) => text !== undefined && foldForFind(text).includes(needle))
}
