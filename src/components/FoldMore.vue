<script setup lang="ts" generic="T">
import { computed, nextTick, ref } from 'vue'

// The first few of a list, and the words for the rest: "Anna · Jānis · Ilze ·
// Marta · Pēteris  + 12 more".
//
// The words for the rest are the host's, already worded, because a plural is
// the host's to get right and the kit has no language. A host that knows the
// count may give a string; one that wants the count of what is still hidden
// (it depends on what is kept) gives a function of that number. Choosing them
// unfolds the list where it stands, and with words for going back the list can
// be folded again.
//
// A fold must never hide what a person is looking for: when the host is
// searching, it holds the fold open, or marks the matches as kept — they show
// in their place even beyond the limit. A name that matches behind "+ 12 more"
// is a name the search did not find, as far as the person can tell.
const props = withDefaults(
  defineProps<{
    items: T[]
    /** How many show before the fold. */
    limit?: number
    /** The words for what is folded: "+ 12 more", or a function of how many are still hidden. */
    moreLabel: string | ((hidden: number) => string)
    /** Words for folding back once unfolded: "Show fewer". Without them, unfolding is one way. */
    fewerLabel?: string
    /** Items for which this is true always show, in their place, even beyond the limit. */
    keep?: (item: T) => boolean
    /** `inline` runs the items on one line with separators; `rows` makes each a block row, the buttons under them. */
    layout?: 'inline' | 'rows'
    /** Held open by the host — while searching, always. */
    open?: boolean
    /** Accessible name of the list. */
    label?: string
  }>(),
  { limit: 5, open: false, label: undefined, fewerLabel: undefined, keep: undefined, layout: 'inline' },
)

defineSlots<{ default?: (scope: { item: T; index: number }) => unknown }>()

const unfolded = ref(false)
const list = ref<HTMLElement | null>(null)
const moreButton = ref<HTMLElement | null>(null)

const rows = computed(() => props.layout === 'rows')
const showAll = computed(() => props.open || unfolded.value || props.items.length <= props.limit)
const shown = computed(() => {
  const all = props.items.map((item, index) => ({ item, index }))
  return showAll.value ? all : all.filter(({ item, index }) => index < props.limit || props.keep?.(item))
})
const hidden = computed(() => (showAll.value ? 0 : props.items.length - shown.value.length))
const moreText = computed(() => (typeof props.moreLabel === 'function' ? props.moreLabel(hidden.value) : props.moreLabel))
const canFold = computed(() => !!props.fewerLabel && unfolded.value && !props.open && props.items.length > props.limit)

// The button goes once the rest is shown, so focus moves to the list it
// unfolded rather than falling to the top of the page.
async function unfold(): Promise<void> {
  unfolded.value = true
  await nextTick()
  list.value?.focus()
}

// Folding back removes the button that was pressed, so focus goes to the one
// that replaces it — or, when everything left shows anyway, to the list.
async function fold(): Promise<void> {
  unfolded.value = false
  await nextTick()
  ;(moreButton.value ?? list.value)?.focus()
}
</script>

<template>
  <span :class="rows ? 'block' : 'inline'">
    <ul ref="list" role="list" :aria-label="label" tabindex="-1" class="outline-none" :class="rows ? 'block' : 'inline'">
      <li v-for="(entry, i) in shown" :key="entry.index" :class="rows ? 'block' : 'inline'">
        <span v-if="!rows && i > 0" aria-hidden="true" class="text-muted"> · </span>
        <slot :item="entry.item" :index="entry.index">{{ entry.item }}</slot>
      </li>
    </ul>
    <button
      v-if="hidden > 0"
      ref="moreButton"
      type="button"
      class="whitespace-nowrap rounded-chip text-status-ontrack-fg hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
      :class="rows ? 'mt-1 block' : 'ml-2'"
      @click="unfold"
    >
      {{ moreText }}
    </button>
    <button
      v-if="canFold"
      type="button"
      class="whitespace-nowrap rounded-chip text-status-ontrack-fg hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
      :class="rows ? 'mt-1 block' : 'ml-2'"
      @click="fold"
    >
      {{ fewerLabel }}
    </button>
  </span>
</template>
