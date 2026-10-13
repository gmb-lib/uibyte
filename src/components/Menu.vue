<script setup lang="ts">
import { computed } from 'vue'
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
// Where it sits is the host's to say. A menu at the foot of a column opens
// upward (`side`); one on the dark application menu draws its button for that
// surface (`tone`), its focus ring included, while the list it opens stays the
// light list every menu opens; one that spans its column (`block`) gives its
// words the room between whatever leads and the arrow, and opens a list at
// least as wide as itself.
//
// An item's `note` is a short word after its words — the one everyone has, say.
// It is in the page's language, so when an item carries one, the item's own
// language marks its words alone and the note is read as the page is. It is
// part of the item's name, after a space that keeps the two apart when heard.
// An item without a note is drawn exactly as it always was.
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
    /** Which side of the button the list opens on. With no room there, it opens on the other. */
    side?: 'bottom' | 'top'
    /** The surface the button sits on: a page's light surface, or the dark application menu. */
    tone?: 'surface' | 'console'
    /** The button takes the full width of its container. */
    block?: boolean
  }>(),
  { modelValue: undefined, align: 'end', lang: undefined, about: undefined, side: 'bottom', tone: 'surface', block: false },
)

const emit = defineEmits<{ select: [key: string]; 'update:modelValue': [key: string] }>()

function choose(key: string): void {
  emit('select', key)
  if (props.modelValue !== undefined && key !== props.modelValue) emit('update:modelValue', key)
}

// The two surfaces a button is drawn for. On the dark one the button has no fill
// of its own until it is pointed at or open, and wears the ring made for the dark
// surface — the page's ring all but disappears there.
const tones = {
  surface: {
    face: 'border-line bg-surface',
    words: 'text-ink hover:border-ink/40',
    ring: 'focus-visible:outline-focus',
    arrow: 'text-muted',
  },
  console: {
    face: 'border-console-line bg-transparent',
    words:
      'text-console-text hover:bg-white/[0.07] data-[state=open]:bg-white/[0.07] data-[state=open]:outline data-[state=open]:outline-white/20',
    ring: 'focus-visible:outline-console-focus',
    arrow: 'text-console-muted',
  },
} as const

const tone = computed(() => tones[props.tone])
// Bound as a whole so a button that is not spread wide draws its words with no
// class attribute at all, as it always has.
const words = computed(() =>
  props.block ? { lang: props.lang, class: 'min-w-0 flex-1 text-left' } : { lang: props.lang },
)
const button = computed(
  () =>
    `${props.block ? 'flex w-full' : 'inline-flex'} items-center gap-[7px] rounded-pill border ${tone.value.face} px-3 py-[5px] text-[12.5px] ${tone.value.words} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${tone.value.ring}`,
)
const content = computed(
  () =>
    `z-50 flex ${props.block ? 'min-w-[max(190px,var(--reka-dropdown-menu-trigger-width))]' : 'min-w-[190px]'} flex-col rounded-[12px] border border-line bg-surface p-1.5 shadow-[0_14px_38px_rgba(22,24,27,0.13)]`,
)

const item =
  'flex cursor-pointer select-none items-center justify-between gap-3 rounded-[8px] px-2.5 py-[7px] text-[13px] text-ink outline-none data-[highlighted]:bg-band focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus data-[disabled]:cursor-not-allowed data-[disabled]:text-muted'
const note = 'ml-auto whitespace-nowrap pl-2.5 font-mono text-[11px] font-normal text-muted'
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger :aria-label="about ? `${label} — ${about}` : undefined" :class="button">
      <slot name="before" />
      <span v-bind="words">{{ label }}</span>
      <span aria-hidden="true" :class="tone.arrow">▾</span>
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent :align="align" :side="side" :side-offset="6" :class="content">
        <DropdownMenuRadioGroup v-if="modelValue !== undefined" :model-value="modelValue">
          <DropdownMenuRadioItem
            v-for="option in items"
            :key="option.key"
            :value="option.key"
            :disabled="option.disabled"
            :lang="option.note ? undefined : option.lang"
            :class="[item, option.key === modelValue ? 'bg-band font-semibold' : '']"
            @select="choose(option.key)"
          >
            <template v-if="option.note">
              <span :lang="option.lang">{{ option.label }}</span>{{ ' ' }}<span :class="note">{{ option.note }}</span>
              <span v-if="option.key === modelValue" aria-hidden="true" class="text-status-ontrack-fg">✓</span>
            </template>
            <template v-else>
              {{ option.label }}
              <span v-if="option.key === modelValue" aria-hidden="true" class="text-status-ontrack-fg">✓</span>
            </template>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <template v-else>
          <DropdownMenuItem
            v-for="option in items"
            :key="option.key"
            :disabled="option.disabled"
            :lang="option.note ? undefined : option.lang"
            :class="item"
            @select="choose(option.key)"
          >
            <template v-if="option.note">
              <span :lang="option.lang">{{ option.label }}</span>{{ ' ' }}<span :class="note">{{ option.note }}</span>
            </template>
            <template v-else>{{ option.label }}</template>
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
