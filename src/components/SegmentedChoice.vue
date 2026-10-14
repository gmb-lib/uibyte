<script setup lang="ts">
import { computed } from 'vue'
import type { SegmentedOption } from './types'

// One choice of a few, every one of them in view: two or three ways of doing one thing,
// side by side in one frame, the chosen one filled.
//
// It is a set of mutually exclusive choices, so it is built as one — a radio group that is
// a single stop in the page order. The stop sits on the chosen option, or on the first that
// can be chosen while none is. The arrow keys move along the group and choose as they go,
// wrapping at the ends; Home and End go to the first and the last; Space and Enter choose
// the option the caret is on. An option that cannot be chosen is drawn and announced, and
// stepped over. A key held with Alt, Control or Meta is the browser's — Alt and an arrow
// is the way back a page — so it is left alone.
//
// The chosen option is filled in ink, its words drawn heavier, and it is announced as
// checked: the fill is never the only sign of which one it is. Every option keeps the room
// its words take at the heavier weight, so choosing one never shifts its neighbours.
//
// The frame wraps onto another line when it is too narrow for its options; it never
// scrolls sideways, where a choice would be out of sight.
//
// The host owns the choice and every word. This only ever says which one was asked for,
// and what each choice shows is the host's to draw.
const props = defineProps<{
  /** The choices, in the order they are drawn. */
  options: SegmentedOption[]
  /** The chosen key (`v-model`). */
  modelValue: string
  /** Accessible name of the group — what is being chosen. */
  label: string
}>()

const emit = defineEmits<{ 'update:modelValue': [key: string] }>()

/** Where the single stop sits: on the chosen option, or on the first that can be chosen. */
const stopKey = computed<string | undefined>(
  () =>
    props.options.find((o) => o.key === props.modelValue && !o.disabled)?.key ??
    props.options.find((o) => !o.disabled)?.key,
)

function choose(option: SegmentedOption): void {
  // An option that cannot be chosen is there so a person can see the way exists; asking
  // for it does nothing. Asking for the chosen one again says nothing either.
  if (option.disabled || option.key === props.modelValue) return
  emit('update:modelValue', option.key)
}

/** The next option that can be chosen in a direction, wrapping, or -1 when none can. */
function step(from: number, delta: number): number {
  const n = props.options.length
  for (let i = 1; i <= n; i++) {
    const at = (((from + delta * i) % n) + n) % n
    if (!props.options[at]?.disabled) return at
  }

  return -1
}

function moveTo(index: number, e: KeyboardEvent): void {
  const option = props.options[index]
  if (!option) return
  e.preventDefault()
  choose(option)
  // The chosen option becomes the stop once it is drawn again; the caret moves there now,
  // or a reader is left announcing an option they are no longer on.
  const el = (e.currentTarget as HTMLElement | null)?.parentElement?.children[index]
  if (el instanceof HTMLElement) el.focus()
}

function onKeydown(index: number, e: KeyboardEvent): void {
  if (e.altKey || e.ctrlKey || e.metaKey) return
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      moveTo(step(index, 1), e)
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      moveTo(step(index, -1), e)
      break
    case 'Home':
      moveTo(step(-1, 1), e)
      break
    case 'End':
      moveTo(step(props.options.length, -1), e)
      break
    case ' ':
    case 'Enter': {
      // Taken here, with the button's own click on the key prevented, so the key chooses
      // once — and the option the caret is on is chosen even while none was.
      e.preventDefault()
      const option = props.options[index]
      if (option) choose(option)
      break
    }
  }
}

// Written out as full literal strings so a consumer's utility scan sees every class this
// component can render.
function look(option: SegmentedOption): string {
  if (option.key === props.modelValue) return 'bg-ink font-semibold text-white'
  return option.disabled ? 'text-muted-strong' : 'text-muted-strong hover:text-ink'
}
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="label"
    class="inline-flex max-w-full flex-wrap rounded-[9px] border border-line bg-surface p-0.5"
  >
    <button
      v-for="(option, i) in options"
      :key="option.key"
      type="button"
      role="radio"
      :aria-checked="option.key === modelValue"
      :aria-disabled="option.disabled || undefined"
      :tabindex="option.key === stopKey ? 0 : -1"
      class="grid rounded-chip px-3 py-1.5 text-center text-[13px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
      :class="[look(option), option.disabled ? 'cursor-not-allowed opacity-50' : '']"
      @click="choose(option)"
      @keydown="onKeydown(i, $event)"
    >
      <span class="col-start-1 row-start-1">{{ option.label }}</span>
      <!-- The same words at the chosen weight, neither seen nor heard: the option keeps the
           room they take, so choosing it does not push its neighbours along. -->
      <span aria-hidden="true" class="invisible col-start-1 row-start-1 font-semibold">{{ option.label }}</span>
    </button>
  </div>
</template>
