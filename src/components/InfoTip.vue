<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'

// A small round "i" beside a label that opens a longer description in a floating panel.
//
// It is a disclosure, not a tooltip: the description is a few sentences a person may want to
// read slowly, select or come back to, and it opens on a press, which a tooltip never does.
// So the button carries `aria-expanded` and `aria-controls`, and the panel is plain content
// that a reader can reach by moving on from the button. The panel stays in the page, hidden
// while closed, so the button's reference always points at something.
//
// It opens on the pointer being over it, on keyboard focus and on a press (the only way on a
// touch screen). Opened by the pointer, it closes when the pointer leaves, after a short delay
// so the pointer can cross into the panel and the text can be selected. Opened by a press, it
// stays open when the pointer leaves. Either way it closes on the button losing focus, on
// Escape (focus staying on the button), on a second press and on a press anywhere outside.
//
// The description is the default slot, so the host can mark words in another language or set
// a paragraph break; the `label` (the button's accessible name) is the host's finished,
// translated words.
const props = defineProps<{
  /** The button's accessible name, e.g. "About this setting". Already translated. */
  label: string
}>()

const LEAVE_DELAY_MS = 150
const EDGE = 8

const uid = useId()
const panelId = `${uid}-panel`
const open = ref(false)
// A press makes it stay until a second press, whatever the pointer does after.
const pinned = ref(false)
const pointerInside = ref(false)
const root = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const shift = ref(0)
const above = ref(false)
let leaveTimer: ReturnType<typeof setTimeout> | undefined

function clearLeave(): void {
  if (leaveTimer !== undefined) clearTimeout(leaveTimer)
  leaveTimer = undefined
}

function show(): void {
  clearLeave()
  if (open.value) return
  open.value = true
  place()
}

function hide(): void {
  clearLeave()
  open.value = false
  pinned.value = false
}

// Keep the panel inside the window. It starts below the button and unshifted; once drawn so, it
// slides left when it would run past the right edge and right when it would run past the left
// one, and it opens above the button when its bottom would pass the window's bottom edge and
// there is more room above the button than below it.
function place(): void {
  above.value = false
  shift.value = 0
  void nextTick(measure)
}

function measure(): void {
  const el = panel.value
  if (!el || !open.value) return
  const r = el.getBoundingClientRect()
  const width = document.documentElement.clientWidth || window.innerWidth
  const height = document.documentElement.clientHeight || window.innerHeight
  if (r.right > width - EDGE) shift.value = width - EDGE - r.right
  else if (r.left < EDGE) shift.value = EDGE - r.left
  const b = root.value?.querySelector('button')?.getBoundingClientRect()
  if (b && r.bottom > height - EDGE && b.top > height - b.bottom) above.value = true
}

function onEnter(): void {
  pointerInside.value = true
  show()
}
function onLeave(): void {
  pointerInside.value = false
  clearLeave()
  // A press keeps it open until the second press, whatever the pointer does after.
  if (pinned.value) return
  leaveTimer = setTimeout(() => {
    leaveTimer = undefined
    hide()
  }, LEAVE_DELAY_MS)
}
function onFocus(): void {
  show()
}
function onBlur(): void {
  // Text in the panel is being selected with the pointer: focus has left the button, not the tip.
  if (pointerInside.value) return
  hide()
}
function onPress(): void {
  if (open.value && pinned.value) {
    hide()
    return
  }
  show()
  pinned.value = true
}
function onKeydown(e: KeyboardEvent): void {
  if (e.key !== 'Escape' || !open.value) return
  hide()
  root.value?.querySelector('button')?.focus()
}
function onOutside(e: Event): void {
  if (!open.value) return
  if (root.value && e.target instanceof Node && root.value.contains(e.target)) return
  hide()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('pointerdown', onOutside)
  window.addEventListener('resize', place)
})
onBeforeUnmount(() => {
  clearLeave()
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('pointerdown', onOutside)
  window.removeEventListener('resize', place)
})

// The pressable box is 24 x 24 px (the minimum target size); the drawn circle inside it is 18 px,
// and the negative margin gives the 3 px back so the box does not push the label away.
const button =
  '-m-[3px] inline-flex h-6 w-6 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus'
const circle =
  'inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border text-[12px] font-semibold italic leading-none'
const buttonClosed = 'border-muted-strong bg-surface text-muted-strong hover:border-ink hover:text-ink'
const buttonOpen = 'border-ink bg-ink text-surface'
</script>

<template>
  <span ref="root" class="relative inline-flex align-middle" @mouseenter="onEnter" @mouseleave="onLeave">
    <button
      type="button"
      :aria-label="props.label"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="panelId"
      :class="button"
      @click="onPress"
      @focus="onFocus"
      @blur="onBlur"
    >
      <span aria-hidden="true" :class="[circle, open ? buttonOpen : buttonClosed]">i</span>
    </button>
    <!-- The padding is the gap between button and panel, on whichever side it opens, so the pointer never crosses dead space. -->
    <div
      v-show="open"
      :id="panelId"
      ref="panel"
      :class="above ? 'absolute bottom-full left-0 z-50 pb-1.5' : 'absolute left-0 top-full z-50 pt-1.5'"
      :style="{ transform: shift ? `translateX(${shift}px)` : undefined }"
    >
      <div
        class="w-max max-w-[min(440px,calc(100vw-32px))] rounded-[10px] bg-console px-3.5 py-2.5 text-left text-[13px] font-normal not-italic leading-relaxed text-console-text shadow-console"
      >
        <slot />
      </div>
    </div>
  </span>
</template>
