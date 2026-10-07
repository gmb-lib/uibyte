<script setup lang="ts">
import { computed, toRaw } from 'vue'
import type { BackLink, LinkComponent } from './types'

// The top of a page: the title once, what area it belongs to, a quiet line about
// it, one way back, and the page's own actions at the top right.
//
// Every page had drawn this by hand, and the hand-drawn ones drifted in the ways
// that cost a reader most: the title said twice (once in the bar, once on the
// page), the way back written as an arrow character inside the words so a reader
// hears "leftwards arrow" before the destination, and actions squeezing the title
// into three lines on a narrow screen.
//
// So the arrow is drawn and hidden from a reader, the destination is a link the
// host supplies (there is no router here), and the actions wrap under the title
// when the row is too narrow for both — the title is never the thing that gives
// way. That wrapping is decided by the header's own row, not by the window: a
// page shown beside a list is narrow on any screen.
const props = withDefaults(
  defineProps<{
    title: string
    /** The area the page belongs to, drawn small above the title. */
    eyebrow?: string
    /** A quiet line under the title. */
    subtitle?: string
    /** The one way back, drawn above everything else. */
    back?: BackLink
    /** The host's link component for the way back. Defaults to a plain anchor. */
    linkComponent?: LinkComponent
    /**
     * The heading level. A page's own title is its first-level heading; a page
     * that sits inside another's frame may need a lower one. The size follows.
     */
    level?: 1 | 2 | 3
  }>(),
  { linkComponent: 'a', level: 1 },
)

const heading = computed(() => `h${props.level}`)
// A component handed in as a prop arrives wrapped for reactivity; drawing it
// needs the component itself.
const link = computed(() => toRaw(props.linkComponent))
</script>

<template>
  <header class="flex flex-wrap items-end gap-x-4 gap-y-3">
    <div class="min-w-0 flex-[1_1_18rem]">
      <component
        :is="link"
        v-if="back"
        v-bind="back.linkProps"
        class="mb-1.5 inline-flex items-center gap-1.5 rounded-chip font-mono text-[11.5px] text-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <span aria-hidden="true">←</span>{{ back.label }}
      </component>
      <p v-if="eyebrow" class="mb-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
        {{ eyebrow }}
      </p>
      <component
        :is="heading"
        class="font-bold text-ink"
        :class="level === 1 ? 'text-[26px] tracking-[-0.015em]' : 'text-[22px] tracking-[-0.01em]'"
      >
        {{ title }}
      </component>
      <p v-if="subtitle" class="mt-0.5 text-[13.5px] text-muted-strong">{{ subtitle }}</p>
    </div>

    <!-- Only when there is something to put in it, so a header without actions
         carries no empty group for a reader to stumble over. -->
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2.5">
      <slot name="actions" />
    </div>
  </header>
</template>
