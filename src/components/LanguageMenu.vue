<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'
import Menu from './Menu.vue'
import type { LanguageOption, MenuItem } from './types'

// The language a page speaks, named in itself, and the way to every other one
// the application carries — each named in itself too, so a person finds their
// own language whatever the page is in now ("Latviešu", never "Latvian").
//
// Each name is marked with its language, so a reader pronounces "Latviešu" as
// Latvian rather than spelling it out in English. The button carries an
// accessible name of its own — "Language", in the page's language — because a
// reader that only hears "English" does not know what pressing it will change.
// A language's `note` — marking the one everyone here has, say — is in the
// page's language, so it is read as the page is, not as the name beside it.
//
// Which languages there are, which one is in use, and where a choice is kept are
// all the host's: before sign-in it may come from the browser and be kept in it,
// after sign-in from the person's settings. This only shows them and says which
// was chosen. Where it sits is the host's too: at the foot of the dark
// application menu it opens upward, is toned for that surface and spans the
// menu's width — the options every menu takes.
const props = defineProps<{
  languages: LanguageOption[]
  /** The code of the language in use. */
  modelValue: string
  /** What the menu changes, in the page's language: "Language". */
  label: string
  /** Which side of the button the list opens on. */
  side?: 'bottom' | 'top'
  /** The surface it sits on: a page's light surface, or the dark application menu. */
  tone?: 'surface' | 'console'
  /** It takes the full width of its container. */
  block?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [code: string] }>()

const current = computed(() => props.languages.find((l) => l.code === props.modelValue))
const items = computed<MenuItem[]>(() =>
  props.languages.map((l) => ({ key: l.code, label: l.name, lang: l.code, note: l.note })),
)
</script>

<template>
  <div role="group" :aria-label="label" :class="block ? 'flex w-full' : 'inline-flex'">
    <Menu
      :label="current?.name ?? label"
      :lang="current?.code"
      :items="items"
      :model-value="modelValue"
      :side="side"
      :tone="tone"
      :block="block"
      @update:model-value="(code: string) => emit('update:modelValue', code)"
    >
      <template #before><Icon name="globe" :size="14" /></template>
    </Menu>
  </div>
</template>
