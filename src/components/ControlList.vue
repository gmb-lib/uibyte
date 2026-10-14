<script setup lang="ts" generic="T">
import { computed } from 'vue'
import ListHead from './ListHead.vue'
import { listCard, listCellClass, listGrid, listTracks, listValue } from './listGrid'
import type { ListColumn, ListSort } from './types'

// A list of things, one per row, where each row holds the host's own controls —
// a choice made in place, an act on that row, a link to something else.
//
// It is the same list as the one whose whole row is the way in: the same grid,
// the same header, the same folding by its own width, the same footer, the same
// columns. What differs is the row. There a row is one target; here it cannot
// be, because a control inside a link or a button is two targets at once — a
// click lands on both, and a reader is told of one thing to press with others
// inside it. So a row here is nothing to press. It is its cells, each holding
// what the host put in it, and every control the host puts there is its own stop
// in the page order. The header is for the eye, so a control says whose it is in
// its own name — a picker in a row is named for that row.
//
// Under a row's cells, inside its entry, the host may put something about that
// row alone — a question asked before an act on it, say — so it is read with the
// row it belongs to.
//
// The rows are the host's, already read, sorted and sliced; the list fetches,
// sorts and pages nothing, and acts on nothing: every act is the host's own
// control, answering to the host.
const props = defineProps<{
  columns: ListColumn[]
  rows: T[]
  /** Each row's stable identity. */
  rowKey: (row: T) => string
  /** Accessible name of the list. */
  label: string
  /** The column the rows are sorted by, as the host sorted them. */
  sort?: ListSort
  /** The words a reader hears after a sorted column's name. */
  sortedLabels?: { ascending: string; descending: string }
}>()

const emit = defineEmits<{ sort: [key: string] }>()

defineSlots<{
  [cell: `cell-${string}`]: (scope: { row: T; value: unknown }) => unknown
  /** Under one row's cells, inside its entry — e.g. a question asked before an act on that row. */
  'row-after'?: (scope: { row: T }) => unknown
  footer?: () => unknown
}>()

// The row grid, once per width the list can be: every column while wide, all
// but priority 3 below that. Narrow rows are not a grid at all.
const tracks = computed(() => listTracks(props.columns))
</script>

<template>
  <div :class="listCard" :style="tracks">
    <ListHead :columns="columns" :sort="sort" :sorted-labels="sortedLabels" @sort="(key) => emit('sort', key)" />

    <ul role="list" :aria-label="label">
      <li v-for="row in rows" :key="rowKey(row)" class="border-t border-line first:border-t-0">
        <div
          class="items-center py-[9px] text-[13.5px] text-ink @max-[760px]:flex @max-[760px]:flex-wrap @max-[760px]:gap-y-1.5"
          :class="listGrid"
        >
          <span v-for="column in columns" :key="column.key" :class="listCellClass(column)">
            <slot :name="`cell-${column.key}`" :row="row" :value="listValue(row, column.key)">{{ listValue(row, column.key) }}</slot>
          </span>
        </div>
        <slot name="row-after" :row="row" />
      </li>
    </ul>

    <!-- What belongs under the rows inside the same card: a pager, a total. -->
    <slot name="footer" />
  </div>
</template>
