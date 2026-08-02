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
npm install github:gmb-lib/uibyte#v0.1.0
```

Pin a tag. There is no registry release and no floating version.

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
without a major version.

## Development

```
npm install
npm run gate      # typecheck + tests + library build
```

The individual steps are `npm run typecheck`, `npm run test` and
`npm run build`. Tests sit beside the source they cover. The library build is a
compile check — the published package is the source.

## Versioning

A tag is a release. A change that a host can feel is a major tag and comes with
a migration note naming what each host has to do.

## Licence

MIT — see [LICENSE](LICENSE).
