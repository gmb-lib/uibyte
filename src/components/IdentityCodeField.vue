<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import {
  collapsedInput,
  identityCodePattern,
  parseIdentityCode,
  type IdentityCodeError,
  type IdentityCodeResult,
} from '../lib/identity-code'
import Icon from './Icon.vue'
import type { CountryGroup } from './types'

// A person's identity code, with the country that issued it chosen beside it.
//
// The two are one value — the same digits in two countries are two people — so they are
// drawn as one field: the choice, then the box, in a single frame that takes the focus
// ring for both. The countries are the host's, already named in the reader's language;
// so is every sentence. The field knows the rule, not the words.
//
// What is typed is read when the person is done with it: on leaving the box, on Enter
// (which settles the box and does not send the form around it), and when the country
// changes. A code that can be used is rewritten the one way it will be read back — a
// personal number as its country writes it, the country left to the choice — and a code
// that names its own country moves the choice there when that country is offered. When
// it is not offered, the box keeps the whole code, country and all: dropping the country
// would leave bare digits that read as somebody else's code beside the chosen one.
//
// A code that cannot be used is refused at once, in the host's sentence, under the field
// — announced, marked on the box and in the frame's colour, but carried by the words, so
// colour is never the only cue. Typing again takes the sentence away: a reason about
// what was typed a moment ago is worse than none. An empty box says nothing.
//
// Whether the code is required, and what is sent, is the host's: it reads the same answer
// with `parseIdentityCode` itself.
const props = defineProps<{
  /** What is typed in the box (`v-model`). */
  modelValue: string
  /** The chosen country's two-letter code (`v-model:country`). */
  country: string
  /** The countries offered, in groups. A group with a label is drawn under its heading. */
  countries: CountryGroup[]
  /** Accessible name of the box. */
  label: string
  /** Accessible name of the country's choice. */
  countryLabel: string
  /**
   * The sentence for a refusal, given why and a country: the one whose format refused the
   * code — the code's own, when it names one — or else the one it was read beside.
   */
  describe: (error: IdentityCodeError, country: string) => string
  /** A line drawn once a usable code is settled. Without it, none is drawn. */
  settled?: string
  /** A quiet line under the field — e.g. why the code is asked. The box is described by it. */
  note?: string
  /** What the empty box shows, in the text face. By default, the chosen country's pattern where it is known, in the code face. */
  placeholder?: string
  disabled?: boolean
  /** The box's id, so a visible label of the host's can point at it. */
  id?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:country': [country: string]
}>()

const uid = useId()
const errorId = `${uid}-error`
const noteId = `${uid}-note`

// What the field said when it last settled, the value it said it about, and the country
// that value was read beside.
interface Said {
  about: string
  country: string
  result: IdentityCodeResult
}
const said = ref<Said | null>(null)

const refusal = computed<IdentityCodeError | null>(() =>
  said.value && !said.value.result.ok ? said.value.result : null,
)
const usable = computed(() => said.value?.result.ok === true)
// The country the sentence names is the one whose format refused the code — the code's own
// when it names one — so a code naming Estonia is never explained by Latvia's rule.
const sentence = computed(() =>
  refusal.value && said.value
    ? props.describe(refusal.value, refusal.value.country ?? said.value.country)
    : '',
)

const shownPlaceholder = computed(() => props.placeholder ?? identityCodePattern(props.country))

// The refusal first — it is about what is in the box now — then the note, which always is.
const describedBy = computed(
  () => [refusal.value ? errorId : '', props.note ? noteId : ''].filter(Boolean).join(' ') || undefined,
)

/** The host's own spelling of a country it offers, or undefined when it offers no such country. */
function offered(country: string): string | undefined {
  for (const group of props.countries) {
    for (const option of group.countries) {
      if (option.code.toUpperCase() === country) return option.code
    }
  }

  return undefined
}

function settle(country: string): void {
  const typed = props.modelValue ?? ''
  if (!typed.trim()) {
    said.value = null
    return
  }

  const result = parseIdentityCode(typed, country)
  if (!result.ok) {
    said.value = { about: typed, country, result }
    return
  }

  // The choice follows the code's own country when it is offered. When it is not, the
  // choice stays, and the box keeps the country instead.
  const own = offered(result.code.country)
  const beside = own ?? country
  if (own !== undefined && own !== country) emit('update:country', own)
  const shown = collapsedInput(result.code, beside)
  said.value = { about: shown, country: beside, result }
  if (shown !== typed) emit('update:modelValue', shown)
}

function onInput(e: Event): void {
  said.value = null
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

function onCountry(e: Event): void {
  const chosen = (e.target as HTMLSelectElement).value
  emit('update:country', chosen)
  settle(chosen)
}

// A value the host replaces — a form emptied once it is sent, say — takes what was said
// about the old one with it.
watch(
  () => props.modelValue,
  (now) => {
    if (said.value && now !== said.value.about) said.value = null
  },
)
</script>

<template>
  <div class="max-w-[420px]">
    <!-- One frame for the pair: neither half names a person on its own. The choice is
         capped near half the frame, so a long country name narrows before the code does. -->
    <div
      class="flex items-stretch overflow-hidden rounded-[9px] border bg-surface focus-within:outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-focus"
      :class="refusal ? 'border-status-late' : 'border-line'"
    >
      <span class="relative flex min-w-0 max-w-[50%] items-stretch border-r" :class="refusal ? 'border-status-late' : 'border-line'">
        <select
          :value="country"
          :aria-label="countryLabel"
          :disabled="disabled"
          class="w-full min-w-0 cursor-pointer appearance-none truncate bg-band py-2 pl-[11px] pr-7 text-[13.5px] text-ink focus-visible:outline-none disabled:cursor-not-allowed disabled:text-muted"
          @change="onCountry"
        >
          <template v-for="group in countries" :key="group.key">
            <optgroup v-if="group.label" :label="group.label">
              <option v-for="option in group.countries" :key="option.code" :value="option.code">{{ option.label }}</option>
            </optgroup>
            <template v-else>
              <option v-for="option in group.countries" :key="option.code" :value="option.code">{{ option.label }}</option>
            </template>
          </template>
        </select>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          aria-hidden="true"
          class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
        >
          <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      <input
        :id="id"
        type="text"
        autocomplete="off"
        spellcheck="false"
        :value="modelValue"
        :aria-label="label"
        :aria-invalid="refusal ? true : undefined"
        :aria-describedby="describedBy"
        :placeholder="shownPlaceholder || undefined"
        :disabled="disabled"
        class="min-w-0 flex-1 bg-transparent px-[11px] py-2 font-mono text-[13.5px] text-ink placeholder:text-faint focus-visible:outline-none disabled:bg-band disabled:text-muted"
        :class="{ 'placeholder:font-sans': placeholder !== undefined && placeholder !== '' }"
        @input="onInput"
        @blur="settle(country)"
        @keydown.enter.prevent="settle(country)"
      />
    </div>

    <p v-if="refusal" :id="errorId" role="alert" class="mt-1.5 text-[12.5px] text-status-late-fg">{{ sentence }}</p>
    <p v-else-if="usable && settled" class="mt-1.5 flex items-start gap-1.5 text-[12.5px] text-status-ontrack-fg">
      <Icon name="check" :size="14" class="mt-px shrink-0" />{{ settled }}
    </p>
    <p v-if="note" :id="noteId" class="mt-1.5 text-[12.5px] text-muted-strong">{{ note }}</p>
  </div>
</template>
