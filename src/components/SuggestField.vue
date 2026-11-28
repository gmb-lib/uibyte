<script setup lang="ts">
import { computed, ref, useAttrs, useId, watch } from 'vue'
import { cn } from '../lib/cn'
import { fieldBorder } from './fieldBox'
import type { SuggestMatch } from './types'

// A text box whose typed text is its value, and which proposes matches under it as it is typed.
//
// It is for a name a person may write freely while the host offers entries it already holds:
// typing never changes into anything, so `v-model` is exactly what was typed and only a person
// taking a match makes the host do more. Taking one emits `take` with the match and leaves the
// text alone; what the row becomes is the host's decision.
//
// The matches are the host's, already filtered, worded and ordered; the field filters and sorts
// nothing. They open under the box in the page's own flow, so nothing can clip them and what sits
// below simply moves down while they are open. The `footer` slot is one quiet line under them.
//
// It is a combobox with a list popup (list autocomplete): the arrow keys move a highlight, Enter
// takes the highlighted one and does nothing when none is highlighted (a form's own Enter is not
// blocked), Escape closes the list and keeps the text and the focus, Tab leaves without taking.
//
// A `fixed` leading part is drawn shaded at the start of the box, so the two read as one box. It
// is not editable and not part of the value. Backspace with the caret at the very start, or a
// press on it, only says so with `release-fixed`; the host decides what that means. While it is
// set nothing is proposed.
//
// The box always has a name: `label` is drawn above it, or the host draws its own label and gives
// `ariaLabel`. Words, here, are all the host's, finished and translated.
//
// Class and style land on the outer element; every other attribute lands on the input.
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  /** The text typed (`v-model`). Exactly what was typed, never a match. */
  modelValue: string
  /** What to propose, already filtered, worded and ordered. Shown while there is typed text. */
  matches: SuggestMatch[]
  /** A visible label drawn above the box. */
  label?: string
  /** The box's accessible name, when the host draws its own label. */
  ariaLabel?: string
  placeholder?: string
  /** A leading part drawn shaded at the start of the box: not editable, not in `modelValue`. */
  fixed?: string
  /** A quiet line under the box that the box is described by. */
  hint?: string
  /** Marks the box invalid (colour and `aria-invalid`). */
  invalid?: boolean
  /** Why it is invalid, said under the box and announced. Implies `invalid`. */
  error?: string
  disabled?: boolean
  /** The id of the input, so a host's own `<label for>` reaches it. */
  id?: string
  name?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  /** A match was taken (pressed, or Enter on the highlighted one). The text is left as it was. */
  take: [match: SuggestMatch]
  /** The fixed part was pressed, or Backspace was pressed at the very start of the box. */
  'release-fixed': [fixed: string]
}>()

const attrs = useAttrs()
const uid = useId()
const inputId = computed(() => props.id ?? `${uid}-input`)
const listId = `${uid}-list`
const hintId = `${uid}-hint`
const errorId = `${uid}-error`
const fixedId = `${uid}-fixed`
const optionId = (i: number): string => `${uid}-option-${i}`

// `open` is a person's wish for the list (closed by Escape, a take or blur, reopened by typing);
// whether it is drawn also needs a value, matches and no fixed part.
const open = ref(false)
const active = ref(-1)

const expanded = computed(
  () => open.value && !props.fixed && props.modelValue !== '' && props.matches.length > 0,
)

// A new list is a new set of positions: never leave the highlight on something else.
watch(
  () => props.matches,
  () => {
    active.value = -1
  },
)

const isInvalid = computed(() => props.invalid === true || !!props.error)
const describedBy = computed(() => {
  const ids = [
    props.error ? errorId : '',
    props.hint ? hintId : '',
    props.fixed ? fixedId : '',
  ].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
})
const rest = computed(() => {
  const { class: _c, style: _s, ...others } = attrs
  return others
})
const rootClass = computed(() => cn('w-full max-w-[420px]', attrs.class as string | undefined))

function onFocus(): void {
  open.value = true
}

function onBlur(): void {
  open.value = false
  active.value = -1
}

function onInput(e: Event): void {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
  open.value = true
  active.value = -1
}

function take(match: SuggestMatch | undefined): void {
  if (!match) return
  emit('take', match)
  open.value = false
  active.value = -1
}

