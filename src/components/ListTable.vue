<script setup lang="ts" generic="T">
import { computed, toRaw } from 'vue'
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

const priority = (column: ListColumn): number => column.priority ?? 2
const track = (column: ListColumn): string => column.width ?? 'minmax(0,1fr)'

// The row grid, once per width the table can be: every column while wide, all
// but priority 3 below that. Narrow rows are not a grid at all.
const tracks = computed(() => ({
  '--list-wide': props.columns.map(track).join(' '),
  '--list-medium': props.columns.filter((c) => priority(c) < 3).map(track).join(' '),
}))

const cellClass = (column: ListColumn): string[] => [
  'min-w-0',
  column.end ? 'text-end' : '',
  priority(column) === 3 ? '@max-[1100px]:hidden' : '',
  priority(column) === 1 ? '@max-[760px]:basis-full' : '@max-[760px]:text-[12.5px]',
]

const value = (row: T, key: string): unknown => (row as Record<string, unknown>)[key]

function rowProps(row: T): Record<string, unknown> {
  if (props.rowLink) return props.rowLink(row)
  return { type: 'button' }
}

function onRowClick(row: T): void {
  if (!props.rowLink) emit('open', row)
}

function sortedWords(column: ListColumn): string {
  if (props.sort?.key !== column.key || !props.sortedLabels) return ''
  return props.sortedLabels[props.sort.direction]
}

const grid =
  'grid gap-x-[14px] px-[18px] [grid-template-columns:var(--list-wide)] @max-[1100px]:[grid-template-columns:var(--list-medium)]'
</script>

<template>
  <div class="@container overflow-hidden rounded-card border border-line bg-surface" :style="tracks">
    <div
      class="items-center bg-band py-2.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted @max-[760px]:hidden"
      :class="grid"
    >
      <span v-for="column in columns" :key="column.key" :class="cellClass(column)">
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

    <ul role="list" :aria-label="label">
      <li v-for="row in rows" :key="rowKey(row)" class="border-t border-line first:border-t-0">
        <component
          :is="rowLink ? link : 'button'"
          v-bind="rowProps(row)"
          :aria-current="current !== undefined && rowKey(row) === current ? 'true' : undefined"
          class="w-full items-center py-[11px] text-start text-[13.5px] text-ink hover:bg-band/60 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus @max-[760px]:flex @max-[760px]:flex-wrap @max-[760px]:gap-y-1.5"
          :class="[grid, current !== undefined && rowKey(row) === current ? 'bg-band' : '']"
          @click="onRowClick(row)"
        >
          <span v-for="column in columns" :key="column.key" :class="cellClass(column)">
            <slot :name="`cell-${column.key}`" :row="row" :value="value(row, column.key)">{{ value(row, column.key) }}</slot>
          </span>
        </component>
      </li>
    </ul>

    <!-- What belongs under the rows inside the same card: a pager, a total. -->
    <slot name="footer" />
  </div>
</template>
