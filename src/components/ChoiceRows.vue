<script setup lang="ts">
import type { ChoiceRow } from './types'

// A short list of choices, each a whole row pressed once: the person reads the
// words and takes the row, with nothing to tick first and nothing to confirm.
//
// Every row is one button, so the whole row is the target and the keyboard and a
// reader treat each as the button it is. A small arrow at the end is drawn and
// hidden from a reader. A long label wraps inside its row. While the host is
// acting on one choice (`busy`, its key), that row is marked busy and every row
// is marked unavailable and takes no press, so a second press cannot start a
// second act. The rows are not `disabled`, which would take focus away from the
// row just pressed; a reader stays where it was and hears the rows unavailable.
// The host sets `busy` on the first `choose`: two presses before it may both be told.
//
// It draws no title, no lead text and no other action: the page around it is the
// host's, and so is every word, already translated.
const props = defineProps<{
  /** The choices, in the order they are drawn. */
  items: ChoiceRow[]
  /** The list's accessible name. Already translated. */
  label: string
  /** The key of the choice the host is acting on. */
  busy?: string
}>()

const emit = defineEmits<{ choose: [key: string] }>()

function press(key: string): void {
  if (props.busy !== undefined) return
  emit('choose', key)
}

const row =
  'flex w-full items-center justify-between gap-3 rounded-[9px] border bg-surface px-3.5 py-3 text-left text-[14px] font-medium text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'
// While one is being acted on the others are dimmed and stand still; the one
// being acted on keeps its full look, with the ink border, so the page shows
// which was taken.
const idle =
  'border-line hover:border-ink/40 aria-disabled:cursor-not-allowed aria-disabled:opacity-60 aria-disabled:hover:border-line'
const taken = 'cursor-progress border-ink'
</script>

<template>
  <ul v-if="items.length" role="list" :aria-label="label" class="m-0 flex list-none flex-col gap-2.5 p-0">
    <li v-for="item in items" :key="item.key">
      <button
        type="button"
        :data-choice="item.key"
        :aria-busy="busy !== undefined && busy === item.key ? 'true' : undefined"
        :aria-disabled="busy !== undefined ? 'true' : undefined"
        :class="[row, busy !== undefined && busy === item.key ? taken : idle]"
        @click="press(item.key)"
      >
        <span class="min-w-0 break-words">{{ item.label }}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 text-faint" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </li>
  </ul>
</template>
