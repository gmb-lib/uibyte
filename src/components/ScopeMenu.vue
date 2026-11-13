<script setup lang="ts">
import { computed } from 'vue'
import Menu from './Menu.vue'
import type { MenuItem, ScopeOption } from './types'

// The line that names where a person is, and the way to another place.
//
// A thin wrapper over `Menu`, as `LanguageMenu` is: with two or more places it
// is a menu as a choice — its button wears the words of the place the person is
// in, and the opened list is headed by `label` (what the line names, in the
// host's word) above every place, the current one marked. Choosing another
// place tells the host its key; choosing the current one tells it nothing.
//
// With exactly one place, and it the current one, there is nothing to change to,
// so nothing is drawn that says otherwise: the place's words as plain text, where
// the button's words would be and in the same type, with no button, nothing to
// focus, no arrow. A reader hears the words under the name `label`.
//
// With no place, or a current one that is not among them, it draws nothing: a
// line naming a place that is not on offer would only mislead.
//
// Which places there are, which one is current and what moving to another does
// are the host's, and every word arrives already translated.
const props = defineProps<{
  /** What the line names, in the host's word: the line's accessible name and the list's heading. */
  label: string
  /** The key of the place the person is in. */
  current: string
  options: ScopeOption[]
  /** Which side of the button the list opens on. */
  side?: 'bottom' | 'top'
  /** Which edge of the button the list lines up with. */
  align?: 'start' | 'end'
  /** The surface it sits on: a page's light surface, or the dark application menu. */
  tone?: 'surface' | 'console'
  /** It takes the full width of its container. */
  block?: boolean
}>()

const emit = defineEmits<{ select: [key: string] }>()

const place = computed(() => props.options.find((o) => o.key === props.current))
const items = computed<MenuItem[]>(() => props.options.map((o) => ({ key: o.key, label: o.label })))
const alone = computed(() => props.options.length === 1)

function choose(key: string): void {
  if (key !== props.current) emit('select', key)
}

// The place's words stand where the button's would: the same inset (the button's
// border is there, drawn clear), the same size.
const plain = computed(
  () =>
    `min-w-0 break-words border border-transparent px-3 py-[5px] text-[12.5px] ${props.tone === 'console' ? 'text-console-text' : 'text-ink'}`,
)
</script>

<template>
  <div
    v-if="place"
    role="group"
    :aria-label="label"
    :data-scope="current"
    :class="block ? 'flex w-full' : 'inline-flex'"
  >
    <span v-if="alone" :class="plain">{{ place.label }}</span>
    <Menu
      v-else
      :label="place.label"
      :heading="label"
      :items="items"
      :model-value="current"
      :align="align"
      :side="side"
      :tone="tone"
      :block="block"
      @update:model-value="choose"
    />
  </div>
</template>
