<script setup lang="ts">
import { Button } from './ui/button'
import type { ReadState } from './types'

// What a read has to say before it has, or instead of, content: it is loading,
// it answered with nothing, or it failed.
//
// The three are one field because the costly mistake is drawing one as another.
// A failed read that says "nothing here" tells a person something false about
// their work; a failure that prints the service's code tells them nothing they
// can act on. So a failure here is a sentence and, when the host offers it, a way
// to try again — and there is no prop a code could be passed through.
//
// Loading and an empty answer are announced politely; a failure is announced at
// once. Only the words are in the announcement: the buttons sit outside it, so a
// reader hears what happened, not the labels of everything they could do next.
//
// Every word is the host's. A block given none draws its state and says nothing,
// because a sentence this package made up would be in the wrong language.
withDefaults(
  defineProps<{
    state: ReadState
    /** What is true, in a sentence: "Nothing has been added yet", "The list is not answering". */
    title?: string
    /** The line under it: why, or what to do. */
    text?: string
    /** The words for the button that reads again. Drawn only for a failure. */
    retryLabel?: string
    /**
     * `page`: a page's whole content, centred. `block`: inside a card, beside
     * other cards that may be fine.
     */
    size?: 'page' | 'block'
  }>(),
  { size: 'block' },
)

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div
    :data-state="state"
    :class="[
      state === 'failed'
        ? [
            'rounded-card border border-line border-l-[3px] border-l-status-blocked bg-status-blocked-bg',
            size === 'page' ? 'max-w-[640px] px-5 py-[18px]' : 'm-3 px-4 py-3.5',
          ]
        : size === 'page'
          ? 'mx-auto max-w-[640px] px-5 pb-10 pt-20 text-center'
          : 'px-4 py-6',
    ]"
  >
    <div :role="state === 'failed' ? 'alert' : 'status'">
      <p
        v-if="title"
        class="font-semibold text-ink"
        :class="
          state === 'failed'
            ? 'text-[17px]'
            : size === 'page'
              ? 'mb-2 text-[24px] tracking-[-0.01em]'
              : 'text-[14px]'
        "
      >
        {{ title }}
      </p>
      <p v-if="text" class="text-[13.5px] text-muted-strong" :class="title ? 'mt-1.5' : ''">
        {{ text }}
      </p>
    </div>

    <div
      v-if="state !== 'loading' && ((state === 'failed' && retryLabel) || $slots.actions)"
      class="flex flex-wrap gap-2.5"
      :class="[size === 'page' && state !== 'failed' ? 'mt-5 justify-center' : 'mt-3.5']"
    >
      <Button v-if="state === 'failed' && retryLabel" variant="outline" size="sm" @click="emit('retry')">
        {{ retryLabel }}
      </Button>
      <slot name="actions" />
    </div>
  </div>
</template>
