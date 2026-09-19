<script setup lang="ts">
import { computed } from 'vue'

import Icon from './Icon.vue'
import type { IconPickerOption } from './types'

/**
 * A grid of glyphs, one of them chosen.
 *
 * It is a set of mutually exclusive choices, so it is built as one: a radio
 * group with a single tab stop, arrow keys moving inside it, Home and End at
 * the ends. Twenty-odd buttons each taking their own tab stop is the usual
 * hand-drawn version, and it makes the keyboard walk the whole grid to reach
 * whatever comes after it.
 *
 * **Which glyphs and what they are called are the host's.** This package does
 * no i18n, and a set of shape names in English is not a set of words to put in
 * front of somebody — so `options` carries finished, already-translated labels,
 * and the host decides which of the package's glyphs its people may choose
 * from. `iconNames` is exported for hosts that want all of them.
 */
const props = defineProps<{
  /** The chosen name, or an empty string for none. */
  modelValue: string
  /** The glyphs offered, in the order they are drawn. */
  options: IconPickerOption[]
  /** Accessible name for the group — what is being chosen. */
  label: string
  /**
   * Offers a "no glyph" choice, drawn first, announced by this text. Omit it
   * and the grid has no way back to nothing.
   */
  clearLabel?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [name: string] }>()

/** The choices as drawn: the way back to nothing first, when it is offered. */
const choices = computed<IconPickerOption[]>(() =>
  props.clearLabel === undefined
    ? props.options
    : [{ name: '', label: props.clearLabel }, ...props.options],
)

/** Where the single tab stop sits: on the chosen glyph, or on the first cell. */
const focusName = computed<string | undefined>(() =>
  choices.value.some((c) => c.name === props.modelValue)
    ? props.modelValue
    : choices.value[0]?.name,
)

function choose(name: string): void {
  if (name === props.modelValue) return
  emit('update:modelValue', name)
}

/** The next index in a direction, wrapping. */
function step(from: number, delta: number): number {
  const n = choices.value.length
  if (n === 0) return -1

  return (from + delta + n) % n
}

function focusAt(index: number, e: KeyboardEvent): void {
  const choice = choices.value[index]
  if (!choice) return
  e.preventDefault()
  choose(choice.name)
  // The chosen cell becomes the tab stop on re-render, so the caret has to move
  // with it — otherwise the reader is announcing a control they have left.
  const cell = (e.currentTarget as HTMLElement)?.parentElement?.children[index]
  if (cell instanceof HTMLElement) cell.focus()
}

function onKeydown(index: number, e: KeyboardEvent): void {
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      focusAt(step(index, 1), e)
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      focusAt(step(index, -1), e)
      break
    case 'Home':
      focusAt(0, e)
      break
    case 'End':
      focusAt(choices.value.length - 1, e)
      break
  }
}
</script>

<template>
  <div class="flex flex-wrap gap-1.5" role="radiogroup" :aria-label="label">
    <button
      v-for="(choice, i) in choices"
      :key="choice.name"
      type="button"
      role="radio"
      :aria-checked="choice.name === modelValue"
      :aria-label="choice.label"
      :title="choice.label"
      :tabindex="choice.name === focusName ? 0 : -1"
      class="inline-flex h-9 w-9 items-center justify-center rounded-btn border focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
      :class="
        choice.name === modelValue
          ? 'border-ink bg-ink text-surface'
          : 'border-line bg-surface text-ink hover:border-ink/40'
      "
      @click="choose(choice.name)"
      @keydown="onKeydown(i, $event)"
    >
      <!-- The way back to nothing is a mark, not a glyph: drawing a glyph for
           "no glyph" would be the one cell that lies about what it does. -->
      <span v-if="choice.name === ''" aria-hidden="true" class="text-[15px] leading-none">&mdash;</span>
      <Icon v-else :name="choice.name" :size="18" />
    </button>
  </div>
</template>