function step(delta: number): void {
  const n = props.matches.length
  active.value = active.value < 0 ? (delta > 0 ? 0 : n - 1) : (active.value + delta + n) % n
}

function onKeydown(e: KeyboardEvent): void {
  switch (e.key) {
    case 'ArrowDown':
    case 'ArrowUp':
      if (props.fixed || props.modelValue === '' || props.matches.length === 0) return
      e.preventDefault()
      if (!expanded.value) {
        open.value = true
        return
      }
      step(e.key === 'ArrowDown' ? 1 : -1)
      break
    case 'Enter':
      if (!expanded.value || active.value < 0) return
      e.preventDefault()
      take(props.matches[active.value])
      break
    case 'Escape':
      if (!expanded.value) return
      e.preventDefault()
      open.value = false
      active.value = -1
      break
    case 'Backspace': {
      if (!props.fixed) return
      const box = e.target as HTMLInputElement
      if (box.selectionStart !== 0 || box.selectionEnd !== 0) return
      e.preventDefault()
      emit('release-fixed', props.fixed)
      break
    }
  }
}

const shell =
  'flex w-full flex-wrap overflow-hidden rounded-[9px] border bg-surface focus-within:outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-focus'
const inputClass =
  'min-w-[8rem] flex-[1_1_8rem] bg-transparent px-[11px] py-2 text-[13.5px] text-ink outline-none placeholder:text-faint disabled:cursor-not-allowed disabled:text-muted'
</script>

<template>
  <div :class="rootClass" :style="attrs.style as string | undefined">
    <label v-if="label" :for="inputId" class="mb-1 block text-[13px] text-muted-strong">{{ label }}</label>
    <div :class="[shell, fieldBorder(isInvalid), disabled ? 'bg-band' : '']">
      <!-- Not focusable: the keyboard's way to the same act is Backspace at the start of the box. -->
      <span
        v-if="fixed"
        :id="fixedId"
        data-fixed
        class="max-w-full cursor-pointer break-words border-r border-line bg-band px-[11px] py-2 text-[13.5px] text-muted-strong"
        @mousedown.prevent
        @click="emit('release-fixed', fixed)"
      >{{ fixed }}</span>
      <input
        v-bind="rest"
        :id="inputId"
        type="text"
        role="combobox"
        autocomplete="off"
        aria-autocomplete="list"
        :value="modelValue"
        :name="name"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-label="label ? undefined : ariaLabel"
        :aria-expanded="expanded"
        :aria-controls="expanded ? listId : undefined"
        :aria-activedescendant="expanded && active >= 0 ? optionId(active) : undefined"
        :aria-invalid="isInvalid ? true : undefined"
        :aria-describedby="describedBy"
        :class="inputClass"
        @input="onInput"
        @keydown="onKeydown"
        @focus="onFocus"
        @blur="onBlur"
      />
    </div>

    <!-- In the page's flow, not floating over it. The footer sits in the same card under the
         options, outside the listbox: it is said, not chosen. -->
    <div
      v-if="expanded"
      class="mt-1 overflow-hidden rounded-[10px] border border-line bg-surface shadow-[0_6px_18px_rgba(0,0,0,0.06)]"
    >
      <ul :id="listId" role="listbox" :aria-label="label ?? ariaLabel">
        <li
          v-for="(match, i) in matches"
          :id="optionId(i)"
          :key="match.id"
          role="option"
          :aria-selected="i === active"
          class="cursor-pointer border-t border-line px-3 py-2 text-[13.5px] first:border-t-0"
          :class="i === active ? 'bg-band' : ''"
          @mousedown.prevent
          @click="take(match)"
        >
          {{ match.label }}
          <small v-if="match.hint" class="block text-[12px] font-normal text-muted">{{ match.hint }}</small>
        </li>
      </ul>
      <p v-if="$slots.footer" class="border-t border-line px-3 py-2 text-[12px] text-muted">
        <slot name="footer" />
      </p>
    </div>

    <p v-if="error" :id="errorId" role="alert" class="mt-1.5 text-[12.5px] text-status-late-fg">{{ error }}</p>
    <p v-if="hint" :id="hintId" class="mt-1.5 text-[12.5px] text-muted-strong">{{ hint }}</p>
  </div>
</template>
