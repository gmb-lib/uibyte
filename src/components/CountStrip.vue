<script setup lang="ts">
import type { StatusRole } from '../theme/tokens'
import type { CountItem } from './types'

// Counts that are also the filters: "All 18 · Manager 2 · Worker 16", each a
// button that shows only what it counts.
//
// One is chosen at a time, and each says whether it is the chosen one. The
// counts are the host's, already formatted — and that is the point, not a
// limitation: the strip cannot invent a number, so it can only show counts the
// screen's own read already has, never one that needs another query.
//
// It wraps onto a second line when the row is too narrow; it never scrolls
// sideways, where a filter would be out of sight. What else narrows the list —
// "More filters" — goes in the `more` slot after the counts.
defineProps<{
  items: CountItem[]
  /** The chosen key. */
  modelValue: string
  /** Accessible name of the strip — what is being filtered. */
  label: string
}>()

const emit = defineEmits<{ 'update:modelValue': [key: string] }>()

// Written out as full literal strings so a consumer's utility scan sees every
// class this component can render.
const dotByRole: Record<StatusRole, string> = {
  ontrack: 'bg-status-ontrack',
  blocked: 'bg-status-blocked',
  approaching: 'bg-status-approaching',
  late: 'bg-status-late',
  idle: 'bg-status-idle',
}
</script>

<template>
  <div role="group" :aria-label="label" class="flex flex-wrap items-center gap-2">
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      :aria-pressed="item.key === modelValue"
      class="inline-flex items-center gap-2 rounded-pill border px-[13px] py-1.5 text-[13px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      :class="item.key === modelValue ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink hover:border-ink/40'"
      @click="item.key !== modelValue && emit('update:modelValue', item.key)"
    >
      <i v-if="item.status" aria-hidden="true" class="h-2 w-2 shrink-0 rounded-pill" :class="dotByRole[item.status]" />
      {{ item.label }}
      <b
        v-if="item.count"
        class="font-mono font-medium"
        :class="item.key === modelValue ? 'text-white/80' : 'text-muted-strong'"
      >{{ item.count }}</b>
    </button>
    <slot name="more" />
  </div>
</template>
