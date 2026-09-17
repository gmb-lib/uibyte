# Contributing

Thank you for considering a contribution. Bug reports, fixes and improvements are welcome. For
anything that could be exploited, use the private route in [SECURITY.md](SECURITY.md) — never a
public issue.

For anything larger than a small fix, please open an issue first and describe what you want to
change and why. A design system is consumed by several applications at once, so a change that
fights its shape is better redirected before it is written than after.

## Building and testing

The host application owns the toolchain; for working on the package itself you need Node at the
version in [.nvmrc](.nvmrc) and the lockfile's dependencies. The gate a change must pass is the
same one CI runs, and it is one script:

```sh
npm ci
npm run gate      # typecheck && test && build
```

Individually: `npm run typecheck` (`vue-tsc -b`), `npm run test` (`vitest run`), `npm run build`
(`vite build`).

One more thing CI shows on every run, and it is worth looking at:

```sh
npm pack --dry-run
```

That is the file list a consumer actually receives. A stray fixture or a missing entry is visible
there and nowhere else.

## What a change to this package needs

- **`src/hygiene.test.ts` is a guard, not a formality.** It fails the build on internal references
  and on the patterns that have no business in a published package. If it fires, the fix is the
  code, not the test.
- **Nothing caller-supplied is ever rendered as markup.** No path from a prop to `v-html`, to an
  unchecked `href`/`src`, to an inline style or to an event handler. This is the one way a design
  system becomes a cross-site-scripting hole in every application that uses it.
- **Locked and unauthorised states must render as such.** The kit enforces nothing — which is
  exactly why it must not be the reason a person believes an action is theirs to take.
- **A new status or colour goes through the derivation rule, never by hand.** The rule exists so a
  re-skin cannot ship an illegible pill; check the result in both colour modes before you push.
- **No new runtime dependency, no network call, no cookie, no browser storage.** Vue is a peer
  dependency and the host owns the copy.
- **Accessibility is part of the change:** keyboard reachability, focus visibility, an accessible
  name, and contrast that survives both modes.
- A change that consumers must act on belongs in [docs/consuming.md](docs/consuming.md) as well as
  in the code.

## Proposing a change

- Work on a branch and open a pull request against `develop`, the default branch.
- **Sign off every commit.** This project uses the
  [Developer Certificate of Origin](https://developercertificate.org/): by adding a
  `Signed-off-by: Your Name <you@example.org>` line you certify that you wrote the change or
  otherwise have the right to submit it under this project's licence. `git commit -s` adds the line
  for you; the name and address must match the commit author. A pull request whose commits lack it
  fails the DCO check and cannot be merged.
- Keep the change focused: one concern per pull request.
- A change in behaviour comes with a test that fails without it.
- Match the style around you — naming, prop shapes, token use, comment density.
- Pull requests also run a dependency review. A new dependency needs a reason the existing ones
  cannot cover.

## Releases

This package is consumed as a **pinned git tag**, not from a registry, so the tag is the release.
Two things follow: the tag and the `version` in `package.json` must agree — CI fails the release if
they do not, because a mismatch makes every consumer's `npm ls` report the wrong version — and a
breaking change needs to be called out in the pull request, since consumers move by editing a pin.

## Licence

This project is licensed under the MIT License (see [LICENSE](LICENSE)). By submitting a
contribution you agree that it is provided under the same licence.
