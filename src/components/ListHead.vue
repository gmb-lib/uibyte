<script setup lang="ts">
import { listCellClass, listGrid } from './listGrid'
import type { ListColumn, ListSort } from './types'

// The header row of a list drawn on the shared grid: each column's words, and a
// way to ask for a sort on the columns the host names. It is for the eye and for
// sorting; it goes when the list is narrow, where the rows no longer line up
// under it.
const props = defineProps<{
  columns: ListColumn[]
  /** The column the rows are sorted by, as the host sorted them. */
  sort?: ListSort
  /** The words a reader hears after a sorted column's name. */
  sortedLabels?: { ascending: string; descending: string }
}>()

const emit = defineEmits<{ sort: [key: string] }>()

function sortedWords(column: ListColumn): string {
  if (props.sort?.key !== column.key || !props.sortedLabels) return ''
  return props.sortedLabels[props.sort.direction]
}
</script>

<template>
  <div
    class="items-center bg-band py-2.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted @max-[760px]:hidden"
    :class="listGrid"
  >
    <span v-for="column in columns" :key="column.key" :class="listCellClass(column)">
      <button
        v-if="column.sortable"
        type="button"
        class="inline-flex items-center gap-1 uppercase hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
        :class="sort?.key === column.key ? 'text-ink' : ''"
        @click="emit('sort', column.key)"
      >
        {{ column.label }}
        <span v-if="sort?.key === column.key" aria-hidden="true">{{ sort.direction === 'ascending' ? '↑' : '↓' }}</span>
        <span v-if="sortedWords(column)" class="sr-only">{{ sortedWords(column) }}</span>
      </button>
      <template v-else>{{ column.label }}</template>
    </span>
  </div>
</template>
