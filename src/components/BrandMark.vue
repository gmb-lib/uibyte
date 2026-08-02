<script setup lang="ts">
// The brand lockup: a square mark followed by a wordmark, sized and spaced
// consistently wherever it appears.
//
// The mark itself is the product's, not the kit's — it arrives through the
// default slot, and the wordmark text through a prop. What is shared is the
// geometry: the square, its corner, its two tones (one that reads on a light
// surface, one on a console surface), and how the wordmark sits beside it. That
// is the part every application draws the same way and gets subtly wrong when
// each draws it alone.
withDefaults(
  defineProps<{
    /** The wordmark text. Omit to render the mark on its own. */
    name?: string
    /** Which surface the lockup is sitting on. */
    tone?: 'console' | 'ink'
    /** Edge length of the square mark, in pixels. */
    size?: number
  }>(),
  { tone: 'console', size: 26 },
)
</script>

<template>
  <span class="flex items-center gap-2">
    <span
      class="grid place-items-center rounded-chip text-console-accent"
      :class="tone === 'ink' ? 'bg-ink' : 'bg-console-line'"
      :style="{ width: `${size}px`, height: `${size}px` }"
    >
      <slot :size="Math.round(size * 0.58)" />
    </span>
    <span v-if="name" class="text-[17px] font-bold tracking-tight">{{ name }}</span>
  </span>
</template>
