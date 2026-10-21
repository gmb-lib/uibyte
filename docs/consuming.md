# Consuming uibyte

Everything an application needs to adopt this package, including the mistakes
that are easy to make and hard to diagnose. The README is the short version;
this is the one to read before wiring it into a real build.

## The four wiring steps

Missing any one of them fails quietly rather than loudly, so they are worth
doing together.

**1. Pin a version.** A tag, never a floating branch.

```json
"uibyte": "github:gmb-lib/uibyte#v0.13.0"
```

**Upgrading is not just editing the tag.** Changing the version in
`package.json` and running `npm install` can leave the lockfile resolved to the
*old* commit — npm treats the existing resolution as still satisfying the
range, so the build succeeds, CI agrees with itself, and you are running code
you think you replaced. Use `npm update uibyte`, then check what you actually
got:

```
npm ls uibyte     # must show the version you asked for, not the old one
```

**2. Keep the dependency optimiser away from it.** This package ships source,
and Vite's optimiser cannot parse single-file components.

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  optimizeDeps: { exclude: ['uibyte'] },
})
```

**3. Point Tailwind at it.** Its classes live in its source, so a build that
does not scan the package generates none of them.

```css
@import "tailwindcss";
@import "uibyte/theme.css";
@import "uibyte/fonts.css";        /* optional — omit if you serve the fonts */
@source "../node_modules/uibyte/src";
```

**4. Provide the peers**: Vue 3, Vite with `@vitejs/plugin-vue`, Tailwind 4.

### When something looks wrong

| Symptom | Cause |
|---|---|
| Components render completely unstyled, no error | the `@source` line is missing |
| `Failed to parse source` for a `.vue` file in `node_modules` | the `optimizeDeps.exclude` line is missing |
| Colours fall back to browser defaults | `theme.css` is not imported |
| Text renders in a system font | `fonts.css` is not imported, and you are not serving the faces yourself |
| Your type-checker reports errors inside the package | expected — it compiles from source; the package is checked as part of your build |

## What the components expect from you

This package deliberately contains **no router, no store and no translator**.
That is what lets applications with different stacks share it, and it means
three things at every call site.

**Text is a prop, already translated.** Nothing here renders a string it was not
given, and there is no translation layer to configure. The shell's full text
surface is the `ShellLabels` type.

**Links are injected.** Pass your own link component and put the destination in
each item's `linkProps`; they are handed over untouched, so a routed application
keeps real navigation and active states.

```ts
import { RouterLink } from 'vue-router'

const items: NavItem[] = [
  { key: 'home', label: t('nav.home'), icon: 'grid', linkProps: { to: { name: 'home' } } },
]
```

```vue
<AppShell :items="items" :labels="labels" :link-component="RouterLink">
  <template #brand><!-- your mark --></template>
  <template #sidebar-footer><!-- who is signed in --></template>
  <router-view />
</AppShell>
```

**A place whose screens each have an address uses `Tabs` as links.** The same
strip, the same underline, but each choice a link and the one open marked as the
page — the page below is yours, not a panel of the strip:

```vue
<Tabs
  :tabs="screens.map((s) => ({ key: s.name, label: t(s.word), linkProps: { to: { name: s.name } } }))"
  :model-value="current"
  :label="t('area.title')"
  :link-component="RouterLink"
/>
```

A strip wider than its room never wraps: it scrolls sideways within itself, the
chosen one is brought into view, and the side that has more fades.

**Navigation can be flat or grouped.** Pass `items` for a single list under the
optional `labels.section` eyebrow, or pass `groups` (each a labelled set of
items) and the sidebar draws one eyebrow per group. The mobile bottom bar
flattens groups into one row of tabs.

```ts
const groups: NavGroup[] = [
  { key: 'work', label: t('nav.work'), items: workItems },
  { key: 'registers', label: t('nav.registers'), items: registerItems },
]
```

**A destination can be locked.** An item with `locked: true` is shown, never
hidden — drawn dimmed with a lock glyph, stripped of navigation, and announced
to assistive technology with the `labels.locked` suffix you supply. Use it for
a capability a person may see exists but cannot open: an area their role does
not reach, or a module not part of their plan. An optional `tag` string renders
as a small uppercase chip after any item's label (locked or not), e.g. an
access level.

```ts
{ key: 'catalogue', label: t('nav.catalogue'), icon: 'shield', locked: true, tag: t('nav.adminTag') }
```

**Anything specific to your product is a slot.** The brand mark, the sidebar
footer and the top-bar actions are yours. `sidebar-extra` renders between the
navigation and the footer for content that belongs above the signed-in block —
a notice, an upgrade card. Wanting to put one of your own nouns *inside* a
component is the signal that it belongs in a slot instead.

On a wide screen the side menu is a fixed width and its column fills it, so the links
reach its edge and whatever you spread across the footer — a full-width menu, say —
spans the menu, however short its longest line.

**A status pill has three looks.** The look is volume, never meaning — the
status role carries the meaning. `soft` (the default) is the familiar derived
pair; `solid` is the loud form — saturated background, white label — for the
one loudest thing on a row; `outline` is the quiet form — bordered surface,
ink label, a dot in the role colour. The solid pair is derived like everything
else (the role colour darkens only as far as white legibility demands), so a
repointed role stays readable in every look.

```vue
<StatusPill status="late" :label="t('status.late')" look="solid" />
<StatusPill status="ontrack" :label="t('status.inWork')" look="outline" />
```

A pill can carry a glyph of yours from the package's set (`Icon`'s names) when it
says more than the role — a lock on something not open to the reader, say. Give
`icon` and it takes the mark's place in every look: the role's glyph in soft and
solid, the dot in outline. It is drawn at the pill's size and weight in the
label's colour, hidden from a reader like the mark it replaces, and the label still
carries the meaning — so where two roles share a hue, your glyph no longer tells
them apart; the words do. A name this version does not know draws the role's own
mark, so a pill is never left without one.

```vue
<StatusPill status="idle" look="outline" size="sm" icon="lock" :label="t('area.notIncluded')" />
```

**Finished work is `closed`, not `ontrack`.** `ontrack` means *on track, valid,
under way*; `closed` — a muted blue, marked with a check inside a circle — means
*done and put away*. Before `0.9.0` there was no `closed` and done was drawn in
`ontrack`; an application upgrading moves its finished states across, and keeps
*cancelled* or *closed without an outcome* in `idle`.

```vue
<StatusPill status="closed" :label="t('status.closed')" />
```

**A file is described by a chip, and you describe it.** `FileChip` draws the
mark its name implies, the name itself, a line of facts and an optional badge.
It formats nothing: `meta` is a list of finished, already-translated strings,
drawn in the order you give them and separated for the eye only. That is
deliberate — a size written `1.8 MB` in one language and `1,8 MB` in another is
your locale's decision, not this package's, and it is what lets one chip serve
a list that shows a type and a size and a list that shows a size, a person and
a date.

The `badge` is a **string, never a state**. Whatever it reflects is something
you have just read; the chip stores no copy of it, derives nothing from it and
asks no one — it paints the words you pass, in a role colour proven to read on
the chip's own background. Pass `badgeStatus` to choose the role; the words
carry the meaning, so the colour is tone only.

Anything a file can be *done to* is yours: put it in the `action` slot, where it
keeps its own accessible name and focus ring.

```vue
<FileChip
  name="north-bay-layout.pdf"
  :meta="[formatSize(f.size), f.author, formatDate(f.at)]"
  :badge="f.checked ? t('files.checked') : undefined"
