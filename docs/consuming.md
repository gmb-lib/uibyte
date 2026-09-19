# Consuming uibyte

Everything an application needs to adopt this package, including the mistakes
that are easy to make and hard to diagnose. The README is the short version;
this is the one to read before wiring it into a real build.

## The four wiring steps

Missing any one of them fails quietly rather than loudly, so they are worth
doing together.

**1. Pin a version.** A tag, never a floating branch.

```json
"uibyte": "github:gmb-lib/uibyte#v0.6.0"
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
package's fixed set of 26, at the family's stroke weight and in the colour of
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
keys moving inside it and wrapping, Home and End at the ends. Twenty-six buttons
each taking their own tab stop is what a hand-drawn grid reliably produces, and
it makes the keyboard walk the whole set to reach whatever follows it.

**Which glyphs and what they are called are yours.** This package does no i18n
and its own names are English shape words — identifiers, not words to put in
front of somebody — so `options` carries finished, already-translated labels and
you decide which of the 26 your people may choose from. `clearLabel` offers the
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

`NavIcon` is unchanged and draws from the same geometry — nine of the names, for
sidebars and drawers, and it always draws something rather than leaving a hole
in a row of marks.

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
  pressing Tab eleven times to get past a row of chips.
