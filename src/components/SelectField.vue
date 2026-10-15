<script setup lang="ts">
import { computed, nextTick, useAttrs, useId } from 'vue'
import { cn } from '../lib/cn'
import { fieldBorder, fieldBoxClass, type FieldSize } from './fieldBox'
import type { SelectOption } from './types'

// One choice from a list, as the platform's own <select> drawn in the same box as
// `TextField`. It is native on purpose: the keyboard, the picker on a phone and the
// screen reader behave as the platform does.
//
// The box always has a name: `label` is drawn above it, or the host gives `ariaLabel`
// (or points its own <label for> at `id`). A `placeholder` is a first option with an
// empty value, shown while nothing is chosen. Words are the host's, finished.
//
// Class and style land on the outer element, so a host sets the width there; every
// other attribute lands on the select itself.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  /** The chosen option's value (`v-model`); empty when nothing is chosen. */
  modelValue: string
  options: SelectOption[]
  label?: string
  ariaLabel?: string
  /** A first, empty option drawn while nothing is chosen. */
  placeholder?: string
  hint?: string
  invalid?: boolean
  error?: string
  disabled?: boolean
  id?: string
  name?: string
  /** `sm` for a compact box inside a list's row; a form's box otherwise. */
  size?: FieldSize
}>(), { size: 'md' })

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const attrs = useAttrs()
const uid = useId()
const selectId = computed(() => props.id ?? `${uid}-select`)
const hintId = `${uid}-hint`
const errorId = `${uid}-error`

const isInvalid = computed(() => props.invalid === true || !!props.error)
const describedBy = computed(() => {
  const ids = [props.error ? errorId : '', props.hint ? hintId : ''].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
})
const rest = computed(() => {
  const { class: _c, style: _s, ...others } = attrs
  return others
})
const rootClass = computed(() => cn('w-full max-w-[420px]', attrs.class as string | undefined))

// The select shows its model, always. A host that does not take a choice (a change refused, say)
// leaves the model as it was, and nothing would redraw this select — so after the host has had its
// turn, the select is put back to the value it holds rather than the one picked. A host that takes
// the choice later redraws it when the model changes.
async function onChange(e: Event): Promise<void> {
  const select = e.target as HTMLSelectElement
  emit('update:modelValue', select.value)
  await nextTick()
  if (select.value !== props.modelValue) select.value = props.modelValue
}
</script>

<template>
  <div :class="rootClass" :style="attrs.style as string | undefined">
    <label v-if="label" :for="selectId" class="mb-1 block text-[13px] text-muted-strong">{{ label }}</label>
    <span class="relative block">
      <select
        v-bind="rest"
        :id="selectId"
        :value="modelValue"
        :name="name"
        :disabled="disabled"
        :aria-label="label ? undefined : ariaLabel"
        :aria-invalid="isInvalid ? true : undefined"
        :aria-describedby="describedBy"
        :class="[fieldBoxClass(size), fieldBorder(isInvalid), 'cursor-pointer appearance-none truncate pr-8']"
        @change="onChange"
      >
        <option v-if="placeholder !== undefined" value="">{{ placeholder }}</option>
        <option v-for="o in options" :key="o.value" :value="o.value" :disabled="o.disabled">{{ o.label }}</option>
      </select>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.4"
        aria-hidden="true"
        class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
      >
        <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
    <p v-if="error" :id="errorId" role="alert" class="mt-1.5 text-[12.5px] text-status-late-fg">{{ error }}</p>
    <p v-if="hint" :id="hintId" class="mt-1.5 text-[12.5px] text-muted-strong">{{ hint }}</p>
  </div>
</template>