>
  <template #action>
    <button :aria-label="t('files.download', { name: f.name })" @click="download(f)">…</button>
  </template>
</FileChip>
```

**A short name in a pill is `Chip`.** A hairline border, 12px text, on the band fill
(`tone="band"`, the default) or the surface fill (`tone="surface"`). The words are the
default slot, already translated. A control of your own goes in the slot too — a button
that takes the thing away keeps its own accessible name and focus ring; the chip draws
no remove control. It is for naming a thing; a status is a `StatusPill`.

`given` draws the border dashed, for something held because of something else, and in
the muted colour, so the dash clears the 3:1 a visible state needs (the hairline does
not). A dashed line carries nothing to a reader who cannot see it, so pass `note` with it, in your words
— what it is given by. The note is the pill's `title` and is also said to a screen reader
after the content, visually hidden. A `given` chip without a note still draws dashed.
Attributes and `class` reach the pill.

```vue
<Chip>{{ tag.name }}</Chip>
<Chip tone="surface" given :note="t('tag.givenBy', { name: group.name })">{{ tag.name }}</Chip>
<Chip>{{ tag.name }} <button type="button" :aria-label="t('tag.remove', { name: tag.name })" @click="remove(tag)">×</button></Chip>
```

**A tab strip is a keyboard contract, not a row of buttons.** `Tabs` draws the
choices and, on request, the panel under them. You own which one is chosen —
`v-model` on the key — and the component owns everything a reader needs for the
markup to keep its promise: the strip is a **single** stop in the page order,
the arrow keys move along it (Home and End go to the ends), choosing follows
focus, and the panel is wired to the choice that opened it.

That behaviour is the reason to reach for this rather than styling four buttons.
`role="tablist"` tells a reader the arrow keys work; a row that announces itself
that way and then does not move is worse than plain buttons, which promise
nothing.

A `disabled` choice is **shown, never hidden** — drawn dimmed, announced as
unavailable, never activated, and never given the strip's tab stop. Use it for
something a person may need to know exists before they can ask for it. `tag` is
a small chip after the label: a count, a short note, already translated and
already formatted, because this package neither counts nor formats.

Omit the default slot and you get the strip alone, with no panel and no
`aria-controls` pointing at a region that is not there.

```vue
<Tabs v-model="section" :tabs="sections" :label="t('settings.sections')">
  <template #default="{ tab }">
    <GeneralPanel v-if="tab.key === 'general'" />
    <PeoplePanel v-else-if="tab.key === 'people'" />
  </template>
</Tabs>
```

```ts
const sections: TabItem[] = [
  { key: 'general', label: t('settings.general') },
  { key: 'people', label: t('settings.people'), tag: String(people.length) },
  { key: 'billing', label: t('settings.billing'), disabled: true },
]
```

**A glyph is a name, and the name is data.** `Icon` draws one mark from the
package's fixed set of 27, at the family's stroke weight and in the colour of
the text around it. `name` is a plain string on purpose: the names an
application shows are usually chosen by somebody, stored, exported and read back
somewhere else, so being handed a name this version does not know is a normal
event rather than a programming error. When that happens **nothing is drawn** —
no placeholder, no question mark, no reserved space. A column of empty wells
says a setting was missed; a column with nothing in it says nothing is wrong.
Ask `isIconName` first if you need to react to it, and import `iconNames` for
the whole set.

A glyph is decoration unless you say otherwise. Give `label` only when the mark
carries meaning no neighbouring text carries — a lone icon control — and it is
announced as an image by that name.

```vue
<Icon name="wrench" />
<Icon :name="kind.icon" :size="14" />
<Icon name="alert" :size="18" :label="t('task.overdue')" />
```

**Choosing a glyph is a set of mutually exclusive choices, so `IconPicker` is
built as one:** a radio group that is a **single** stop in the page order, arrow
keys moving inside it and wrapping, Home and End at the ends. Twenty-seven buttons
each taking their own tab stop is what a hand-drawn grid reliably produces, and
it makes the keyboard walk the whole set to reach whatever follows it.

**Which glyphs and what they are called are yours.** This package does no i18n
and its own names are English shape words — identifiers, not words to put in
front of somebody — so `options` carries finished, already-translated labels and
you decide which of the 27 your people may choose from. `clearLabel` offers the
way back to nothing; omit it and a chosen glyph can never be unchosen.

```vue
<IconPicker
  v-model="form.icon"
  :options="glyphs"
  :label="t('kind.icon')"
  :clear-label="t('kind.noIcon')"
/>
```

```ts
import { iconNames, type IconPickerOption } from 'uibyte'

