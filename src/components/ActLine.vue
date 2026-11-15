<script setup lang="ts">
import type { ActOutcome } from './types'

// What an act just did, or why it was refused, in a sentence of its own.
//
// Every act on a screen ends in one of two answers, and a person should
// not have to work out which from what moved on the page. So the sentence is
// said: politely when the act was done, at once when it was refused, toned by
// the outcome so the eye finds it too.
//
// The sentence is the host's — it knows which act this was and what the answer
// means, and it writes them in the person's language. The line stays until the
// host takes it away (with the next act, usually); it does not fade on a timer
// a slow reader would lose.
//
// A way on — "Open it" after something was made — goes in the `action` slot,
// beside the sentence and outside the announcement.
//
// A third answer is for what happened to the person rather than what they did:
// their access to a place ended, say. It is neither an act they finished nor a
// refusal, so it is drawn amber and announced politely, like a finished act.
defineProps<{
  outcome: ActOutcome
  /** The sentence. */
  text: string
}>()

const tone: Record<ActOutcome, string> = {
  done: 'bg-status-ontrack-bg text-status-ontrack-fg',
  refused: 'bg-status-late-bg text-status-late-fg',
  notice: 'bg-status-blocked-bg text-status-blocked-fg',
}
</script>

<template>
  <div
    :data-outcome="outcome"
    class="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-[9px] px-3 py-2 text-[13px]"
    :class="tone[outcome]"
  >
    <span :role="outcome === 'refused' ? 'alert' : 'status'">{{ text }}</span>
    <span v-if="$slots.action" class="font-semibold"><slot name="action" /></span>
  </div>
</template>
