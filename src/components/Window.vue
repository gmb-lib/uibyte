<script setup lang="ts">
import { ref } from 'vue'
import { DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'

// A window over the page, for a short form that belongs to what is under it —
// changing an item's details, say — where leaving the page to fill it in would
// lose the person's place.
//
// It is built on dialog primitives, so the parts a hand-drawn window gets wrong
// come from underneath rather than being rewritten here: Tab stays inside, the
// page behind is hidden from a reader and held still, and focus goes back to
// whatever opened the window when it closes.
//
// Two things are decided here. Focus moves to the first thing in the body that
// takes it — the person opened the window to fill it in, so the close mark, which
// comes first, is not where they start; a body with nothing to focus gives focus
// to the window itself, so a reader hears its title. And while `busy` is set,
// Escape, the close mark and a press outside all do nothing, so a save under way
// is never abandoned halfway with its answer unseen.
//
// An act asked about first is not a window: that question is asked in place.
const props = withDefaults(
  defineProps<{
    /** The window's name: drawn as its heading, and what a reader hears it called. */
    title: string
    /** Accessible name of the close mark — the mark is drawn, so it has no words of its own. */
    closeLabel: string
    /** While something the window started is under way: Escape, the close mark and a press outside do nothing. */
    busy?: boolean
    /** `wide` for a form laid out in two columns. */
    size?: 'default' | 'wide'
  }>(),
  { busy: false, size: 'default' },
)

const open = defineModel<boolean>('open', { default: false })

const body = ref<HTMLElement | null>(null)

// Every way a person closes the window passes through here, so one check holds
// them all while busy. The host's own `open` does not, and always applies.
function setOpen(value: boolean): void {
  if (!value && props.busy) return
  open.value = value
}

const focusable = 'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]'

function candidates(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(focusable)).filter(
    (el) =>
      el.tabIndex >= 0 &&
      !(el as HTMLButtonElement).disabled &&
      !(el instanceof HTMLInputElement && el.type === 'hidden') &&
      !el.closest('[hidden], [inert]'),
  )
}

// Each candidate is tried in order, because a field hidden from view does not
// take focus however it is marked; only when none does is the window focused.
function onOpenAutoFocus(event: Event): void {
  event.preventDefault()
  for (const el of body.value ? candidates(body.value) : []) {
    el.focus()
    if (document.activeElement === el) return
  }
  ;(event.target as HTMLElement).focus()
}
</script>

<template>
  <DialogRoot :open="open" @update:open="setOpen">
    <DialogPortal>
      <!-- The backdrop is also the space the window is laid out in: it scrolls
           when the window is taller than the page, and its width is what the
           window folds by. -->
      <DialogOverlay class="@container fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-console/40">
        <DialogContent
          :aria-describedby="undefined"
          aria-modal="true"
          :aria-busy="busy || undefined"
          class="my-[60px] flex w-[calc(100%-40px)] flex-col rounded-card bg-surface text-ink shadow-[0_24px_64px_rgba(14,17,20,0.28)] outline-none @max-[640px]:my-0 @max-[640px]:min-h-full @max-[640px]:w-full @max-[640px]:max-w-none @max-[640px]:rounded-none"
          :class="size === 'wide' ? 'max-w-[760px]' : 'max-w-[560px]'"
          @open-auto-focus="onOpenAutoFocus"
        >
          <div class="flex items-center gap-2.5 border-b border-line px-5 py-4">
            <DialogTitle class="min-w-0 flex-1 text-[17px] font-semibold leading-snug">{{ title }}</DialogTitle>
            <DialogClose
              :aria-label="closeLabel"
              :aria-disabled="busy || undefined"
              class="-mr-1.5 rounded-chip p-1.5 text-muted-strong hover:bg-band hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-transparent"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" />
              </svg>
            </DialogClose>
          </div>
          <div ref="body" class="flex-1 px-5 py-3.5">
            <slot />
          </div>
          <div
            v-if="$slots.footer"
            class="flex flex-wrap items-center justify-end gap-2 rounded-b-card border-t border-line bg-band px-5 py-[13px] @max-[640px]:rounded-none"
          >
            <slot name="footer" />
          </div>
        </DialogContent>
      </DialogOverlay>
    </DialogPortal>
  </DialogRoot>
</template>