const glyphs: IconPickerOption[] = iconNames.map((name) => ({
  name,
  label: t(`glyph.${name}`),
}))
```

`NavIcon` is unchanged and draws from the same geometry — ten of the names, the settings gear
among them, for sidebars and drawers, and it always draws something rather than leaving a hole
in a row of marks.

**A file drop is the platform's own file input, with a zone around it.**
`FileDrop` is a `<label>` wrapping a visually hidden native input, so a click
anywhere opens the chooser, the keyboard reaches it as the single control it
is, and a reader hears it by the zone's own words — `label`, and `hint` under
it. None of that is imitated in script, which is the reason to reach for it
rather than a `div` with a click handler.

It listens for two things. `files` hands over what was chosen or dropped, and is
never an empty list. `rejected` hands back what a drop brought that the zone does
not take: `'type'` when `accept` refuses it — the platform filters only the
chooser, so a drop is held to the same rule here — and `'count'` when several
files land where `multiple` is off, because which one was meant is not the
component's guess to make. Say why in your own words; the zone owns none.

The input is cleared after every choice, so choosing the same file again — after
correcting it, say — is still heard. The highlight holds while a file moves over
the zone's own text, and `disabled` makes both the drop and the click do nothing.

```vue
<FileDrop
  :label="t('import.drop')"
  :hint="t('import.dropHint')"
  accept=".json,application/json"
  :disabled="working"
  @files="([file]) => preview(file)"
  @rejected="(files, why) => (refusal = t(`import.rejected.${why}`))"
/>
```

**A diff list renders an answer; it never works one out.** `DiffList` draws
titled groups of keyed rows — each with a status pill and the reason beside it —
from `groups` you build out of whatever your services answered. Every word is
yours, including the status's own: the same role reads *added* in a preview and
*applied* in an outcome, so a row carries `statusLabel` beside its `status` role,
and the role only tones the pill.

A row marked `folded` waits behind one toggle per group, which reads your
`foldedLabel` (the package neither counts nor pluralises, so *"38 unchanged"* is
yours to say) and tells a reader whether it is open. A row marked `marked` is
drawn in its own role's tint, for the one a reader must not miss. A row with a `label` — the thing's name — is drawn by
it, with the `key` after it in quieter mono: a person knows a thing by its name, and
the key is for whoever must find it in a file. The part
column appears only in a group whose rows have parts; a group with no rows draws
its title and its `note` — the place to say why there is nothing to show. The
list keeps one thing of its own, which groups a reader has unfolded; everything
else follows the prop, so a new answer is simply a new list.

```vue
<DiffList
  :groups="sections"
  :columns="{ part: t('diff.part'), key: t('diff.key'), status: t('diff.status'), detail: t('diff.why') }"
/>
```

```ts
import type { DiffGroup } from 'uibyte'

const sections: DiffGroup[] = [
  {
    key: 'palette',
    title: t('section.palette'),
    badge: t('section.clean'),
    badgeStatus: 'ontrack',
    summary: t('diff.changes', { n: 2 }),
    foldedLabel: t('diff.unchanged', { n: 38 }),
    rows: [
      { key: 'teal', part: 'colours', status: 'ontrack', statusLabel: t('diff.added') },
      { key: 'navy', part: 'colours', status: 'idle', statusLabel: t('diff.same'), folded: true },
    ],
  },
]
```

**A page says its title once, at the top.** `PageHeader` draws the page's heading
(`h1` unless you give a `level` for a page inside another's frame; the size
follows), with an optional `eyebrow` above it for the area, a quiet `subtitle`
under it, and your actions in the `actions` slot at the top right. When the row is
too narrow for both, the actions wrap under the title; the title is never what
gives way. The decision is made by the header's own row, not the window, so a
page drawn beside a list behaves the same on a wide screen.

It offers **one** way back, above everything else: `back` is the destination's
name and the props for your link component, handed over untouched. The arrow is
drawn and hidden from a reader, so write the name alone — *Items*, not
*← Items* — or a screen reader announces "leftwards arrow" first.

```vue
<PageHeader
  :title="item.name"
  :eyebrow="t('area.workspace')"
  :back="{ label: t('items.title'), linkProps: { to: { name: 'items' } } }"
  :link-component="RouterLink"
>
  <template #actions><Button variant="outline">{{ t('item.edit') }}</Button></template>
</PageHeader>
```

Beside the title there is room for one short mark of yours — a pill saying the
page's subject is locked or archived, say — in the `title-after` slot. It is drawn
on the title's line, after it, and goes under the title when the line is too
narrow for both; the title is not squeezed for it either. It sits beside the
heading, not inside it, so the heading is still named by the title alone, and a
reader hears the mark's words after it as words of their own — so give the mark
words, not a glyph alone. Pass the slot only when there is a mark
(`<template v-if="…" #title-after>`); a header without one is drawn exactly as
before.

```vue
<PageHeader :title="area.name">
  <template v-if="area.locked" #title-after>
    <StatusPill status="idle" look="outline" icon="lock" :label="t('area.locked')" />
  </template>
</PageHeader>
```

The title's own place can be yours too: the `title` slot is drawn **instead of the
visible title** — a form that edits the thing the page is about, say — while the
way back, the `eyebrow`, the `subtitle` and the actions keep their places. The page
keeps its heading: it is still drawn, at its level, for a reader only, and it says
your `title`. So while the slot is drawn, `title` is what a reader hears first and
nobody sees — word it for what is happening (*Edit Van V-2*), not only the name.
The slot takes the title's whole line; a `title-after` mark is not drawn with it.
Pass the slot only while it is wanted (`<template v-if="editing" #title>`); without
it the title is drawn as before.

```vue
<PageHeader :title="editing ? t('item.editing', { name: item.name }) : item.name" :back="back" :link-component="RouterLink">
  <template v-if="editing" #title>
    <ItemForm v-model="draft" @save="save()" @cancel="editing = false" />
  </template>
  <template v-if="!editing" #actions><Button variant="outline" @click="editing = true">{{ t('item.edit') }}</Button></template>
</PageHeader>
```

**A read that has nothing to show says why, and a failed one never says
"nothing".** `StateBlock` draws a read's `state` — `loading`, `empty` or `failed`
— from your words: a `title` (what is true) and a `text` (why, or what to do).
The three are one prop, so an empty answer and a failed read cannot be drawn as
each other, and there is no prop a service's code could be passed through: say
what happened in a sentence, and keep the code for your logs.

Loading and empty are announced politely; a failure is announced at once. Give
`retryLabel` and a failure offers to try again — the block emits `retry` and you
read again. Anything else a person can do goes in the `actions` slot (*Add the
first one* on an empty list, *Back* on a failure); the buttons sit outside the
announcement, so a reader hears what happened rather than every label at once.
`size="page"` centres it as a page's whole content; the default sits inside a card.
With no words at all it draws its state and says nothing — it has no sentence of
its own to fall back on, because it would be in the wrong language.

