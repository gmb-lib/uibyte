<script setup lang="ts" generic="T">
import { h, onBeforeUnmount, ref, watch, type VNode } from 'vue'

// One reorder control for every ordered list. A grip handle drags a row
// anywhere — a drop line previews the landing slot — and a focused row moves
// with Alt+ArrowUp / Alt+ArrowDown, so the keyboard path is first-class rather
// than an afterthought. The order badge shows each row's 1-based position.
//
// A row that holds links or buttons of its own cannot be the drag source and the
// keyboard stop at once: its links would drag the row, and its controls would sit
// inside an option a reader is told to choose. With `handle` the list is a plain
// list whose rows the host draws in full, and the row moves by its grip alone —
// a real button, placed by the host wherever its row wants it, that drags the
// whole row and moves it with Alt and the arrow keys.
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
     * its 1-based position and the total. With `handle` it names the grip.
     */
    rowLabel?: (name: string, position: number, total: number) => string
    /** False renders the list with no reorder affordance at all. */
    orderable?: boolean
    /**
     * Rows are moved by their grip only, and drawn entirely by the host: no card,
     * no position badge. The grip reaches the default slot as `grip`, for the host
     * to place with `<component :is="grip" />`.
     */
    handle?: boolean
  }>(),
  {
    orderable: true,
    rowLabel: (name: string, position: number, total: number) =>
      `${name} — ${position} of ${total}`,
    handle: false,
  },
)

defineSlots<{
  /**
   * One row. With `handle`, `grip` is the row's grip — absent when the list is
   * not orderable.
   */
  default(props: { item: T; index: number; grip?: VNode }): unknown
}>()

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

/** Where Alt+ArrowUp / Alt+ArrowDown asks row `i` to go, or null for any other key. */
function keyedMove(i: number, e: KeyboardEvent): number | null {
  if (!e.altKey) return null
  if (e.key === 'ArrowUp' && i > 0) return i - 1
  if (e.key === 'ArrowDown' && i < props.items.length - 1) return i + 1
  return null
}

function onKeydown(i: number, e: KeyboardEvent): void {
  const to = keyedMove(i, e)
  if (to === null) return
  e.preventDefault()
  emit('move', i, to)
}

// --- moved by its grip only --------------------------------------------------

// The list says it is a list: Safari stops calling one a list once its markers
// are styled away, unless it is told. The rows stay plain items.
//
// A row is draggable only while its grip is pressed. At rest it is not, so text
// in it can be selected and its links dragged as links; and a dragstart that
// something inside the row raises for itself is never taken for the row's own.
const armed = ref<string | null>(null)

function arm(key: string, e: PointerEvent): void {
  // A press with any button but the main one — a context menu — is not a drag.
  if (e.button > 0) return
  armed.value = key
  // The press can end anywhere: the pointer may leave the grip before a drag
  // begins, or no drag may begin at all.
  window.addEventListener('pointerup', disarm)
  window.addEventListener('pointercancel', letGoSoon)
}

function disarm(): void {
  armed.value = null
  window.removeEventListener('pointerup', disarm)
  window.removeEventListener('pointercancel', letGoSoon)
}

// A drag that begins takes the pointer away, and a browser may say so just
// before it fires dragstart. Letting go a moment later leaves that drag its
// chance; a drag under way is let go of when it ends.
function letGoSoon(): void {
  setTimeout(() => {
    if (dragIndex.value === null) disarm()
  })
}

onBeforeUnmount(disarm)

// The parent may apply a move later — after writing it somewhere — and redrawing
// the rows can take focus off the grip that asked. So the grip that asked is
// remembered, and focus goes back to it once the row is drawn in another place.
let refocus: { key: string; from: number } | null = null
const list = ref<HTMLElement | null>(null)
const gripEls = new Map<string, HTMLElement>()

function onGripDragStart(i: number, key: string, e: DragEvent): void {
  if (armed.value !== key || e.target !== e.currentTarget) return
  refocus = null
  onDragStart(i, e)
}

function onGripDragEnd(): void {
  onDragEnd()
  disarm()
}

function onGripKeydown(i: number, key: string, e: KeyboardEvent): void {
  const to = keyedMove(i, e)
  if (to === null) return
  e.preventDefault()
  refocus = { key, from: i }
  emit('move', i, to)
}

watch(
  () => props.items.map((item) => props.itemKey(item)),
  (keys) => {
    if (!refocus) return
    const at = keys.indexOf(refocus.key)
    // Still where it was: the move has not been drawn yet.
    if (at === refocus.from) return
    const key = refocus.key
    refocus = null
    if (at < 0) return
    // Only take focus back if it is still ours to give: on the list, or nowhere.
    // If the person has moved on, leave them there.
    const now = document.activeElement
    const ours = !now || now === document.body || (list.value?.contains(now) ?? false)
    if (ours) gripEls.get(key)?.focus()
  },
  { flush: 'post' },
)

const dots: [number, number][] = [
  [2.5, 2.5], [7.5, 2.5],
  [2.5, 8], [7.5, 8],
  [2.5, 13.5], [7.5, 13.5],
]

/** The grip of row `i`, drawn here and placed by the host. */
function grip(item: T, i: number): VNode {
  const key = props.itemKey(item)
  return h(
    'button',
    {
      type: 'button',
      class:
        'grid h-7 w-5 shrink-0 cursor-grab place-items-center rounded-chip text-faint hover:bg-status-ontrack-bg hover:text-status-ontrack-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus',
      'aria-label': props.rowLabel(props.label(item), i + 1, props.items.length),
      'data-testid': 'grip',
      ref: (el: unknown) => {
        if (el instanceof HTMLElement) gripEls.set(key, el)
        else gripEls.delete(key)
      },
      onPointerdown: (e: PointerEvent) => arm(key, e),
      onKeydown: (e: KeyboardEvent) => onGripKeydown(i, key, e),
    },
    [
      h(
        'svg',
        { width: 10, height: 16, viewBox: '0 0 10 16', fill: 'currentColor', 'aria-hidden': 'true' },
        dots.map(([cx, cy]) => h('circle', { cx, cy, r: 1.5 })),
      ),
    ],
  )
}

/** Row `i` is where a dragged row would land. */
function isDropTarget(i: number): boolean {
  return dropIndex.value === i && dragIndex.value !== null && dragIndex.value !== i
}
</script>

<template>
  <ul v-if="handle" ref="list" role="list" :aria-label="listLabel">
    <li
      v-for="(item, i) in items"
      :key="itemKey(item)"
      :draggable="(orderable && armed === itemKey(item)) || undefined"
      :class="[
        dragIndex === i ? 'opacity-45' : '',
        isDropTarget(i) ? 'shadow-[inset_0_3px_0_0_var(--color-status-ontrack)]' : '',
      ]"
      @dragstart="orderable && onGripDragStart(i, itemKey(item), $event)"
      @dragover="orderable && onDragOver(i, $event)"
      @dragleave="dropIndex === i && (dropIndex = null)"
      @drop.prevent="orderable && onDrop(i)"
      @dragend="onGripDragEnd"
    >
      <slot :item="item" :index="i" :grip="orderable ? grip(item, i) : undefined" />
    </li>
  </ul>

  <ul v-else class="space-y-2.5" role="listbox" :aria-label="listLabel">
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
