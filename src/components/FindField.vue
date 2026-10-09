<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { findMatches } from '../lib/find'
import Icon from './Icon.vue'
import { isIconName } from './icons'
import type { FindOption } from './types'

// Type a few letters, and choose from what matches: one thing, or several at once.
//
// Finding a person and finding a thing are the same act, so this is one field.
// The list it searches is the host's, already read; the field fetches nothing
// and stores nothing but what is being typed.
//
// Choosing one is a combobox: the box takes the typing, the matches open under
// it in the page's own flow, the arrow keys move through them and Enter takes
// one. Typing never chooses — the value changes only when a match is taken, and
// a box left with half a name in it goes back to the name actually chosen, so it
// never shows a choice it does not hold.
//
// Choosing several is a list of ticks under the box, filtered by it, with what is
// already ticked kept in view at the top, so a search never hides a choice made.
//
// What it refuses is the fallback the hand-built pickers had: when the list could
// not be read, they offered a box to type the key in. A key is not something a
// person knows, so here a failed list says so, and nothing is offered in its place.
const props = withDefaults(
  defineProps<{
    /** What can be found, already read and already worded. */
    options: FindOption[]
    /** The chosen key, or the chosen keys when `multiple`. */
    modelValue: string | string[]
    /** Several at once, as ticks. */
    multiple?: boolean
    /** Accessible name of the field — what is being found. */
    label: string
    placeholder?: string
    /** What is said when nothing matches what was typed. */
    noMatch: string
    /** Offers the way back to nothing chosen, in these words. One at a time only. */
    clearLabel?: string
    /** A line above the ticks, e.g. how many are not added yet. Several only. */
    summary?: string
    /** How many matches are drawn before the rest wait for more typing. */
    limit?: number
    /** What is said when more match than are drawn. */
    moreText?: string
    /** While the list is being read: what to say. */
    loading?: string
    /** When the list could not be read: what to say. Nothing is offered instead. */
    failed?: string
    /** A quiet line under the list whenever it is open — e.g. how many there are and where they are kept. */
    footer?: string
    disabled?: boolean
  }>(),
  { multiple: false, limit: 50 },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
  'update:query': [query: string]
}>()

const uid = useId()
const listId = `${uid}-list`
const footerId = `${uid}-footer`
const optionId = (i: number): string => `${uid}-option-${i}`

const chosenKeys = computed<string[]>(() =>
  Array.isArray(props.modelValue) ? props.modelValue : props.modelValue ? [props.modelValue] : [],
)
const chosenOne = computed<FindOption | undefined>(() =>
  props.multiple ? undefined : props.options.find((o) => o.key === props.modelValue),
)

const open = ref(false)
const active = ref(-1)
const query = ref(chosenOne.value?.label ?? '')

// The box shows the chosen name whenever it is not being typed in — including
// when the choice is made elsewhere, or the list arrives after the value.
watch(chosenOne, (option) => {
  if (!open.value) query.value = option?.label ?? ''
})

// After a choice the chosen name stands in the box; it is a name, not a search,
// so opening the list again shows everything rather than only itself.
const needle = computed(() =>
  chosenOne.value && query.value === chosenOne.value.label ? '' : query.value,
)

/** Whether an option's glyph is one this version can draw — only then is room kept for it. */
const drawsIcon = (option: FindOption | undefined): boolean => !!option?.icon && isIconName(option.icon)

// The chosen one's glyph stands in the box only beside its name; once something
// is typed the box holds a search, and the glyph would be claiming a choice.
const boxIcon = computed(() =>
  drawsIcon(chosenOne.value) && query.value === chosenOne.value?.label ? chosenOne.value?.icon : undefined,
)

const matches = computed(() => props.options.filter((o) => findMatches(needle.value, o.label, o.note)))
const nothingMatches = computed(() => needle.value.trim() !== '' && matches.value.length === 0)

// --- one at a time ---------------------------------------------------------

