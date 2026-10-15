<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue'
import { cn } from '../lib/cn'
import { fieldBorder, fieldBoxClass } from './fieldBox'

// One box for typing a short value: text, a search, a date, a number or an address.
//
// It is the platform's own input, drawn in the kit's look, so the keyboard, the
// date picker and the on-screen keyboards behave as the platform does. What is typed
// is handed back as the text in the box, whatever the type; a host that wants a
// number reads it as one.
//
// The box always has a name. A host that draws its own label gives `ariaLabel`
// (or points its own <label for> at `id`); otherwise `label` is drawn above the box.
// Words, here, are all the host's, finished and translated.
//
// Class and style land on the outer element, so a host sets the width there; every
// other attribute (a data attribute, an event listener) lands on the input itself.
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** The text in the box (`v-model`). */
    modelValue: string
    type?: 'text' | 'search' | 'date' | 'number' | 'email'
    /** A visible label drawn above the box. */
    label?: string
    /** The box's accessible name, when the host draws its own label. */
    ariaLabel?: string
    placeholder?: string
    /** A quiet line under the box that the box is described by. */
    hint?: string
    /** Marks the box invalid (colour and `aria-invalid`). */
    invalid?: boolean
    /** Why it is invalid, said under the box and announced. Implies `invalid`. */
    error?: string
    disabled?: boolean
    /** The id of the input, so a host's own `<label for>` reaches it. */
    id?: string
    name?: string
    autocomplete?: string
    inputmode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
    min?: string | number
    max?: string | number
  }>(),
  { type: 'text' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const attrs = useAttrs()
const uid = useId()
const inputId = computed(() => props.id ?? `${uid}-input`)
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

function onInput(e: Event): void {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <div :class="rootClass" :style="attrs.style as string | undefined">
    <label v-if="label" :for="inputId" class="mb-1 block text-[13px] text-muted-strong">{{ label }}</label>
    <input
      v-bind="rest"
      :id="inputId"
      :type="type"
      :value="modelValue"
      :name="name"
      :placeholder="placeholder"
      :disabled="disabled"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :min="min"
      :max="max"
      :aria-label="label ? undefined : ariaLabel"
      :aria-invalid="isInvalid ? true : undefined"
      :aria-describedby="describedBy"
      :class="[fieldBoxClass, fieldBorder(isInvalid)]"
      @input="onInput"
    />
    <p v-if="error" :id="errorId" role="alert" class="mt-1.5 text-[12.5px] text-status-late-fg">{{ error }}</p>
    <p v-if="hint" :id="hintId" class="mt-1.5 text-[12.5px] text-muted-strong">{{ hint }}</p>
  </div>
</template>
