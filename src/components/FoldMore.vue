<script setup lang="ts" generic="T">
import { computed, nextTick, ref } from 'vue'

// The first few of a list, and the words for the rest: "Anna · Jānis · Ilze ·
// Marta · Pēteris  + 12 more".
//
// The words for the rest are the host's, already counted and worded, because a
// count needs its plural and the kit has neither. Choosing them unfolds the
// list where it stands.
//
// A fold must never hide what a person is looking for: when the host is
// searching, it holds the fold open, and every match shows — a name that matches
// behind "+ 12 more" is a name the search did not find, as far as the person
// can tell.
const props = withDefaults(
  defineProps<{
    items: T[]
    /** How many show before the fold. */
    limit?: number
    /** The words for what is folded: "+ 12 more". */
    moreLabel: string
    /** Held open by the host — while searching, always. */
    open?: boolean
    /** Accessible name of the list. */
    label?: string
  }>(),
  { limit: 5, open: false, label: undefined },
)

defineSlots<{ default?: (scope: { item: T; index: number }) => unknown }>()

const unfolded = ref(false)
const list = ref<HTMLElement | null>(null)

// The button goes once the rest is shown, so focus moves to the list it
// unfolded rather than falling to the top of the page.
async function unfold(): Promise<void> {
  unfolded.value = true
  await nextTick()
  list.value?.focus()
}
const showAll = computed(() => props.open || unfolded.value || props.items.length <= props.limit)
const shown = computed(() => (showAll.value ? props.items : props.items.slice(0, props.limit)))
</script>

<template>
  <span class="inline">
    <ul ref="list" role="list" :aria-label="label" tabindex="-1" class="inline outline-none">
      <li v-for="(item, i) in shown" :key="i" class="inline">
        <span v-if="i > 0" aria-hidden="true" class="text-muted"> · </span>
        <slot :item="item" :index="i">{{ item }}</slot>
      </li>
    </ul>
    <button
      v-if="!showAll"
      type="button"
      class="ml-2 whitespace-nowrap rounded-chip text-status-ontrack-fg hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
      @click="unfold"
    >
      {{ moreLabel }}
    </button>
  </span>
</template>
