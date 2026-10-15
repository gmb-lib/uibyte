<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'
import type { IconName } from './icons'
import { buttonVariants } from './ui/button'

// A quiet button that opens the platform's own file chooser, for an act that sits in
// a row or beside a field ("add an attachment") rather than in a drop zone of its own.
//
// It is a <label> around a visually hidden native file input, as `FileDrop` is, so
// the keyboard reaches the input as the one control it is and the chooser is the
// platform's. The focus ring is drawn on the label, since the input itself is hidden.
// The words are the host's.
//
// Two looks: `link`, quiet text for an act in a row; `button`, the kit's small outline
// button, for an act beside other buttons (a message's Send). An icon, when given, is
// drawn before the words.
//
// It refuses nothing: `accept` goes to the input, which only filters what the chooser
// offers. The input is emptied after every pick, so the same file can be chosen again.
const props = withDefaults(
  defineProps<{
    /** The button's words, e.g. "Add an attachment". */
    label: string
    /** Which files the chooser offers, in the input's own syntax (`.pdf`, `image/*`). */
    accept?: string
    /** Whether several files may be chosen at once. */
    multiple?: boolean
    disabled?: boolean
    /** `link` (quiet text, the default) or `button` (the small outline button). */
    look?: 'link' | 'button'
    /** An icon drawn before the words. */
    icon?: IconName
  }>(),
  { accept: undefined, multiple: false, disabled: false, look: 'link', icon: undefined },
)

const emit = defineEmits<{
  /** The files chosen — never an empty list. */
  files: [files: File[]]
}>()

function onChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (props.disabled || files.length === 0) return
  emit('files', files)
}
const looks = {
  link: 'inline-flex items-center text-[13px] font-semibold text-ink underline decoration-1 underline-offset-2',
  button: buttonVariants({ size: 'sm', variant: 'outline' }),
}
const focusRing =
  'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus'
const rootClass = computed(() => [
  looks[props.look],
  focusRing,
  props.disabled ? 'cursor-not-allowed opacity-50' : props.look === 'link' ? 'cursor-pointer hover:text-muted-strong' : 'cursor-pointer',
])
</script>

<template>
  <label :class="rootClass">
    <input type="file" class="sr-only" :accept="accept" :multiple="multiple" :disabled="disabled" @change="onChange" />
    <Icon v-if="icon" :name="icon" :size="14" class="mr-1" />{{ label }}
  </label>
</template>
