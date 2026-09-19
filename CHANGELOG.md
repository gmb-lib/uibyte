# Changelog

Notable changes to this package, newest first. Versions are git tags; this file is written for
whoever bumps the dependency — what changed, and what it means for an application already built
on it.

This package ships **source**, compiled by the host, so every entry below is a change to what your
build compiles. Nothing here deploys and nothing holds state.

## v0.6.0

### Added — `Icon` and `IconPicker`: a named glyph set, and the grid that chooses from it

Twenty-six glyphs drawn by this package, each named for its **shape** — `wrench`, `beaker`,
`calendar`, `truck`, `beetle` — and drawn at the family's stroke weight in the colour of the text
around them.

The reason they are named rather than drawn is that a mark is often **data**: somebody chooses it,
you store it, it travels in an exported configuration file, and something reads it back in a
different deployment. A name survives all of that and draws the same mark at the other end. So:

```vue
<Icon name="wrench" />
<Icon :name="kind.icon" :size="14" />
<Icon name="alert" :size="18" :label="t('task.overdue')" />
```

**A name this version does not know draws nothing at all** — no placeholder, no question mark, no
reserved space. That is deliberate: a column of empty wells says a setting was missed, a column with
nothing in it says nothing is wrong. Ask `isIconName(name)` first if you need to react to it, and
import `iconNames` for the whole set.

A glyph is decoration unless you say otherwise. Give `label` only where the mark carries meaning no
neighbouring text carries, and it is announced as an image by that name.

`IconPicker` is the grid, and it is a radio group rather than a row of buttons — **one** stop in the
page order, arrow keys inside it, wrapping, `Home` and `End` at the ends. Twenty-six separate tab
stops is what a hand-drawn grid produces, and it makes the keyboard walk the whole set to reach
whatever comes after it.

```vue
<IconPicker v-model="form.icon" :options="glyphs" :label="t('kind.icon')" :clear-label="t('kind.noIcon')" />
```

```ts
import { iconNames, type IconPickerOption } from 'uibyte'

const glyphs: IconPickerOption[] = iconNames.map((name) => ({ name, label: t(`glyph.${name}`) }))
```

**Which glyphs, and what each is called, are yours.** `options` carries finished, already-translated
labels — this package's own names are English shape words, which are identifiers rather than words
to put in front of somebody. `clearLabel` offers the way back to nothing; omit it and a chosen glyph
can never be unchosen.

The full set: `alert` · `beaker` · `beetle` · `bolt` · `box` · `calendar` · `cart` · `chat` ·
`check` · `clipboard` · `clock` · `doc` · `flame` · `grid` · `lock` · `mail` · `pen` · `people` ·
`plus` · `ruler` · `shield` · `star` · `tag` · `target` · `truck` · `wrench`.

### Changed — `NavIcon` draws from the same geometry

Nothing about it moves: same name, same nine names it accepts, same size default, and it still
always draws a mark rather than leaving a hole in a row. What changed is where the drawing comes
from — one definition per glyph, so a mark in a sidebar and the same mark on a row can no longer
drift apart. Asserted glyph for glyph in the suite.

**Nothing else moves.** Additive; no component, token or type changed.

## v0.5.0

### Added — `Tabs`, a strip of choices with the keyboard contract it announces

A row of choices, and optionally the panel under them. The behaviour is the point: `role="tablist"`
tells a reader that the arrow keys move along the strip, and a row that announces itself that way
and then does not move is worse than plain buttons, which promise nothing.

So the component owns all of it — the strip is **one** stop in the page order rather than one per
choice, the arrow keys move along it and wrap, `Home` and `End` go to the ends, disabled choices are
stepped over, choosing follows focus, and the panel is wired to the choice that opened it.

You own which one is chosen; the component only says which was asked for.

```vue
<Tabs v-model="section" :tabs="sections" :label="t('settings.sections')">
  <template #default="{ tab }">
    <GeneralPanel v-if="tab.key === 'general'" />
    <PeoplePanel v-else-if="tab.key === 'people'" />
  </template>
</Tabs>
```

```ts
import type { TabItem } from 'uibyte'

const sections: TabItem[] = [
  { key: 'general', label: t('settings.general') },
  { key: 'people', label: t('settings.people'), tag: String(people.length) },
  { key: 'billing', label: t('settings.billing'), disabled: true },
]
```

`TabItem` is `{ key, label, tag?, disabled? }`. `label` and `tag` are **already translated and
already formatted** — this package neither counts nor formats, so a count is a string. A `disabled`
choice is **shown, never hidden**: drawn dimmed, announced as unavailable, never activated, and
never given the strip's tab stop. Use it for something a person may need to know exists before they
can ask for it.

Omit the default slot and you get the strip alone — no panel is rendered and no `aria-controls`
promises one.

**Nothing existing moves.** Additive only; no component, token or type changed.

## v0.4.0

### Added — `FileChip`, a file described

The mark its own name implies, the name, a line of facts about it, and an optional badge. It
**formats nothing**: `meta` is a list of finished, already-translated strings drawn in the order you
give them, because `1.8 MB` versus `1,8 MB` is your locale's decision. The `badge` is a string,
never a state — the chip stores no copy of it, derives nothing and asks no one. An `action` slot
holds whatever the file can be done to, keeping its own accessible name and focus ring.

The badge's colour is derived, and its contrast was proven on the chip's own background rather than
on the tint the derivation targets — so a repointed palette still yields a legible badge.

## v0.3.0

### Added — two more pill looks, a page accent family, and a focus ring that survives a dark surface

- `StatusPill` gained `look`: `soft` (the default pair), `solid` (the loud form, for the one loudest
  thing on a row) and `outline` (the quiet form). **Volume, never meaning** — the status role carries
  the meaning, and the label and mark are never optional.
- An **accent family**: one `accent` value in, `--color-accent` for graphics and fills and
  `--color-accent-deep` darkened until it reads as text. Use `-deep` for anything textual; the base
  is deliberately not text-safe.
- `--color-console-focus`, derived from `--color-focus` and lightened until it is unmistakable
  against the console colour. A technically-passing dark ring still disappears in practice, so the
  floor there is far above the text ratio.

## v0.2.0

### Added — grouped navigation, and a destination shown but not open

- `NavGroup` (`{ key, label, items }`) — the sidebar draws one small uppercase eyebrow per group;
  the small-screen bottom bar flattens them.
- `NavItem.locked` — drawn dimmed with a lock glyph, stripped of navigation and announced as
  unavailable. **Locked, never hidden**: an area a role does not reach, or a capability not part of
  a plan, is a different message from an absence.
- `NavItem.tag` — a small uppercase chip after the label, already translated.
- `ShellLabels` gained the assistive-technology suffix used on locked rows.

### Added — a source-hygiene gate

The package is shared by unrelated applications and stays shareable only while it knows nothing
about any of them. A test now walks the whole source tree and fails on a consumer's vocabulary or on
a reference to a document a reader cannot resolve — previously upheld by remembering to check, which
is a habit rather than a rule.

## v0.1.1

### Added — the adoption guide

`docs/consuming.md`: the wiring steps, a symptom-to-cause table for the ways a host's build can go
wrong, the props and slots each component expects, and how to repoint the palette through the theme
builder so the derived values move with it.

## v0.1.0

Initial code.
