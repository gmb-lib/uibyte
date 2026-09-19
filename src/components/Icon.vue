<script setup lang="ts">
import { computed } from 'vue'

import { iconGlyphs, isIconName } from './icons'

/**
 * One glyph from the package's fixed set, drawn at the family's stroke weight
 * and in the colour of the text around it.
 *
 * `name` is typed as a plain string on purpose. The names an application shows
 * are usually DATA — chosen by somebody, stored, exported, read back somewhere
 * else — so a name this version does not know is a normal thing to be handed,
 * not a programming error. When that happens **nothing is drawn**: no element,
 * no reserved space, no broken-image mark. A column of empty wells says a
 * setting was missed; a column with nothing in it says nothing is wrong. Ask
 * `isIconName` first if you need to react to it.
 *
 * A glyph is decoration unless you say otherwise. Give `label` only when the
 * mark carries meaning no neighbouring text already carries — a lone icon
 * control — and it is announced as an image by that name.
 */
const props = defineProps<{
  /** A name from the set. One the package does not know draws nothing. */
  name: string
  /** Drawn square, in pixels. Defaults to the family's inline size. */
  size?: number
  /** Accessible name. Already translated — this package does no i18n. */
  label?: string
}>()

const parts = computed(() => (isIconName(props.name) ? iconGlyphs[props.name] : null))
</script>

<template>
  <svg
    v-if="parts"
    :width="size ?? 17"
    :height="size ?? 17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : true"
  >
    <template v-for="(part, i) in parts" :key="i">
      <path
        v-if="part.shape === 'path'"
        :d="part.d"
        :stroke-linecap="part.cap ? 'round' : undefined"
        :stroke-linejoin="part.join ? 'round' : undefined"
      />
      <circle v-else-if="part.shape === 'circle'" :cx="part.cx" :cy="part.cy" :r="part.r" />
      <rect
        v-else
        :x="part.x"
        :y="part.y"
        :width="part.width"
        :height="part.height"
        :rx="part.rx"
      />
    </template>
  </svg>
</template>
