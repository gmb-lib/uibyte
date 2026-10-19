<script setup lang="ts">
// A short name in a pill: a hairline border, 12px text, on the band or the
// surface fill. The content is the default slot, so a host may put a control of
// its own inside — a button that takes the thing away. The kit draws none.
//
// `given` draws the border dashed, for a thing held because of something else,
// and in the muted colour rather than the hairline's: the dash is the only thing
// that tells a sighted reader the difference, so it must clear the 3:1 a control's
// visible state needs (the hairline is about 1.3:1 on the surface fill).
// A dashed line and a tooltip carry nothing to a reader who cannot see them, so
// `note` — the host's own words saying what it is given by — is the pill's
// title and is also placed after the content, visually hidden, for a screen
// reader — after a comma, so the name and the note are not read as one word.
// Pass one with `given`.
withDefaults(
  defineProps<{
    /** The fill: the band (default) or the surface. */
    tone?: 'band' | 'surface'
    /** Draw the border dashed. */
    given?: boolean
    /** What it is given by, already translated. */
    note?: string
  }>(),
  { tone: 'band', given: false },
)

// Written out as full literal strings so a consumer's utility scan sees every
// class this component can render.
const toneClass = { band: 'bg-band', surface: 'bg-surface' } as const
</script>

<template>
  <span
    class="inline-flex items-center gap-1 whitespace-nowrap rounded-pill border px-[9px] py-px text-[12px] text-ink"
    :class="[toneClass[tone], given ? 'border-dashed border-muted' : 'border-line']"
    :title="note || undefined"
  >
    <slot />
    <span v-if="note" class="sr-only">{{ `, ${note}` }}</span>
  </span>
</template>