```vue
<StateBlock v-if="list.failed" state="failed" :title="t('list.down')" :text="t('list.downWhy')"
            :retry-label="t('common.tryAgain')" @retry="list.read()" />
<StateBlock v-else-if="list.loading" state="loading" :text="t('common.reading')" />
<StateBlock v-else-if="!list.rows.length" state="empty" size="page" :title="t('list.none')">
  <template #actions><Button>{{ t('list.add') }}</Button></template>
</StateBlock>
```

**Finding something is typing a few letters and choosing from what matches.**
`FindField` searches `options` you have already read — each a `FindOption` with a
`key` (what you are told), a `label` and an optional `note` (both searched, so a
code or a second name can be found too), and `disabled` for one that is shown but
cannot be chosen. It fetches nothing.

One at a time (the default) it is a combobox: the matches open under the box in
the page's own flow, the arrow keys move through them and Enter takes one. Typing
never chooses — `v-model` changes only when a match is taken, and a box left with
half a name in it goes back to the name actually chosen. Give `clearLabel` to
offer the way back to nothing. With `multiple` it is one card, since its ticks are
always open: your `summary` line first (how many there are to choose from, say —
it is not drawn while the list is being read or could not be), then the box, then
the ticks it narrows; what is ticked stays in view at the top whatever is typed.
The box stays where it is while the list is read and after, so someone typing as
it arrives keeps their place.

```vue
<FindField
  v-model="holder"
  :options="people.map((p) => ({ key: p.id, label: p.name, note: t('holds', { n: p.holds }) }))"
  :label="t('handOver.to')"
  :placeholder="t('people.find')"
  :no-match="t('people.noMatch')"
  :loading="people.reading ? t('common.reading') : undefined"
  :failed="people.failed ? t('people.unreadable') : undefined"
/>
```

When the list could not be read, say so with `failed` — the field offers nothing
in its place. It deliberately has no way to type a key instead: a person does not
know one. Matching ignores case and the marks over letters (*krumins* finds
*Krūmiņš*), and the rule is exported as `findMatches(query, ...texts)`, so a list
you filter yourself with a plain box above it finds the same way.

An option may carry an `icon` — a glyph name from the package's set — drawn before
its name in the list, in the box once it is chosen, and beside each tick. It is for
the eye; the name carries the meaning. As with `Icon`, a name this version does not
know draws nothing and keeps no room open for itself, so a glyph name read from
your data is safe to pass as it is. `footer` is a quiet line under the options,
said whenever the list is open — how many there are, and where they are kept — and
the box is described by it, so a reader hears it too.

```vue
<FindField
  v-model="kind"
  :options="kinds.map((k) => ({ key: k.id, label: k.name, icon: k.icon }))"
  :label="t('item.kind')"
  :no-match="t('kinds.noMatch')"
  :footer="t('kinds.count', { n: kinds.length })"
/>
```

**An identity code is typed with its country beside it.** `IdentityCodeField` draws the
two as one field — a choice of the country that issued the code, then the box the code
is typed in — because they are one value: the same digits in two countries are two
people. Hold the code with `v-model` and the country, a two-letter code, with
`v-model:country`. `label` names the box and `countryLabel` the choice, for a reader;
give `id` and a visible label of yours can point at the box.

**The countries and every word are yours.** This package carries no list of countries,
no country's name and no sentence. `countries` is a list of `CountryGroup`s, each
`{ key, label?, countries }`, every country a `{ code, label }` already named in the
reader's language. A group with a `label` is drawn under that heading; a group without
one draws its countries plainly, so a short list is one group with no label. Naming the
countries is a few lines of `Intl.DisplayNames` in your application — which countries,
in what order and in which language are yours to decide, so the package does not do it.

The field reads what was typed when the person is done with it: on leaving the box, on
Enter — which settles the box and does not send the form around it — and when the
country changes. One thing comes earlier: a code that already reads right is said to be
settled as it is typed, so the `settled` line is in place before the person reaches your
form's button and nothing moves under their click. A code it can use is rewritten the one way it will be read back: a
personal number as its country writes it, the country left to the choice. A code that
names its own country — pasted with its type and country in front, `PNOEE-…` — moves the
choice to that country when you offer it. When you do not, the choice stays and the box
keeps the whole code, country and all, so the code is never read beside the wrong
country as somebody else's.

A code it cannot use is refused under the field, in your sentence. `describe` is given
the reason and a country, and returns what a person should be told. The country is the
one whose format refused the code: the code's own when it names one — `PNOEE-…` typed
beside Latvia is held to Estonia's format, and your sentence should say Estonia — and
otherwise the one it was read beside. The reason is an `IdentityCodeError`: its `problem`
is one of `empty`, `malformed`, `unknownType`, `notAPerson`, `ambiguous`,
`countryMissing`, `length` and `digits`, with the identity `type` it names for
`unknownType` and `notAPerson`, the `country` whose format refused it for `length` and
`digits`, and the `expected` and `actual` digit counts for `length`. The sentence is
announced at once, the box is marked invalid and described by it, and the frame takes
the refusal colour — the words carry the refusal, never the colour alone. Typing again
takes it away, and an empty box says nothing: whether the code is required is yours to
say when the form is sent.

`settled` is a line drawn, with a check, once a usable code is settled; leave it out and
none is drawn. `note` is a quiet line under the field — the place to say why the code is
asked — and the box is described by it, so a reader hears it too. The empty box shows
the chosen country's pattern where its format is known (`XXXXXX-XXXXX` for Latvia), and
`placeholder` puts your own words there instead — drawn in the text face, since words are not a code, where
the pattern keeps the code face. `disabled` holds both halves.

```vue
<IdentityCodeField
  id="person-code"
  v-model="form.code"
  v-model:country="form.country"
  :countries="countries"
  :label="t('person.code')"
  :country-label="t('person.codeCountry')"
  :describe="refusal"
  :note="t('person.codeWhy')"
/>
```

