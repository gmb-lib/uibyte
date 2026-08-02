import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { themeCss } from '../src/theme/tokens'

// Writes the stylesheet a host imports. The values in it are produced by the
// derivation rather than typed by hand, so what ships can never disagree with
// the rule that is supposed to have produced it. A test fails if this file is
// out of date, which is the reminder to re-run this.

const banner = `/* Generated — run \`npm run theme\` after changing a token or the derivation.
   Every status role's background, foreground and border is derived from its
   single role colour; the foreground is darkened until it clears 4.5:1 against
   the background it will actually sit on. */\n\n`

const target = fileURLToPath(new URL('../src/theme/theme.css', import.meta.url))
writeFileSync(target, banner + themeCss() + '\n', 'utf8')

console.log(`wrote ${target}`)
