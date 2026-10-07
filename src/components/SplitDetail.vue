<script setup lang="ts">
import { nextTick, ref, useId, watch } from 'vue'

// A list, and the one item opened from it: beside the list when there is room,
// on its own with a way back when there is not.
//
// "Room" is this component's own width, not the window's — a list inside a
// narrow column has no room on a wide screen, and a full-width one has room on a
// laptop. Below 760px of its own width an open item replaces the list, and a way
// back above it closes the item again.
//
// Moving between the two must not lose a keyboard reader. When the item opens
// and the list is no longer shown, focus moves to the item; when the way back is
// taken, it returns to the row that is marked current in the list, or to the
// list itself.
//
// Which item is open, and what closing it means, are the host's: this draws the
// two places and says when the way back was asked for.
const props = withDefaults(
  defineProps<{
    /** An item is open. */
    open: boolean
    /** The list's name, as the way back reads: "Users". The arrow is drawn, not written. */
    backLabel: string
    /** Accessible name of the open item's region — usually its own name. */
    label?: string
    /** The item's width beside the list. */
    detailWidth?: string
  }>(),
  { label: undefined, detailWidth: '390px' },
)

const emit = defineEmits<{ back: [] }>()

const uid = useId()
const listEl = ref<HTMLElement | null>(null)
const detailEl = ref<HTMLElement | null>(null)

const shown = (el: HTMLElement | null): boolean => !!el && getComputedStyle(el).display !== 'none'

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    await nextTick()
    if (!shown(listEl.value)) detailEl.value?.focus()
  },
)

async function back(): Promise<void> {
  emit('back')
  await nextTick()
  const row = listEl.value?.querySelector<HTMLElement>('[aria-current="true"]')
  ;(row ?? listEl.value)?.focus()
}
</script>

<template>
  <div class="@container">
    <div
      class="grid items-start gap-[18px]"
      :class="open ? 'grid-cols-[minmax(0,1fr)_var(--detail-width)] @max-[760px]:grid-cols-1' : 'grid-cols-1'"
      :style="{ '--detail-width': detailWidth }"
    >
      <div ref="listEl" :id="`${uid}-list`" tabindex="-1" class="min-w-0 outline-none" :class="open ? '@max-[760px]:hidden' : ''">
        <slot name="list" />
      </div>

      <section
        v-if="open"
        ref="detailEl"
        tabindex="-1"
        :aria-label="label"
        class="sticky top-2.5 min-w-0 rounded-card border border-line bg-surface outline-none @max-[760px]:static"
      >
        <button
          type="button"
          class="mx-[18px] mt-3 hidden items-center gap-1.5 rounded-chip text-[12.5px] text-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus @max-[760px]:inline-flex"
          :aria-controls="`${uid}-list`"
          @click="back"
        >
          <span aria-hidden="true">‹</span>{{ backLabel }}
        </button>
        <slot name="detail" />
      </section>
    </div>
  </div>
</template>
