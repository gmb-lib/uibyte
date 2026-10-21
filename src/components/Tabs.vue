<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, toRaw, useId, watch } from 'vue'
import type { LinkComponent, TabItem } from './types'

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
//
// Given a `linkComponent`, the same strip draws the screens of one place, each
// at its own address: navigation rather than a tab list, so each is a link (the
// host's router link, its address in `linkProps`), the one open is marked as
// the page, and the page below is the host's, not a panel of this one.
//
// The look is one underline under the chosen choice. A strip wider than its
// room never wraps: it scrolls sideways within itself, the chosen one is
// brought into view, and the side that has more fades out.
const props = defineProps<{
  /** The choices, in the order they are drawn. */
  tabs: TabItem[]
  /** The chosen key. */
  modelValue: string
  /** Accessible name for the strip itself — what this set of choices is about. */
  label: string
  /** Draw each choice as this link component (a router link, or `'a'`), its address in the choice's `linkProps`. */
  linkComponent?: LinkComponent
}>()

const emit = defineEmits<{ 'update:modelValue': [key: string] }>()

// Unwrapped before it is rendered: a component reaching `<component :is>` as a
// reactive proxy makes Vue warn.
const link = computed(() => (props.linkComponent ? toRaw(props.linkComponent) : undefined))

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

// ---- a strip wider than its room -----------------------------------------------

/** How wide the fade is, and the room left beside a choice brought into view. */
const FADE = 28

const strip = ref<HTMLElement | null>(null)
/** Which side of the strip has more to scroll to. */
const more = ref<'none' | 'left' | 'right' | 'both'>('none')

function measure(): void {
  const el = strip.value
  if (!el) return
  const end = el.scrollWidth - el.clientWidth
  const left = el.scrollLeft > 1
  const right = el.scrollLeft < end - 1
  more.value = left && right ? 'both' : left ? 'left' : right ? 'right' : 'none'
}

/** The chosen choice brought into view by scrolling the strip alone — never the page. */
function bringChosenIntoView(): void {
  const el = strip.value
  const at = props.tabs.findIndex((t) => t.key === props.modelValue)
  const tab = at < 0 ? undefined : (el?.children[at] as HTMLElement | undefined)
  if (!el || !tab) return
  const left = tab.offsetLeft
  const right = left + tab.offsetWidth
  if (left < el.scrollLeft) el.scrollLeft = Math.max(0, left - FADE)
  else if (right > el.scrollLeft + el.clientWidth) el.scrollLeft = right - el.clientWidth + FADE
  measure()
}

const fade = computed<Record<string, string>>(() => {
  const mask = {
    none: '',
    left: `linear-gradient(to right, transparent 0, #000 ${FADE}px)`,
    right: `linear-gradient(to left, transparent 0, #000 ${FADE}px)`,
    both: `linear-gradient(to right, transparent 0, #000 ${FADE}px, #000 calc(100% - ${FADE}px), transparent 100%)`,
  }[more.value]

  const style: Record<string, string> = {}
  if (mask) {
    style.maskImage = mask
    style.WebkitMaskImage = mask
  }

  return style
})

let resized: ResizeObserver | undefined
onMounted(() => {
  bringChosenIntoView()
  // A strip that gains or loses room changes which side has more.
  if (typeof ResizeObserver !== 'undefined' && strip.value) {
    resized = new ResizeObserver(measure)
    resized.observe(strip.value)
  }
})
onBeforeUnmount(() => resized?.disconnect())
// After the strip is drawn with the new choice, so its place is the drawn one.
watch(() => props.modelValue, bringChosenIntoView, { flush: 'post' })

// ---- the look ----------------------------------------------------------------------

// Written out as full literal strings so a consumer's utility scan sees every
// class this component can render.
const stripClass =
  'relative flex flex-nowrap gap-1 overflow-x-auto overflow-y-hidden shadow-[inset_0_-1px_0_var(--color-line)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
const tabClass =
  'inline-flex flex-none items-baseline whitespace-nowrap border-0 border-b-2 bg-transparent px-4 py-[9px] text-[14px] focus-visible:rounded-[4px] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-[3px] focus-visible:outline-focus'
const tabState = (tab: TabItem): string =>
  tab.disabled
    ? 'cursor-not-allowed border-transparent text-faint'
    : tab.key === props.modelValue
      ? 'border-ink font-semibold text-ink'
      : 'border-transparent text-muted-strong hover:border-ink/25 hover:text-ink'
const tagClass = 'ml-1.5 font-mono text-[11px] text-faint'
</script>

<template>
  <div>
    <component :is="link ? 'nav' : 'div'" :aria-label="link ? label : undefined" data-strip :data-more="more">
      <div
        ref="strip"
        :role="link ? undefined : 'tablist'"
        :aria-label="link ? undefined : label"
        :class="stripClass"
        :style="fade"
        @scroll="measure"
      >
        <template v-if="link">
          <template v-for="tab in tabs" :key="tab.key">
            <span v-if="tab.disabled" aria-disabled="true" :class="[tabClass, tabState(tab)]">
              {{ tab.label }} <span v-if="tab.tag" :class="tagClass">{{ tab.tag }}</span>
            </span>
            <component
              :is="link"
              v-else
              v-bind="tab.linkProps"
              :aria-current="tab.key === modelValue ? 'page' : undefined"
              :class="[tabClass, tabState(tab)]"
            >
              {{ tab.label }} <span v-if="tab.tag" :class="tagClass">{{ tab.tag }}</span>
            </component>
          </template>
        </template>
        <template v-else>
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
            :class="[tabClass, tabState(tab)]"
            @click="choose(tab)"
            @keydown="onKeydown(i, $event)"
          >
            {{ tab.label }} <span v-if="tab.tag" :class="tagClass">{{ tab.tag }}</span>
          </button>
        </template>
      </div>
    </component>

    <!-- Rendered only when there is something to put in it, so a host that
         wants the strip alone is not handed an empty region to explain. A strip
         of links has none: the page below is the host's. -->
    <div
      v-if="!link && $slots.default && chosen"
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
