<script setup lang="ts">
// A quiet button that opens the platform's own file chooser, for an act that sits in
// a row or beside a field ("add an attachment") rather than in a drop zone of its own.
//
// It is a <label> around a visually hidden native file input, as `FileDrop` is, so
// the keyboard reaches the input as the one control it is and the chooser is the
// platform's. The focus ring is drawn on the label, since the input itself is hidden.
// The words are the host's.
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
  }>(),
  { accept: undefined, multiple: false, disabled: false },
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
</script>

<template>
  <label
    class="inline-flex items-center text-[13px] font-semibold text-ink underline decoration-1 underline-offset-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
    :class="disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:text-muted-strong'"
  >
    <input type="file" class="sr-only" :accept="accept" :multiple="multiple" :disabled="disabled" @change="onChange" />
    {{ label }}
  </label>
</template>