```ts
import type { CountryGroup, IdentityCodeError } from 'uibyte'

const names = new Intl.DisplayNames([locale.value], { type: 'region' })
const countries: CountryGroup[] = [
  { key: 'all', countries: ['LV', 'EE', 'LT'].map((code) => ({ code, label: names.of(code) ?? code })) },
]

function refusal(e: IdentityCodeError, country: string): string {
  switch (e.problem) {
    case 'length':
      return t('code.length', { country: names.of(country), want: e.expected, got: e.actual })
    case 'unknownType':
    case 'notAPerson':
      return t(`code.${e.problem}`, { type: e.type })
    default:
      return t(`code.${e.problem}`)
  }
}
```

**The rule is exported**, so a form's Send is held to the same answer the field shows:
`parseIdentityCode(typed, country)` returns `{ ok: true, stored, display, code }` —
`stored` the one spelling a service compares, `display` what a person is shown — or the
same `IdentityCodeError` the field describes. The field never decides whether a form may
be sent; your Send does, with this. `displayIdentityCode(stored)` shows a stored code the
way a person recognises it, and `identityCodePattern(country)` is the example the empty
box shows. A service receiving the code should canonicalise it again: this copy of the
rule is there to explain a refusal before anything is sent, and cannot decide an
identity.

**One choice of a few, all in view, is a segmented choice.** `SegmentedChoice` draws
your `options` side by side in one frame — two or three ways of doing one thing — and
fills the chosen one. You own which one is chosen, with `v-model` on its key, and
`label` names the group for a reader. Each option is a `SegmentedOption`: a `key` (what
you are told), a `label` already translated, and `disabled` for a way that is shown and
announced but cannot be taken.

It is a radio group, and keeps the promise one makes: it is a **single** stop in the
page order — on the chosen option, or on the first that can be chosen while none is —
the arrow keys move along it and choose as they go, wrapping at the ends, Home and End
go to the first and the last, and Space and Enter choose the option the caret is on. An
option that cannot be chosen is stepped over and never takes the stop. A key held with
Alt, Control or Meta is left to the browser. The chosen option is filled, its words are
drawn heavier and it is announced as checked, so the fill is never the only sign of it;
every option keeps the room its heavier words take, so choosing one does not shift the
rest. In a narrow box the options wrap onto another line rather than scroll out of
sight.

It holds a value — a setting a form keeps, or which way the part after it is drawn —
and what each choice shows is yours: draw it under the group, by the key. Sections of a
page, each a panel the strip names, are `Tabs`; counts that filter a list are
`CountStrip`; several at once is `FindField` with `multiple`, or ticks.

```vue
<SegmentedChoice v-model="way" :options="ways" :label="t('add.how')" />
<ChooseFromList v-if="way === 'listed'" />
<DescribeNew v-else />
```

```ts
import type { SegmentedOption } from 'uibyte'

const ways: SegmentedOption[] = [
  { key: 'listed', label: t('add.fromList') },
  { key: 'new', label: t('add.new') },
]
```

**Every act ends in a sentence.** `ActLine` says what an act did (`outcome="done"`,
announced politely) or why it was refused (`outcome="refused"`, announced at once),
in your `text`, toned by the outcome. A way on — *Open it* after something was
made — goes in the `action` slot, outside the announcement. It stays until you
take it away, usually with the next act: a line that fades on a timer is gone
before a slow reader reaches it.

```vue
<ActLine v-if="said" :outcome="said.ok ? 'done' : 'refused'" :text="said.text">
  <template v-if="said.link" #action><RouterLink :to="said.link">{{ t('open') }}</RouterLink></template>
</ActLine>
```

**An act worth asking about is asked in place.** `ConfirmAsk` draws the question
where the act was asked for — never a window over the page — with what it does
(`detail`: say whether it can be undone) and two answers in your words. When it
appears it takes focus on the answer that changes nothing, so a stray Enter is
harmless, and when you remove it focus goes back to whatever opened it. Escape
answers *keep*. Give `danger` when the act cannot be undone: its button wears the
danger look (also available on its own as `Button variant="danger"`). Hold both
answers with `busy` while the act runs.

```vue
<ConfirmAsk v-if="asking" :question="t('item.retire.ask', { name })" :detail="t('item.retire.final')"
            :confirm-label="t('item.retire.do')" :keep-label="t('common.keep')" danger :busy="working"
            @confirm="retire()" @keep="asking = false" />
```

**A short form that belongs to the page opens over it.** `Window` is a modal
window for a form like changing an item's details, where leaving the page would
lose the person's place: your `title` as its heading — and the name a reader hears
— your form in the default slot, your buttons in the `footer` slot, and a close mark
named by `closeLabel`. Hold it with `v-model:open`.

When it opens, focus moves to the first thing in its body that takes it — not the
close mark, which comes first, because the person opened the window to fill it in
— or to the window itself when the body holds nothing to focus. Tab stays inside,
and the page behind is held still and hidden from a reader. Escape, the close mark
and a press on the backdrop each close it (`update:open` with `false`), and focus
goes back to whatever opened it.

Set `busy` while something the window started is under way — a save, say — and
none of the three closes it, so its answer is never left unseen; the close mark is
announced as unavailable. Setting `open` yourself still closes it, so a save that
answers can close the window at once. Your own buttons are yours to hold. An
Escape that something inside has already used — a `FindField` closing its list —
leaves the window open.

It is a short form's width (560px), or `size="wide"` (760px) for a form laid out
in two columns. It folds by the width of the space it opens in, as everything here
does — for a window that is the whole page, since it opens on the page's body:
below 640px it takes the full width and height.

```vue
<Window v-model:open="editing" :title="t('item.edit')" :close-label="t('common.close')" :busy="saving">
  <ItemForm v-model="draft" />
  <template #footer>
    <Button variant="outline" @click="editing = false">{{ t('common.cancel') }}</Button>
    <Button :disabled="saving" @click="save()">{{ t('common.save') }}</Button>
  </template>
</Window>
```

An act asked about first is not a window: ask it in place with `ConfirmAsk`. And
the name is also the browser's: where this one is imported, `Window` as a type is
still the browser's, but `Window` as a value — `x instanceof Window` — is the
component, so a module that needs the browser's imports this one under another
name: `import { Window as FormWindow } from 'uibyte'`.

