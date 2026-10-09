<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui'
import type { MenuItem } from './types'

// A button that opens a short list of choices.
//
// The behaviour is the platform's menu pattern and comes from the primitive
// underneath: the arrow keys move through the choices, Enter or Space takes one,
// Escape closes it, and focus goes back to the button either way. The list opens
// on the page's body, not inside whatever box the button sits in, so a page that
// is its own size container cannot clip it.
//
// Given `modelValue`, the menu is a choice among options and says which one is
// chosen — marked for the eye with a check, and announced as checked. Without
// it, the menu is a list of acts and says only which was picked.
//
// A page that draws one menu per row draws the same words on every button, so
// a reader, or someone driving the page by voice, cannot tell them apart. Given
// `about` — what this one acts on — the button is named by its own words and
// then that, the visible words first so the name still contains what is seen.
// Nothing on screen changes.
//
// The words on the button, the choices and their order are the host's.
const props = withDefaults(
  defineProps<{
    /** The button's words. */
    label: string
    items: MenuItem[]
    /** The chosen key, when the menu is a choice among options. */
    modelValue?: string
    /** Which edge of the button the list lines up with. */
    align?: 'start' | 'end'
    /** The language of the button's words, when it differs from the page's. */
    lang?: string
    /** What the button acts on, added to its name after its words: "Move to… — Quarterly report". */
    about?: string
  }>(),
  { modelValue: undefined, align: 'end', lang: undefined, about: undefined },
)

const emit = defineEmits<{ select: [key: string]; 'update:modelValue': [key: string] }>()

function choose(key: string): void {
  emit('select', key)
  if (props.modelValue !== undefined && key !== props.modelValue) emit('update:modelValue', key)
}

const item =
  'flex cursor-pointer select-none items-center justify-between gap-3 rounded-[8px] px-2.5 py-[7px] text-[13px] text-ink outline-none data-[highlighted]:bg-band focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus data-[disabled]:cursor-not-allowed data-[disabled]:text-muted'
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger
      :aria-label="about ? `${label} — ${about}` : undefined"
      class="inline-flex items-center gap-[7px] rounded-pill border border-line bg-surface px-3 py-[5px] text-[12.5px] text-ink hover:border-ink/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <slot name="before" />
      <span :lang="lang">{{ label }}</span>
      <span aria-hidden="true" class="text-muted">▾</span>
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent
        :align="align"
        :side-offset="6"
        class="z-50 flex min-w-[190px] flex-col rounded-[12px] border border-line bg-surface p-1.5 shadow-[0_14px_38px_rgba(22,24,27,0.13)]"
      >
        <DropdownMenuRadioGroup v-if="modelValue !== undefined" :model-value="modelValue">
          <DropdownMenuRadioItem
            v-for="option in items"
            :key="option.key"
            :value="option.key"
            :disabled="option.disabled"
            :lang="option.lang"
            :class="[item, option.key === modelValue ? 'bg-band font-semibold' : '']"
            @select="choose(option.key)"
          >
            {{ option.label }}
            <span v-if="option.key === modelValue" aria-hidden="true" class="text-status-ontrack-fg">✓</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <template v-else>
          <DropdownMenuItem
            v-for="option in items"
            :key="option.key"
            :disabled="option.disabled"
            :lang="option.lang"
            :class="item"
            @select="choose(option.key)"
          >
            {{ option.label }}
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