// The way back to nothing is offered while nothing is typed. Once a person is
// finding something, what they find comes first — Enter takes it, not the way back.
const entries = computed<FindOption[]>(() => {
  const shown = matches.value.slice(0, props.limit)
  const offerClear = props.clearLabel !== undefined && needle.value.trim() === ''
  return offerClear ? [{ key: '', label: props.clearLabel as string }, ...shown] : shown
})
const expanded = computed(
  () => open.value && !props.failed && !props.loading && entries.value.length > 0,
)

/** The next choosable entry in a direction, wrapping, or -1 if there is none. */
function step(from: number, delta: number): number {
  const n = entries.value.length
  for (let i = 1; i <= n; i++) {
    const at = (from + delta * i + n * n) % n
    if (!entries.value[at]?.disabled) return at
  }

  return -1
}

function openList(): void {
  if (props.disabled || props.failed) return
  open.value = true
  const at = entries.value.findIndex((e) => e.key === props.modelValue && !e.disabled)
  active.value = at >= 0 ? at : step(-1, 1)
}

function onInput(e: Event): void {
  query.value = (e.target as HTMLInputElement).value
  emit('update:query', query.value)
  if (props.multiple) return
  open.value = true
  active.value = step(-1, 1)
}

function choose(entry: FindOption | undefined): void {
  if (!entry || entry.disabled) return
  emit('update:modelValue', entry.key)
  query.value = entry.key === '' ? '' : entry.label
  open.value = false
}

function onKeydown(e: KeyboardEvent): void {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      if (!expanded.value) openList()
      else active.value = step(active.value, 1)
      break
    case 'ArrowUp':
      if (!expanded.value) return
      e.preventDefault()
      active.value = step(active.value, -1)
      break
    case 'Enter':
      if (!expanded.value || active.value < 0) return
      e.preventDefault()
      choose(entries.value[active.value])
      break
    case 'Escape':
      if (expanded.value) {
        e.preventDefault()
        open.value = false
      } else if (query.value !== '') {
        e.preventDefault()
        query.value = ''
        emit('update:query', '')
      }
      break
  }
}

function onBlur(): void {
  open.value = false
  query.value = chosenOne.value?.label ?? ''
}

// --- several at once ---------------------------------------------------------

const ticked = computed(() => props.options.filter((o) => chosenKeys.value.includes(o.key)))
const unticked = computed(() => matches.value.filter((o) => !chosenKeys.value.includes(o.key)))
const ticks = computed(() => [...ticked.value, ...unticked.value.slice(0, props.limit)])
const moreThanShown = computed(() =>
  props.multiple ? unticked.value.length > props.limit : matches.value.length > props.limit,
)

function toggle(option: FindOption): void {
  if (option.disabled) return
  const keys = chosenKeys.value
  emit(
    'update:modelValue',
    keys.includes(option.key) ? keys.filter((k) => k !== option.key) : [...keys, option.key],
  )
}

// The side padding is set per box rather than here, so the one-at-a-time box can
// open room on its left for a glyph without two paddings competing.
const box =
  'w-full max-w-[420px] rounded-[9px] border border-line bg-surface py-2 text-[13.5px] text-ink placeholder:text-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus disabled:bg-band disabled:text-muted'
</script>

