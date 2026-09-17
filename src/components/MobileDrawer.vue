<script setup lang="ts">
// The small-screen navigation drawer: a left off-canvas sheet built on dialog
// primitives, so the focus trap, Escape-to-close, aria-modal and focus-restore
// come from the primitive rather than being hand-rolled.
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
} from 'reka-ui'

defineProps<{
  /** Names the dialog for assistive technology. Not shown. */
  title: string
  /** Accessible name for the close control. */
  closeLabel: string
}>()

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-black/50" />
      <DialogContent
        :aria-describedby="undefined"
        class="fixed left-0 top-0 z-50 flex h-full w-[264px] max-w-[85vw] flex-col bg-console text-console-text shadow-console focus:outline-none"
      >
        <DialogTitle class="sr-only">{{ title }}</DialogTitle>
        <div class="flex items-center justify-between px-3.5 pb-1 pt-[18px]">
          <slot name="header" />
          <DialogClose
            :aria-label="closeLabel"
            class="-mr-1 rounded-chip p-1.5 text-console-muted hover:bg-white/[0.1] hover:text-console-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-console-focus"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" />
            </svg>
          </DialogClose>
        </div>
        <div class="flex-1 overflow-y-auto">
          <slot />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
