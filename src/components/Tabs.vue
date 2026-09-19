<script setup lang="ts">
import { computed, useId } from 'vue'
import type { TabItem } from './types'

// One strip of choices, one panel below it.
//
// Every application here had already drawn this by hand, and every hand-drawn
// one was missing the same half: `role="tablist"` with no keyboard contract
// behind it, which announces a control that then does not behave like one. A
// reader who hears "tab list" expects the arrow keys to move along it; when
// they do not, the markup has made a promise the page does not keep.
//
// So this component's reason to exist is the behaviour, not the paint: a
// roving tab stop (the strip is ONE stop, not one per choice), arrow keys along
// it, Home and End to the ends, and the panel wired to the choice that opened
// it. Choosing follows focus, because switching here is instant and a reader
// arrowing along a strip should hear each panel as they reach it.
//
// The host owns which one is chosen. This only ever says which was asked for.
const props = defineProps<{
  /** The choices, in the order they are drawn. */
  tabs: TabItem[]
  /** The chosen key. */
  modelValue: string
  /** Accessible name for the strip itself — what this set of choices is about. */
  label: string
}>()

const emit = defineEmits<{ 'update:modelValue': [key: string] }>()

// Stable per instance, so two strips on one page never collide.
const uid = useId()
const tabId = (key: string): string => `${uid}-tab-${key}`
const panelId = (key: string): string => `${uid}-panel-${key}`

const chosen = computed<TabItem | undefined>(() => props.tabs.find((t) => t.key === props.modelValue))

/** Where the single tab stop sits: the chosen one, or the first that can be chosen. */
const focusKey = computed<string | undefined>(
  () => chosen.value?.key ?? props.tabs.find((t) => !t.disabled)?.key,
)

function choose(tab: TabItem): void {
  // A disabled choice is drawn and announced, never activated — it is there so
  // a person can see the thing exists, which is a different message from an
  // absence.
  if (tab.disabled || tab.key === props.modelValue) return
  emit('update:modelValue', tab.key)
}

/** The next choosable index in a direction, wrapping, or -1 if there is none. */
function step(from: number, delta: number): number {
  const n = props.tabs.length
  for (let i = 1; i <= n; i++) {
    const at = (from + delta * i + n * n) % n
    if (!props.tabs[at]?.disabled) return at
  }

  return -1
}

function focusAt(index: number, e: KeyboardEvent): void {
  if (index < 0) return
  const tab = props.tabs[index]
  if (!tab) return
  e.preventDefault()
  choose(tab)
  // The chosen button becomes the tab stop on re-render; move the caret there
  // too, or the reader is left announcing a control they are no longer on.
  const el = (e.currentTarget as HTMLElement)?.parentElement?.children[index]
  if (el instanceof HTMLElement) el.focus()
}

function onKeydown(index: number, e: KeyboardEvent): void {
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      focusAt(step(index, 1), e)
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      focusAt(step(index, -1), e)
      break
    case 'Home':
      focusAt(step(-1, 1), e)
      break
    case 'End':
      focusAt(step(props.tabs.length, -1), e)
      break
  }
}
</script>

<template>
  <div>
    <div class="flex flex-wrap gap-2" role="tablist" :aria-label="label">
      <button
        v-for="(tab, i) in tabs"
        :id="tabId(tab.key)"
        :key="tab.key"
        type="button"
        role="tab"
        :aria-selected="tab.key === modelValue"
        :aria-controls="$slots.default ? panelId(tab.key) : undefined"
        :aria-disabled="tab.disabled || undefined"
        :tabindex="tab.key === focusKey ? 0 : -1"
        class="inline-flex items-center gap-2 rounded-pill border px-3.5 py-1.5 text-[12.5px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
        :class="[
          tab.key === modelValue
            ? 'border-ink bg-ink text-surface'
            : 'border-line bg-surface text-ink',
          tab.disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-ink/40',
        ]"
        @click="choose(tab)"
        @keydown="onKeydown(i, $event)"
      >
        {{ tab.label }}
        <span
          v-if="tab.tag"
          class="rounded-chip px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em]"
          :class="tab.key === modelValue ? 'bg-surface/20' : 'bg-band text-muted-strong'"
        >
          {{ tab.tag }}
        </span>
      </button>
    </div>

    <!-- Rendered only when there is something to put in it, so a host that
         wants the strip alone is not handed an empty region to explain. -->
    <div
      v-if="$slots.default && chosen"
      :id="panelId(chosen.key)"
      role="tabpanel"
      :aria-labelledby="tabId(chosen.key)"
      tabindex="0"
      class="mt-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
    >
      <slot :tab="chosen" />
    </div>
  </div>
</template>