<template>
  <div>
    <div v-if="!multiple" class="relative max-w-[420px]">
      <Icon
        v-if="boxIcon"
        :name="boxIcon"
        :size="16"
        class="pointer-events-none absolute left-[11px] top-1/2 -translate-y-1/2 text-muted-strong"
      />
      <input
        type="text"
        role="combobox"
        autocomplete="off"
        aria-autocomplete="list"
        :aria-label="label"
        :aria-expanded="expanded"
        :aria-controls="expanded ? listId : undefined"
        :aria-activedescendant="expanded && active >= 0 ? optionId(active) : undefined"
        :aria-describedby="expanded && footer ? footerId : undefined"
        :placeholder="placeholder"
        :value="query"
        :disabled="disabled || !!failed"
        :class="[box, 'pr-[11px]', boxIcon ? 'pl-[34px]' : 'pl-[11px]']"
        @input="onInput"
        @keydown="onKeydown"
        @focus="openList"
        @click="openList"
        @blur="onBlur"
      />
    </div>
    <input
      v-else
      type="search"
      autocomplete="off"
      :aria-label="label"
      :aria-controls="listId"
      :aria-describedby="footer && !failed && !loading ? footerId : undefined"
      :placeholder="placeholder"
      :value="query"
      :disabled="disabled || !!failed"
      :class="[box, 'px-[11px]']"
      @input="onInput"
    />

    <p v-if="failed" role="alert" class="mt-1.5 text-[12.5px] text-muted-strong">{{ failed }}</p>
    <p v-else-if="loading" role="status" class="mt-1.5 text-[12.5px] text-muted-strong">{{ loading }}</p>

    <template v-else-if="!multiple">
      <!-- In the page's flow, not floating over it: nothing can clip it, and what
           sits below simply moves down while it is open. The footer line sits in
           the same card under the options, outside the listbox: it is said, not chosen. -->
      <div
        v-if="expanded"
        class="mt-1 max-w-[420px] overflow-hidden rounded-[10px] border border-line bg-surface shadow-[0_6px_18px_rgba(0,0,0,0.06)]"
      >
        <ul :id="listId" role="listbox" :aria-label="label">
          <li
            v-for="(entry, i) in entries"
            :id="optionId(i)"
            :key="entry.key"
            role="option"
            :aria-selected="entry.key === modelValue"
            :aria-disabled="entry.disabled || undefined"
            class="border-t border-line px-3 py-2 text-[13.5px] first:border-t-0"
            :class="[
              i === active ? 'bg-band font-semibold' : '',
              entry.disabled ? 'cursor-not-allowed text-muted' : 'cursor-pointer',
            ]"
            @mousedown.prevent
            @click="choose(entry)"
          >
            <Icon v-if="entry.icon" :name="entry.icon" :size="16" class="mr-2 inline-block align-[-3px]" />
            {{ entry.label }}
            <!-- Under the name, not under the glyph: indented by the glyph and its gap. -->
            <small v-if="entry.note" class="block text-[12px] font-normal text-muted" :class="{ 'pl-6': drawsIcon(entry) }">{{ entry.note }}</small>
          </li>
        </ul>
        <p v-if="footer" :id="footerId" class="border-t border-line px-3 py-2 text-[12px] text-muted">{{ footer }}</p>
      </div>
      <p v-if="open && nothingMatches" role="status" class="mt-1.5 text-[12.5px] text-muted-strong">{{ noMatch }}</p>
      <p v-else-if="expanded && moreThanShown && moreText" class="mt-1.5 text-[12px] text-muted">{{ moreText }}</p>
    </template>

    <div
      v-else
      :id="listId"
      role="group"
      :aria-label="label"
      class="mt-3 overflow-hidden rounded-[10px] border border-line bg-surface"
    >
      <p v-if="summary" class="bg-band px-3 py-2 text-[12.5px] text-muted-strong">{{ summary }}</p>
      <label
        v-for="option in ticks"
        :key="option.key"
        class="flex items-baseline gap-2.5 border-t border-line px-3 py-[9px] text-[13.5px] first:border-t-0"
        :class="option.disabled ? 'cursor-not-allowed text-muted' : 'cursor-pointer'"
      >
        <input
          type="checkbox"
          class="accent-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
          :checked="chosenKeys.includes(option.key)"
          :disabled="option.disabled"
          @change="toggle(option)"
        />
        <Icon v-if="option.icon" :name="option.icon" :size="16" class="shrink-0 self-center" />
        {{ option.label }}
        <small v-if="option.note" class="ml-auto whitespace-nowrap text-[12px] text-muted">{{ option.note }}</small>
      </label>
      <p v-if="nothingMatches" role="status" class="border-t border-line px-3 py-2 text-[12.5px] text-muted-strong">
        {{ noMatch }}
      </p>
      <p v-else-if="moreThanShown && moreText" class="border-t border-line px-3 py-2 text-[12px] text-muted">
        {{ moreText }}
      </p>
      <p v-if="footer" :id="footerId" class="border-t border-line px-3 py-2 text-[12px] text-muted">{{ footer }}</p>
    </div>
  </div>
</template>
