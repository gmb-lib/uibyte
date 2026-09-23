<script setup lang="ts">
import { ref } from 'vue'

// A place to hand over files: dropped onto it, or chosen through the
// platform's own file chooser.
//
// The whole zone is a <label> around a visually hidden native file input, so
// clicking anywhere opens the chooser, the keyboard reaches it as the one
// control it is, and a reader hears it announced by the zone's own words —
// none of that is imitated in script. The words are the host's, finished and
// translated; this package owns no string.
//
// `accept` holds for a drop as well as for the chooser. The platform only
// filters what the chooser offers, so a drop is checked here against the same
// rule, and what it refuses is handed back rather than silently lost.
const props = withDefaults(
  defineProps<{
    /** The zone's main line, e.g. "Drop a file here, or click to choose one". */
    label: string
    /** A quieter second line, e.g. what kind of file is expected. Optional. */
    hint?: string
    /**
     * Which files are taken, in the input's own syntax: a comma-separated list
     * of extensions (`.json`), media types (`application/json`) and wildcards
     * (`image/*`). Omitted, every file is taken.
     */
    accept?: string
    /** Whether more than one file may be handed over at once. */
    multiple?: boolean
    /** Drawn dimmed; neither a drop nor a click does anything. */
    disabled?: boolean
  }>(),
  { hint: undefined, accept: undefined, multiple: false, disabled: false },
)

const emit = defineEmits<{
  /** The files handed over — never an empty list. */
  files: [files: File[]]
  /**
   * Files a drop brought that this zone does not take: `type` when `accept`
   * refuses them, `count` when several arrive where one is taken.
   */
  rejected: [files: File[], reason: 'type' | 'count']
}>()

const dragging = ref(false)
// Entering a child element fires `dragleave` on the parent first, so a plain
// flag flickers off while a file is still over the zone. Counting the enters
// and leaves keeps the highlight until the pointer has left the zone itself.
let depth = 0

function takes(file: File): boolean {
  const rules = (props.accept ?? '')
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean)
  if (rules.length === 0) return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return rules.some((rule) => {
    if (rule.startsWith('.')) return name.endsWith(rule)
    if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1))
    return type === rule
  })
}

function hand(files: File[]) {
  if (files.length === 0) return
  const taken = files.filter(takes)
  const refused = files.filter((file) => !takes(file))
  if (refused.length > 0) emit('rejected', refused, 'type')
  if (taken.length === 0) return
  if (!props.multiple && taken.length > 1) {
    emit('rejected', taken, 'count')
    return
  }
  emit('files', taken)
}

function onChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  // Cleared at once, so choosing the very same file again — after correcting
  // it, say — is still a choice the zone hears.
  input.value = ''
  if (props.disabled) return
  hand(files)
}

function onEnter() {
  if (props.disabled) return
  depth += 1
  dragging.value = true
}

function onLeave() {
  if (props.disabled) return
  depth = Math.max(0, depth - 1)
  if (depth === 0) dragging.value = false
}

function onDrop(event: DragEvent) {
  depth = 0
  dragging.value = false
  if (props.disabled) return
  hand(Array.from(event.dataTransfer?.files ?? []))
}
</script>

<template>
  <label
    class="block rounded-card border-[1.5px] border-dashed px-[18px] py-[22px] text-center text-[13.5px] text-muted-strong transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
    :class="[
      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      dragging ? 'border-ink bg-surface' : 'border-line bg-band',
      !disabled && !dragging ? 'hover:border-ink' : '',
    ]"
    :data-dragging="dragging || undefined"
    @dragenter.prevent="onEnter"
    @dragover.prevent
    @dragleave.prevent="onLeave"
    @drop.prevent="onDrop"
  >
    <input
      type="file"
      class="sr-only"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      @change="onChange"
    />
    <span class="block font-semibold text-ink">{{ label }}</span>
    <span v-if="hint" class="mt-1 block text-[12px]">{{ hint }}</span>
  </label>
</template>
