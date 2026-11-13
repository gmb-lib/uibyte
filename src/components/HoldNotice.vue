<script setup lang="ts">
import { nextTick, ref } from 'vue'
import {
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
} from 'reka-ui'
import { Button } from './ui/button'

// A notice over the page, with one button, for a page that must not be used any
// further: what it says is the host's sentence (the default slot), and the only
// way on is the one button, which the host answers by taking the person
// somewhere the page can be used again.
//
// It is built on the dialog primitives the kit's window uses, as an alert
// dialog: while open it is announced at once with the sentence as its name
// (read once; there is no separate description), the page under it is hidden from a reader and held still, Tab
// stays inside, and focus is on the button.
//
// **It cannot be dismissed.** Escape does nothing, a press outside it does
// nothing, and there is no close mark; `open` is the host's alone. When `open`
// is false none of it is in the page. Use it only where a notice that can be
// waved away would leave the page looking usable while it is not.
defineProps<{
  open: boolean
  /** The button's words. Already translated. */
  actionLabel: string
}>()

const emit = defineEmits<{ act: [] }>()

const button = ref<{ $el: HTMLElement } | null>(null)

// The primitive's own pick is a button that cancels, which this notice does not
// have; focus goes to the one button there is.
function onOpenAutoFocus(event: Event): void {
  event.preventDefault()
  void nextTick(() => button.value?.$el.focus({ preventScroll: true }))
}
</script>

<template>
  <!-- Controlled by `open` alone: a close the primitive asks for is never listened to. -->
  <AlertDialogRoot :open="open">
    <AlertDialogPortal>
      <!-- Above every other layer the kit draws (the drawer and an open list are z-50): a notice
           with one way on must not sit under something that is still open. -->
      <AlertDialogOverlay class="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-ink/[0.48] p-5">
        <AlertDialogContent
          data-hold
          aria-modal="true"
          :aria-describedby="undefined"
          class="w-full max-w-[440px] rounded-[14px] border border-line bg-surface px-6 py-[22px] text-ink shadow-[0_14px_38px_rgba(22,24,27,0.2)] outline-none"
          @open-auto-focus="onOpenAutoFocus"
          @escape-key-down.prevent
        >
          <AlertDialogTitle as="p" class="m-0 break-words text-[14.5px] font-normal">
            <slot />
          </AlertDialogTitle>
          <div class="mt-[18px]">
            <!-- The kit's button never wraps; a long translated label must, and the button grows with it. -->
            <Button
              ref="button"
              type="button"
              class="h-auto min-h-10 whitespace-normal text-center"
              @click="emit('act')"
            >{{ actionLabel }}</Button>
          </div>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
