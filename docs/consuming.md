# Consuming uibyte

Everything an application needs to adopt this package, including the mistakes
that are easy to make and hard to diagnose. The README is the short version;
this is the one to read before wiring it into a real build.

## The four wiring steps

Missing any one of them fails quietly rather than loudly, so they are worth
doing together.

**1. Pin a version.** A tag, never a floating branch.

```json
"uibyte": "github:gmb-lib/uibyte#v0.1.0"
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
