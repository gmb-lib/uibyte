<script setup lang="ts">
import { computed, toRaw, useId } from 'vue'
import type { LinkComponent, StepItem } from './types'

// A card of first steps, in the order they are meant to be done: how many are
// finished, which one is next, and the way to it.
//
// The step to do now is the first whose `done` is false; the component works it
// out, so a host cannot mark two. Only that step draws its action, and a step
// with no action draws nothing that looks like one. Once every step is done no
// step is "now" and no action is drawn; whether the card is still worth showing
// is the host's call, as is every count and every word.
//
// State is never colour or the outline alone. The tick is decoration and is
// hidden from a screen reader; a finished step and the step to do now each say
// their word in text a reader hears, after the title and apart from it (after a
// comma, as `Chip` does with its note), and the step to do now is also the
// current step of the list.
//
// The card is a region named by its heading. The heading's level is a prop, as
// on `PageHeader`, so a host can fit it under whatever heading its page has.
const props = withDefaults(
  defineProps<{
    /** The card's heading, with whatever count the host wants in it. Already translated. */
    heading: string
    /** The heading's level, to fit the page's outline. */
    level?: 2 | 3 | 4
    /** A quiet line beside the heading. Nothing is drawn without it. */
    note?: string
    /** The steps, in their order. */
    steps: StepItem[]
    /** Draws an action that has `linkProps`: a router link, or `'a'`. */
    linkComponent?: LinkComponent
    /** The columns at full width. Five fold to three, and both to one, as the card narrows. */
    columns?: 3 | 5
    /** The two words a screen reader hears for a step's state. Already translated. */
    labels: { done: string; now: string }
  }>(),
  { level: 3, columns: 3, linkComponent: 'a' },
)

// Unwrapped before it is rendered: a component reaching `<component :is>` as a
// reactive proxy makes Vue warn.
const link = computed(() => toRaw(props.linkComponent))

const headingTag = computed(() => `h${props.level}`)
const headingId = useId()

const nowIndex = computed(() => props.steps.findIndex((step) => !step.done))

type State = 'done' | 'now' | 'open'
const stateOf = (index: number): State =>
  props.steps[index]?.done ? 'done' : index === nowIndex.value ? 'now' : 'open'

// Written out as full literal strings so a consumer's utility scan sees every
// class this component can render. Each fold is measured on the card's own width.
const columnClass = {
  3: 'grid-cols-3 @max-[640px]:grid-cols-1',
  5: 'grid-cols-5 @max-[980px]:grid-cols-3 @max-[640px]:grid-cols-1',
} as const
const stepClass = {
  done: 'border-line bg-surface',
  now: 'border-ink bg-surface',
  open: 'border-line bg-band',
} as const
const actionClass =
  'mt-2 inline-block rounded-chip text-[12.5px] font-semibold text-status-ontrack-fg hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus'
</script>

<template>
  <section class="@container rounded-card border border-line bg-surface px-5 py-4" :aria-labelledby="headingId">
    <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <component :is="headingTag" :id="headingId" class="text-[15px] font-semibold">{{ heading }}</component>
      <span v-if="note" class="font-mono text-[11.5px] text-faint">{{ note }}</span>
    </div>
    <ol class="mt-3 grid gap-3" :class="columnClass[columns]">
      <li
        v-for="(step, i) in steps"
        :key="step.key"
        :data-step="step.key"
        :data-step-state="stateOf(i)"
        :aria-current="stateOf(i) === 'now' ? 'step' : undefined"
        class="min-w-0 rounded-[12px] border px-3.5 py-3 text-[13.5px]"
        :class="stepClass[stateOf(i)]"
      >
        <span class="font-mono text-[11px] text-muted" aria-hidden="true">{{ i + 1 }}</span>
        <b
          class="mb-[3px] mt-0.5 block break-words font-semibold"
          :class="stateOf(i) === 'done' ? 'text-status-ontrack-fg' : ''"
        >
          <span v-if="stateOf(i) === 'done'" aria-hidden="true">✓ </span>{{ step.title }}
          <span v-if="stateOf(i) !== 'open'" class="sr-only">{{ `, ${stateOf(i) === 'done' ? labels.done : labels.now}` }}</span>
        </b>
        <small class="block break-words text-[12.5px] text-muted-strong">{{ step.text }}</small>
        <template v-if="stateOf(i) === 'now' && step.action">
          <a v-if="step.action.href !== undefined" :href="step.action.href" :class="actionClass">{{ step.action.label }}</a>
          <component :is="link" v-else v-bind="step.action.linkProps" :class="actionClass">{{ step.action.label }}</component>
        </template>
      </li>
    </ol>
  </section>
</template>
