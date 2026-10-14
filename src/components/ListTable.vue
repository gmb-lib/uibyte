<script setup lang="ts" generic="T">
import { computed, toRaw } from 'vue'
import ListHead from './ListHead.vue'
import { listCard, listCellClass, listGrid, listTracks, listValue } from './listGrid'
import type { LinkComponent, ListColumn, ListSort } from './types'

// A list of things, one per row, where the whole row is the way in.
//
// Hand-drawn lists made one cell the link — usually the name — so the rest of
// the row was dead to a click and a keyboard reader met the row as a scatter of
// pieces. Here each row is one target: one stop in the page order, announced as
// one, opening one thing. With `rowLink` it is the host's own link; without, it
// is a button that says which row was opened.
//
// It is drawn as a list of rows on a shared grid rather than as a table, because
// a table's row cannot be a link. The header row is for the eye and for sorting;
// what a reader hears of a row is its cells in order.
//
// It folds by its own width, never the window's: a list beside an open item is
// narrow on any screen. While wide every column shows; below that the columns of
// priority 3 go; when narrow the header goes too, and each row becomes its title
// on a line of its own with the other cells wrapped beneath it.
//
// The rows are the host's, already read, sorted and sliced; the table fetches,
// sorts and pages nothing. Sorting is asked for, and the host answers it.
//
// A row that holds controls of its own — a choice made in place, an act on that
// row — cannot be one target, because a control inside a link or a button is two
// targets at once. Such a list is `ControlList`: the same grid, header and
// folding, with rows that are nothing to press. Every row here stays one target;
// there is no setting that makes it otherwise.
const props = withDefaults(
  defineProps<{
    columns: ListColumn[]
    rows: T[]
    /** Each row's stable identity. */
    rowKey: (row: T) => string
    /** Accessible name of the list. */
    label: string
    /** The props handed to the host's link component for a row. Without it, rows are buttons. */
    rowLink?: (row: T) => Record<string, unknown>
    linkComponent?: LinkComponent
    /** The column the rows are sorted by, as the host sorted them. */
    sort?: ListSort
    /** The words a reader hears after a sorted column's name. */
    sortedLabels?: { ascending: string; descending: string }
    /** The key of the row that is open, e.g. beside the list. */
    current?: string
  }>(),
  { linkComponent: 'a' },
)

const emit = defineEmits<{ open: [row: T]; sort: [key: string] }>()

defineSlots<{
  [cell: `cell-${string}`]: (scope: { row: T; value: unknown }) => unknown
  footer?: () => unknown
}>()

// A component handed in as a prop arrives wrapped for reactivity; drawing it
// needs the component itself.
const link = computed(() => toRaw(props.linkComponent))

// The row grid, once per width the table can be: every column while wide, all
// but priority 3 below that. Narrow rows are not a grid at all.
const tracks = computed(() => listTracks(props.columns))

function rowProps(row: T): Record<string, unknown> {
  if (props.rowLink) return props.rowLink(row)
  return { type: 'button' }
}

function onRowClick(row: T): void {
  if (!props.rowLink) emit('open', row)
}
</script>

<template>
  <div :class="listCard" :style="tracks">
    <ListHead :columns="columns" :sort="sort" :sorted-labels="sortedLabels" @sort="(key) => emit('sort', key)" />

    <ul role="list" :aria-label="label">
      <li v-for="row in rows" :key="rowKey(row)" class="border-t border-line first:border-t-0">
        <component
          :is="rowLink ? link : 'button'"
          v-bind="rowProps(row)"
          :aria-current="current !== undefined && rowKey(row) === current ? 'true' : undefined"
          class="w-full items-center py-[11px] text-start text-[13.5px] text-ink hover:bg-band/60 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus @max-[760px]:flex @max-[760px]:flex-wrap @max-[760px]:gap-y-1.5"
          :class="[listGrid, current !== undefined && rowKey(row) === current ? 'bg-band' : '']"
          @click="onRowClick(row)"
        >
          <span v-for="column in columns" :key="column.key" :class="listCellClass(column)">
            <slot :name="`cell-${column.key}`" :row="row" :value="listValue(row, column.key)">{{ listValue(row, column.key) }}</slot>
          </span>
        </component>
      </li>
    </ul>

    <!-- What belongs under the rows inside the same card: a pager, a total. -->
    <slot name="footer" />
  </div>
</template>
