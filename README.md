# uibyte

The design system behind the go-make-bytes applications, as code. It ships the
role-named design tokens, the application shell and the accessible primitives
that every one of those single-page applications is built from. It is a library
and nothing else: it deploys nowhere, holds no state and calls no API.

## Requirements

uibyte is consumed as source and compiled by the host application, so the host
provides the toolchain:

- **Vue 3** (`^3.5`) — a peer dependency; the host owns the copy.
- **Vite** with `@vitejs/plugin-vue` — the plugin compiles this package's
  components.
- **Tailwind CSS 4** — the classes in this package are resolved by the host's
  Tailwind build, and the design tokens arrive through a `@theme` import.

## Install

```
npm install github:gmb-lib/uibyte#v0.2.0
```

Pin a tag. There is no registry release and no floating version.

Full adoption guide, including the failure modes that are easy to hit and hard
to diagnose: [docs/consuming.md](docs/consuming.md).

## Host configuration

Because the package ships source rather than a prebuilt bundle, two host
settings matter:

1. **Do not pre-bundle it.** Vite's dependency optimizer cannot parse single-file
   components, so exclude the package:

   ```ts
   // vite.config.ts
   export default defineConfig({
     optimizeDeps: { exclude: ['uibyte'] },
   })
   ```

2. **Let Tailwind see it.** The host's Tailwind build must scan this package, or
   the classes it uses are never generated:

   ```css
   /* the host's stylesheet */
   @source "../node_modules/uibyte/src";
   ```

## Usage

```ts
import { cn } from 'uibyte'
```

The package has a single entry point. Everything supported is exported from it;
deep imports into the source tree are not a supported interface and may change
without a major version. The one exception is the stylesheet, which is imported
by path.

## The tokens

Import the stylesheet once, alongside Tailwind:

```css
@import "tailwindcss";
@import "uibyte/theme.css";
```

The typefaces are a **separate, optional import**, so a host already serving
them does not ship a second copy:

```css
@import "uibyte/fonts.css";
```

Both are variable `woff2` files served from the package — nothing loads from a
third-party origin, so a content-security policy needs no font exception. They
are licensed under the SIL Open Font License 1.1, with the licence text beside
each file. A host wanting a different typeface skips this import and repoints
the type roles instead.

That declares four surface roles (`ink`, `paper`, `band`, `console`), five
status roles (`ontrack`, `blocked`, `approaching`, `late`, `idle`) and two type
roles (`sans`, `mono`), so the usual utilities work: `bg-paper`, `text-ink`,
`bg-status-late-bg`, `font-mono`.

Roles are named for what they mean, never for what colour they happen to be.
`status-late` is the role for something past its planned end; the fact that it
is currently red is a value, not a name.

**A status is never colour alone.** Every status is rendered as colour *and* an
icon *and* a text label. That is a requirement, not a style preference.

### Repointing the palette

Each status role is set by a **single** value — the saturated one, used for the
dot. Its background, foreground, border and the solid look's fill are derived
from that value, each moved only as far as legibility demands. One value in, a
legible set out — in every look the pill can render. The page accent and the
focus rings derive the same way (`accent` → `accent-deep` for text; `focus` →
`console-focus` for dark surfaces).

Repoint through the theme builder so the derived values move with it:

```ts
import { buildTheme, themeCss } from 'uibyte'

const css = themeCss(
  buildTheme({
    surfaces: { paper: '#FFFFFF' },
    status: { ontrack: '#3B5BDB' },
  }),
)
```

Write that where your build can import it. Overwriting the custom properties
directly in a stylesheet changes the dots but leaves the values derived from
them as they were, so the two stop matching.

A host that needs one exact pair can supply it, and it is used verbatim:

```ts
buildTheme({ overrides: { late: { background: '#FFF1F0', foreground: '#7A1512' } } })
```

An explicit pair opts out of the derivation, and with it the legibility
guarantee — that is the host's call to make.

The reasoning behind the colour maths is in
[docs/color-derivation.md](docs/color-derivation.md).

## Development

```
npm install
npm run gate      # typecheck + tests + library build
```

The individual steps are `npm run typecheck`, `npm run test` and
`npm run build`. Tests sit beside the source they cover. The library build is a
compile check — the published package is the source.

`npm run theme` regenerates the stylesheet from the token definitions. It is
generated rather than hand-written so the published values cannot disagree with
the rule that produced them; a test fails if the file is out of date.

## Versioning

A tag is a release. A change that a host can feel is a major tag and comes with
a migration note naming what each host has to do.

## Licence

MIT — see [LICENSE](LICENSE).

The two bundled typefaces are not covered by that licence: both are under the
SIL Open Font License 1.1, and each ships with its own licence text in
`src/theme/fonts/`.
