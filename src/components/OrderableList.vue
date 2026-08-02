<script setup lang="ts" generic="T">
import { ref } from 'vue'

// One reorder control for every ordered list. A grip handle drags a row
// anywhere — a drop line previews the landing slot — and a focused row moves
// with Alt+ArrowUp / Alt+ArrowDown, so the keyboard path is first-class rather
// than an afterthought. The order badge shows each row's 1-based position.
//
// The parent owns the array. This only ever emits the desired move.
const props = withDefaults(
  defineProps<{
    items: T[]
    /** A stable identity for a row. Never the index. */
    itemKey: (item: T) => string
    /** Names one row for assistive technology. */
    label: (item: T) => string
    /** Accessible name for the list itself. */
    listLabel: string
    /**
     * Accessible name for a row when it can be reordered — it should say the
     * position, since that is the thing being changed. Given the row's label,
     * its 1-based position and the total.
     */
    rowLabel?: (name: string, position: number, total: number) => string
    /** False renders the list with no reorder affordance at all. */
    orderable?: boolean
  }>(),
  {
    orderable: true,
    rowLabel: (name: string, position: number, total: number) =>
      `${name} — ${position} of ${total}`,
  },
)

const emit = defineEmits<{ move: [from: number, to: number] }>()

const dragIndex = ref<number | null>(null)
const dropIndex = ref<number | null>(null)

function onDragStart(i: number, e: DragEvent): void {
  dragIndex.value = i
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onDragOver(i: number, e: DragEvent): void {
  if (dragIndex.value === null) return
  e.preventDefault()
  dropIndex.value = i
}

function onDrop(i: number): void {
  const from = dragIndex.value
  dragIndex.value = null
  dropIndex.value = null
  if (from === null || from === i) return
  emit('move', from, i)
}

function onDragEnd(): void {
  dragIndex.value = null
  dropIndex.value = null
}

function onKeydown(i: number, e: KeyboardEvent): void {
  if (!e.altKey) return
  if (e.key === 'ArrowUp' && i > 0) {
    e.preventDefault()
    emit('move', i, i - 1)
  }
  if (e.key === 'ArrowDown' && i < props.items.length - 1) {
    e.preventDefault()
    emit('move', i, i + 1)
  }
}
</script>

<template>
  <ul class="space-y-2.5" role="listbox" :aria-label="listLabel">
    <li
      v-for="(item, i) in items"
      :key="itemKey(item)"
      role="option"
      :tabindex="orderable ? 0 : undefined"
      :draggable="orderable || undefined"
      :aria-selected="false"
      :aria-label="orderable ? rowLabel(label(item), i + 1, items.length) : label(item)"
      class="flex items-center gap-3 rounded-card border bg-surface px-4 py-3 transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
      :class="[
        dragIndex === i ? 'opacity-45' : '',
        dropIndex === i && dragIndex !== null && dragIndex !== i
          ? 'border-status-ontrack shadow-[0_-3px_0_0_var(--color-status-ontrack)]'
          : 'border-line',
      ]"
      @dragstart="orderable && onDragStart(i, $event)"
      @dragover="orderable && onDragOver(i, $event)"
      @dragleave="dropIndex === i && (dropIndex = null)"
      @drop.prevent="orderable && onDrop(i)"
      @dragend="onDragEnd"
      @keydown="orderable && onKeydown(i, $event)"
    >
      <span
        v-if="orderable"
        class="grid h-7 w-5 shrink-0 cursor-grab place-items-center rounded-chip text-faint hover:bg-status-ontrack-bg hover:text-status-ontrack-fg"
        aria-hidden="true"
        data-testid="grip"
      >
        <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
          <circle cx="2.5" cy="2.5" r="1.5" /><circle cx="7.5" cy="2.5" r="1.5" />
          <circle cx="2.5" cy="8" r="1.5" /><circle cx="7.5" cy="8" r="1.5" />
          <circle cx="2.5" cy="13.5" r="1.5" /><circle cx="7.5" cy="13.5" r="1.5" />
        </svg>
      </span>
      <span
        v-if="orderable"
        class="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-pill bg-band font-mono text-[12px] font-bold text-muted-strong"
        aria-hidden="true"
      >
        {{ i + 1 }}
      </span>
      <slot :item="item" :index="i" />
    </li>
  </ul>
</template>