**In a list, the whole row is the way in.** `ListTable` draws your `rows` on a
grid of `columns`, and each row is one target — one stop in the page order,
announced as one. Give `rowLink` (props for your `linkComponent`) and each row is
your link; leave it out and each row is a button that emits `open` with the row.
A cell draws the row's field of the same `key`, or your `cell-<key>` slot. Mark
the row open beside the list with `current`.

It folds by its **own** width, not the window's, because a list beside an open
item is narrow on any screen. A column's `priority` says how: `1` is the title
(on a line of its own when narrow), `2` (the default) folds into the line under the
title, `3` is shown only while the table is wide. The thresholds are the table's
own width — 1100px, then 760px, where the header goes too. Sorting is asked for
(`sortable` columns emit `sort`); you sort, and pass `sort` back with
`sortedLabels`, the words a reader hears after the sorted column's name. Put a
`Pager` in the `footer` slot to keep it in the same card.

```vue
<ListTable :columns="columns" :rows="page" :row-key="(p) => p.id" :label="t('people.title')"
           :row-link="(p) => ({ to: { name: 'person', params: { id: p.id } } })" :link-component="RouterLink"
           :sort="sort" :sorted-labels="{ ascending: t('sort.az'), descending: t('sort.za') }" @sort="toggleSort">
  <template #cell-name="{ row }"><b>{{ row.name }}</b></template>
  <template #footer>
    <Pager v-model:page="pageNo" :pages="pages" :range="t('pager.range', { from, to, total })" :label="t('pager.label')"
           :previous-label="t('pager.previous')" :next-label="t('pager.next')" :page-label="(n) => t('pager.page', { n })" />
  </template>
</ListTable>
```

**A list whose rows hold controls is drawn on the same grid, and its rows are
nothing to press.** When a row holds controls of its own — a choice made in place,
an act on that row, a link to somewhere else — it cannot also be one target: a
control inside a link or a button is two targets at once, and a reader is told of
one thing to press with others inside it. `ControlList` takes the same `columns`,
`rows`, `rowKey`, `label`, `sort`, `sortedLabels`, `sort` event and `footer` slot
as `ListTable`, and draws the same card, header and grid, folding the same way by
its own width. What differs is the row: it is its cells and nothing else, each
cell your `cell-<key>` slot or the row's field, and every control you put in a cell
is its own stop in the page order. The header is for the eye, so name each
control for its row — a picker that says *Access — Anna Ozola*, not *Access* —
and give a column that holds only an act an empty `label`.

Under a row's cells, inside its entry, the `row-after` slot holds something about
that row alone, such as the `ConfirmAsk` that asks before an act on it; give it
for the one row that needs it and nothing is drawn for the others.

```vue
<ControlList :columns="[{ key: 'name', label: t('people.name'), priority: 1, width: 'minmax(220px,1.6fr)' },
                        { key: 'access', label: t('people.access'), width: '170px' },
                        { key: 'added', label: t('people.added'), priority: 3 },
                        { key: 'act', label: '', width: '90px', end: true }]"
             :rows="page" :row-key="(p) => p.id" :label="t('people.title')">
  <template #cell-name="{ row }"><b>{{ row.name }}</b> <small v-if="row.id === me">{{ t('people.you') }}</small></template>
  <template #cell-access="{ row }">
    <select :value="row.access" :aria-label="t('people.accessOf', { name: row.name })" @change="change(row, $event)">
      <option v-for="a in levels" :key="a.id" :value="a.id">{{ a.name }}</option>
    </select>
  </template>
  <template #cell-act="{ row }"><Button size="sm" variant="ghost" @click="asking = row.id">{{ t('people.remove') }}</Button></template>
  <template #row-after="{ row }">
    <ConfirmAsk v-if="asking === row.id" :question="t('people.removeAsk', { name: row.name })" :confirm-label="t('people.remove')"
                :keep-label="t('common.keep')" danger @confirm="remove(row)" @keep="asking = ''" />
  </template>
</ControlList>
```

Which of the two a list is follows from its rows, not from its look. If the whole
row opens one thing and holds nothing else, it is a `ListTable` — a `ControlList`
whose only control is a link in its name cell is the hand-drawn list `ListTable`
replaced, where the rest of the row is dead to a click.

**Counts that filter are one strip.** `CountStrip` draws `items` — each a label,
an optional `count` you have already formatted, and an optional `status` for a
dot — as toggles, one chosen (`v-model`), each announcing whether it is. It cannot
add a count, so it shows only what your read already has. It wraps rather than
scrolling sideways; put *More filters* or a find box in the `more` slot.

```vue
<CountStrip v-model="filter" :items="counts" :label="t('people.show')">
  <template #more><input type="search" :placeholder="t('people.find')" v-model="query" /></template>
</CountStrip>
```

**An order a person sets is dragged, or moved from the keyboard.** `OrderableList`
draws your `items` in order — each a card with a grip and its position — and asks
for a move: drag a row onto another, or press Alt+ArrowUp / Alt+ArrowDown on a
focused row, and it emits `move` with the row's index and where it should go. It
never reorders anything itself; you own the array and apply the move. `itemKey` is
a row's identity (never its index), `label` names a row, `listLabel` names the
list, and `rowLabel` names a row while it can be moved — say the position, since
that is what changes. `orderable: false` draws the same list with nothing to move.

```vue
<OrderableList :items="levels" :item-key="(l) => l.id" :label="(l) => l.name" :list-label="t('levels.title')"
               :row-label="(name, at, of) => t('levels.position', { name, at, of })" @move="moveLevel">
  <template #default="{ item }">{{ item.name }}</template>
</OrderableList>
```

**A row with links or buttons of its own moves by its grip alone.** Such a row
cannot also be the thing that is dragged and the stop the keyboard lands on: its
links would drag the row, and its controls would sit inside an option a reader is
told to choose. With `handle` the list is a plain list and you draw each row in
full — no card, no position badge. The row's grip reaches your slot as `grip`;
place it with `<component :is="grip" />` wherever the row wants it, such as the
start of a heading line with the row's own list under it.

The grip is a button in the Tab order, named by your `rowLabel`, and
Alt+ArrowUp / Alt+ArrowDown on it emits `move`. Only a drag that starts on the
grip moves the row — the whole row, with the same drop line and fade; anywhere else
in it, text selects and links drag as links. If you apply a move later — after
writing it somewhere — focus goes back to the moved row's grip once you draw the
new order, unless the person has moved on. Without `orderable`, `grip` is absent
and nothing moves.

