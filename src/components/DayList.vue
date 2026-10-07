<script setup lang="ts">
import { useId } from 'vue'
import type { DayGroup, DayLine } from './types'

// What happened, newest first, under the day it happened on.
//
// The days arrive grouped and headed. Where a day begins depends on the time
// zone of the person reading, and "Today" or "Tuesday 6 October" is their
// language, so both are the host's; the list draws what it is given in the
// order given. Each line has a time, what happened, and — quieter — where, or
// who.
//
// At the end, when the host has more to read, a way to show older lines, and a
// sentence saying how much is shown. Reading them is the host's.
withDefaults(
  defineProps<{
    days: DayGroup[]
    /** Accessible name of the whole list. */
    label: string
    /** The heading level of a day, in the page's outline. */
    level?: 2 | 3 | 4
    /** The words for showing older lines; without them, nothing is offered. */
    olderLabel?: string
    /** While older lines are being read. */
    olderBusy?: boolean
    /** A sentence at the end — e.g. how many are shown. */
    note?: string
  }>(),
  { level: 3, olderLabel: undefined, olderBusy: false, note: undefined },
)

const emit = defineEmits<{ older: [] }>()

// Stable per instance, so two lists on one page never share a heading's id.
const uid = useId()

defineSlots<{ line?: (scope: { line: DayLine; day: DayGroup }) => unknown }>()
</script>

<template>
  <div :aria-label="label" role="region" class="@container overflow-hidden rounded-card border border-line bg-surface">
    <section v-for="(day, d) in days" :key="day.key" :aria-labelledby="`${uid}-day-${day.key}`">
      <div
        :id="`${uid}-day-${day.key}`"
        role="heading"
        :aria-level="level"
        class="px-[18px] pb-1.5 pt-3.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted"
        :class="d > 0 ? 'border-t border-line' : ''"
      >
        {{ day.heading }}
      </div>
      <ul role="list">
        <li
          v-for="line in day.lines"
          :key="line.key"
          class="grid grid-cols-[64px_minmax(0,1fr)_minmax(160px,300px)] items-baseline gap-x-4 gap-y-1 border-t border-line px-[18px] py-[9px] text-[13.5px] first:border-t-0 @max-[700px]:grid-cols-[56px_minmax(0,1fr)]"
          :class="line.marked ? 'bg-band' : ''"
        >
          <span class="font-mono text-[12px] text-faint">{{ line.time }}</span>
          <span class="min-w-0"><slot name="line" :line="line" :day="day">{{ line.text }}</slot></span>
          <span v-if="line.where" class="min-w-0 text-[12.5px] text-muted @max-[700px]:col-start-2">{{ line.where }}</span>
        </li>
      </ul>
    </section>

    <div v-if="note || olderLabel" class="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-band px-[18px] py-3 text-[13px] text-muted-strong">
      <span>{{ note }}</span>
      <button
        v-if="olderLabel"
        type="button"
        :disabled="olderBusy"
        class="rounded-btn border border-line bg-surface px-3 py-1 text-[12.5px] font-semibold text-ink hover:bg-band focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus disabled:opacity-50"
        @click="emit('older')"
      >
        {{ olderLabel }}
      </button>
    </div>
  </div>
</template>
