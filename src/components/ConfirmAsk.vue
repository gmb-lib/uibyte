<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { Button } from './ui/button'

// An act asked about first, in the place it was asked for — never in a window
// over the page.
//
// It says what is about to happen and whether it can be undone, and offers two
// answers in the host's words: do it, or keep things as they are. Where the act
// cannot be taken back it wears the danger look, so the one irreversible button
// on the screen is never mistaken for an ordinary one.
//
// Focus is the part a hand-drawn ask gets wrong. The ask takes focus when it
// appears — on the answer that changes nothing, so a stray Enter is harmless —
// and when it goes away, focus goes back to whatever opened it, rather than to
// the top of the page. Escape is the same as keeping things as they are.
//
// Whether an act needs asking is not decided here: the host shows this when it
// wants the question asked.
const props = withDefaults(
  defineProps<{
    /** The question: "Take Anna off this list?" */
    question: string
    /** What it does, and whether it can be undone. */
    detail?: string
    /** The words of the act. */
    confirmLabel: string
    /** The words of not doing it. */
    keepLabel: string
    /** The act cannot be undone: its button wears the danger look. */
    danger?: boolean
    /** While the act is under way: both answers wait. */
    busy?: boolean
  }>(),
  { danger: false, busy: false },
)

const emit = defineEmits<{ confirm: []; keep: [] }>()

const uid = useId()
const questionId = `${uid}-question`
const detailId = `${uid}-detail`

const root = ref<HTMLElement | null>(null)
const keepButton = ref<{ $el: HTMLElement } | null>(null)
let opener: HTMLElement | null = null

onMounted(() => {
  const was = document.activeElement
  opener = was instanceof HTMLElement && was !== document.body ? was : null
  keepButton.value?.$el.focus()
})

onBeforeUnmount(() => {
  // Only take focus back if it is still ours to give: inside the ask that is
  // going away, or nowhere at all. If the person has moved on, leave them there.
  const now = document.activeElement
  const ours = !now || now === document.body || (root.value?.contains(now) ?? false)
  if (ours && opener?.isConnected) opener.focus()
})

function onKeydown(e: KeyboardEvent): void {
  if (e.key !== 'Escape' || props.busy) return
  e.preventDefault()
  emit('keep')
}
</script>

<template>
  <div
    ref="root"
    role="group"
    :aria-labelledby="questionId"
    :aria-describedby="detail ? detailId : undefined"
    class="flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-[9px] border border-status-late-border bg-status-late-bg px-3 py-[9px] text-[13px] text-ink"
    @keydown="onKeydown"
  >
    <div class="min-w-0 flex-[1_1_16rem]">
      <p :id="questionId" class="font-semibold">{{ question }}</p>
      <p v-if="detail" :id="detailId" class="mt-0.5 text-muted-strong">{{ detail }}</p>
    </div>
    <div class="flex flex-wrap gap-2.5">
      <Button :variant="danger ? 'danger' : 'default'" size="sm" :disabled="busy" @click="emit('confirm')">
        {{ confirmLabel }}
      </Button>
      <Button ref="keepButton" variant="outline" size="sm" :disabled="busy" @click="emit('keep')">
        {{ keepLabel }}
      </Button>
    </div>
  </div>
</template>