```vue
<OrderableList handle :items="groups" :item-key="(g) => g.id" :label="(g) => g.name" :list-label="t('groups.title')"
               :row-label="(name, at, of) => t('groups.move', { name, at, of })" @move="moveGroup">
  <template #default="{ item, grip }">
    <div class="flex items-center gap-3"><component :is="grip" /><h3>{{ item.name }}</h3></div>
    <EntryList :entries="item.entries" />
  </template>
</OrderableList>
```

**A menu is a button and a short list.** `Menu` draws `label` on a pill-shaped
button; the list of `items` opens on the page's body, so a page that is its own
size container never clips it. The arrow keys, Enter, Space and Escape do what the
menu pattern promises, and focus returns to the button. Give `modelValue` and the
menu is a choice among options: each is announced as checked or not, the chosen
one wears a check, and `update:modelValue` fires only for a different choice.
Without it the menu is a list of acts and emits `select`. An item's `lang` marks
words in another language.

```vue
<Menu :label="t('sort.label', { by: t(`sort.${sortBy}`) })" :items="sortChoices" v-model="sortBy" align="start" />
```

A page that draws one menu per row — *Move to…* on every row — gives every button
the same words, and a reader or a voice command cannot tell them apart. Give
`about`, what this one acts on, and the button is named by its words and then that:
*Move to… — Quarterly report*. Your words come first, so the name still holds what
is on screen, and nothing drawn changes. An `aria-label` given to `Menu` does not
reach its button; `about` is the way to name it.

```vue
<Menu :label="t('row.moveTo')" :about="row.name" :items="destinations" @select="(to) => move(row, to)" />
```

Where a menu sits is yours to say, and three options say it. `side="top"` opens the
list above the button — for a button at the foot of a column, with no room below;
with no room above, it opens below instead. `tone="console"` draws the
button for the dark application menu: no fill of its own, the dark surface's line
for a border, light words, a faint fill when pointed at or open, and the focus ring
made for the dark surface. The list it opens stays the light list every menu opens.
`block` spreads the button across its container — its words take the room between
whatever leads them and the arrow — and opens a list at least as wide as the button.
Left out, each is as before: below, on a light surface, as wide as its words.

An item's `note` is a short word drawn after its words, small and quiet — *everyone
here* beside the one everyone has. It is in the page's language, so when an item
has one, the item's `lang` marks its words alone and the note is read as the page
is. A reader hears it as part of the item's name, after the words.

**The language menu names every language in itself.** `LanguageMenu` takes the
`languages` your application carries, each `{ code, name }` with the name in that
language (*Latviešu*, never *Latvian*), and `modelValue`, the code in use. Its
button shows the current language's own name beside a globe; each name is marked
with its language so a reader pronounces it right; `label` names what the menu
changes, in the page's language. Whether the first choice comes from the browser
and where a choice is kept are yours.

```vue
<LanguageMenu v-model="locale" :languages="[{ code: 'en', name: 'English' }, { code: 'lv', name: 'Latviešu' }]"
              :label="t('language')" @update:model-value="(code) => keepInThisBrowser(code)" />
```

It takes `side`, `tone`, `block` and `align` and hands them to its menu, and when `block` is
set the group around it spans its container too. A language's `note` reaches its
item: at the foot of a dark side menu, opening upward across the menu's width, the
language everyone here has can say so in the page's language.

```vue
<template #sidebar-footer>
  <LanguageMenu v-model="locale" side="top" tone="console" block :label="t('language')"
                :languages="languages.map((l) => ({ ...l, note: l.code === everyoneHas ? t('language.everyoneHere') : undefined }))" />
  <!-- the signed-in person's name, below it -->
</template>
```

**An item opens beside its list, or instead of it.** `SplitDetail` takes the
`list` and `detail` slots and `open`. With room — decided by its own width, so a
narrow column behaves the same on any screen — the item sits beside the list
(`detailWidth`, 390px by default); below 760px it replaces the list, with a way
back reading `backLabel` (the list's name; the arrow is drawn). Taking it emits
`back`: close the item. Focus follows: to the item when the list is no longer
shown, and back to the row the list marks `aria-current` (as `ListTable` does with
`current`).

```vue
<SplitDetail :open="!!person" :back-label="t('people.users')" :label="person?.name" @back="person = null">
  <template #list><ListTable … :current="person?.id" @open="(p) => (person = p)" /></template>
  <template #detail><PersonCard :person="person" /></template>
</SplitDetail>
```

A short list or a tree leaves the item pinned far right across empty width. Give
`list="fit"` and the list takes its content's width (never wider than the room it
has, and it still shrinks when space is short) with the item opening right beside
it, the pair aligned to the start. The default is `list="fill"`. The fold point, the
way back and focus are the same under both.

**The first few, then the rest.** `FoldMore` shows `limit` items (5) and your
`moreLabel` for the rest — counted and worded by you. Hold it `open` while a
search is running: a match behind the fold is a match the person never sees.

Four options, none changing the default. `moreLabel` may be a function of how many
are still hidden, for a host that does not know the count itself. `fewerLabel`
adds a second button, once the list is unfolded, that folds it back to the limit;
focus lands on the button for the rest again (without it, unfolding is one way).
`keep` is a predicate: items it accepts always show, in their place, even beyond
the limit, and only the items still hidden are counted — a search can show every
match in a list folded after five, and when nothing is hidden there is no button
for the rest. `layout="rows"` draws each item as a block row with no separators
(your default slot draws the row), the buttons under the rows; the default is
`inline`. `index` in the slot is the item's place in `items`.

**History is lines under days.** `DayList` draws `days` you have grouped and
headed (*Today*, *Tuesday 6 October* — where a day begins is the reader's time
zone, so the grouping is yours), each line with its `time`, its `text` (or the
`line` slot) and, quieter, `where`. Give `olderLabel` to offer older lines
(`@older`), and `note` to say how much is shown.

```vue
<DayList :days="days" :label="t('history.title')" :older-label="more ? t('history.older') : undefined"
         :older-busy="reading" :note="t('history.shown', { n })" @older="readOlder()" />
```

**A short value is typed in `TextField`.** One box for `type` `text`, `search`, `date`,
`number` or `email`, drawn in the kit's look: `v-model` holds the text in the box (always a
string — a host that wants a number reads it as one). The box always has a name: give
`label` to draw one above it, or `ariaLabel` when your own markup draws the label, or
point your own `<label for>` at the `id` you pass. `placeholder`, `name`, `autocomplete`,
`inputmode`, `min` and `max` go to the input as they are. `hint` is a quiet line under the
box that the box is described by; `invalid` colours the box and sets `aria-invalid`, and
`error` says why under it, announced — an error implies invalid. `disabled` dims it. The
width is yours: the box fills its container up to 420px, and a `class` you put on the
component lands on the outer element (so `class="max-w-[240px]"` narrows it); any other
attribute, such as a `data-` attribute or a key listener, lands on the input itself. The
package adds no behaviour to a search box — Escape does what the platform does. `size` is
`md`, the box of a form, or `sm`, a compact box for a control inside a list's row or beside a
few words, where a form's box would make the row taller than its text.

```vue
<TextField v-model="typed" type="search" :aria-label="t('people.find')"
           :placeholder="t('people.find')" class="max-w-[240px]" @keydown.enter.prevent="run()" />
<TextField v-model="form.issuer" :label="t('cert.issuer')" :error="issuerRefusal" />
```

**One choice from a list is `SelectField`.** The platform's own `<select>` in the same box,
so the keyboard, the phone's picker and a screen reader behave as they do everywhere.
`options` is `{ value, label, disabled? }[]`, the labels finished; `v-model` holds the chosen
`value`. A `placeholder` adds a first option with an empty value, shown while nothing is
chosen. `label`, `ariaLabel`, `id`, `hint`, `invalid`, `error`, `disabled` and the class and
attribute rules are `TextField`'s. In a row that holds controls, give `ariaLabel` the
row's name too (*Role — Anna*), so each select is told apart from its neighbours, and
`size="sm"` so the row keeps the height of its text.

```vue
<SelectField v-model="roleId" :options="roles.map((r) => ({ value: r.id, label: r.name }))"
             :aria-label="t('members.role') + ' — ' + name" size="sm" class="w-auto" />
```

**An act that adds a file, beside a field or in a row, is `FilePick`.** A button that opens the browser's file chooser and says which files were chosen: `label` is the
button's words, `accept` and `multiple` go to the input, `disabled` dims it. `look` is `link`, quiet text for an act in a row (the default), or
`button`, the small outline button, for an act beside other buttons; `icon` draws a kit icon
before the words. It emits `files`
(never an empty list) and refuses nothing itself — `accept` only filters what the chooser
offers; a host that must hold a rule checks it on what arrives. The input is emptied after every
pick, so the same file can be chosen again. Where the act deserves a zone of its own, that is
`FileDrop`.

```vue
<FilePick :label="t('cert.addFile')" accept=".pdf,image/*" @files="(f) => attach(f[0])" />
<FilePick :label="t('comment.attach')" look="button" icon="doc" multiple @files="(f) => hold(f)" />
```

## Repointing the palette

Each status role is set by a **single** value — the saturated one used for the
dot. Its background, foreground and border are derived from it, with the
foreground darkened until it clears 4.5:1 against the background it will
actually sit on. One value in, a readable set out.

Beside the status roles, two more families derive the same way:

- **The page accent** — one `accent` value in, two out: `--color-accent` for
  graphics and fills, and `--color-accent-deep`, darkened until it reads as
  text against the page background. Use `-deep` for anything textual
  (eyebrows, links); the base is deliberately not text-safe.
- **The focus pair** — `--color-focus` is the ring on light surfaces;
  `--color-console-focus` is derived from it for dark surfaces, lightened
  until it is unmistakable against the console colour (the floor there is far
  above the text ratio, because a technically-passing dark ring still
  disappears in practice). The kit's own dark-surface controls already use it.

Repoint through the builder, so the derived values move with it:

```ts
import { buildTheme, themeCss } from 'uibyte'

const css = themeCss(
  buildTheme({
    surfaces: { paper: '#FFFFFF' },
    status: { ontrack: '#3B5BDB' },
    accent: '#3B5BDB',
    focus: '#3B5BDB',
  }),
)
```

Write that where your build can import it.

**The trap:** overwriting `--color-status-<role>` directly in a stylesheet moves
the dot and leaves everything derived from it as it was. The result stays
readable — those values are still a derived, checked pair — but it no longer
matches the colour it came from.

Supplying an exact pair is supported and taken verbatim:

```ts
buildTheme({ overrides: { late: { background: '#FFF1F0', foreground: '#7A1512' } } })
```

An explicit pair opts out of the derivation, and with it the readability
guarantee. That is your call to make, and the package will not second-guess it.

The reasoning behind the colour maths is in
[color-derivation.md](color-derivation.md).

## What this package guarantees, and what it does not

**Guaranteed:** nothing it derives is unreadable. Every derived foreground
clears 4.5:1 against its own background — checked for the shipped palette, for
deliberately hostile inputs, and across the whole hue circle at a range of
chromas and lightnesses.

**Not guaranteed:** that an explicit pair you supply is readable, or that
overriding a custom property by hand leaves a coherent palette. Both are ways of
telling the package you know better, and it believes you.

## Accessibility, which is not optional here

- **A status is never colour alone.** Every status renders as colour *and* an
  icon *and* a text label. The icon is not a prop, because it is not something a
  caller should be able to switch off.
- **Focus is always visible.** The focus ring has its own token so you can
  repoint it without repointing a status colour that happens to match it today.
- Two status roles share a hue on purpose and are separated by their glyph, so
  removing the icon would genuinely lose information rather than just decoration.
- **A control that announces a keyboard contract honours it.** A tab strip is one
  stop in the page order with the arrow keys moving along it, not one stop per
  choice — four choices meaning four stops is how a keyboard reader ends up
  pressing Tab eleven times to get past a row of chips. The same holds for every
  radio group here: `IconPicker` and `SegmentedChoice`.
- **Nothing pressable sits inside something else pressable.** A list row that is
  a link or a button (`ListTable`) holds no control of its own, and a row that
  holds controls (`ControlList`) is not itself a link or a button — a control
  inside another is two targets under one click and a reader cannot tell which
  one they are on.
