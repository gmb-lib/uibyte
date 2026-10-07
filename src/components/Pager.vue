<script setup lang="ts">
import { computed } from 'vue'

// Which page of a long list this is, and the way to the others.
//
// The words that say where you are — "1–25 of 138" — are the host's: counting
// and the shape of a range are a language's business, not the kit's. What the
// pager owns is the way through: previous and next, the first and last pages,
// the pages either side of this one, and a gap drawn where pages are left out,
// so a list of 29 pages never becomes a row of 29 buttons.
//
// It sits in a navigation landmark of its own name, the current page is
// announced as current, and the page size and the total stay the host's — it
// only says which page was asked for.
const props = defineProps<{
  /** The page shown, counting from 1. */
  page: number
  /** How many pages there are. */
  pages: number
  /** Where this page sits, in the host's words: "1–25 of 138". */
  range: string
  /** Accessible name of the pager. */
  label: string
  previousLabel: string
  nextLabel: string
  /** A page number's accessible name: n => "Page 3". */
  pageLabel: (n: number) => string
}>()

const emit = defineEmits<{ 'update:page': [page: number] }>()

/** The page numbers to draw, with `0` where pages are left out. */
const numbers = computed<number[]>(() => {
  const keep = new Set([1, props.pages, props.page - 1, props.page, props.page + 1])
  const sorted = [...keep].filter((n) => n >= 1 && n <= props.pages).sort((a, b) => a - b)
  const out: number[] = []
  for (const n of sorted) {
    const last = out[out.length - 1]
    if (last !== undefined && n - last > 1) out.push(0)
    out.push(n)
  }

  return out
})

function go(n: number): void {
  if (n < 1 || n > props.pages || n === props.page) return
  emit('update:page', n)
}

const step =
  'inline-flex min-w-[30px] items-center justify-center rounded-chip border px-[9px] py-[3px] font-mono text-[12px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-40'
</script>

<template>
  <nav
    :aria-label="label"
    class="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-band px-[18px] py-3 text-[13px] text-muted-strong"
  >
    <span>{{ range }}</span>
    <span v-if="pages > 1" class="flex flex-wrap items-center gap-1.5">
      <button type="button" :class="step" class="border-line bg-surface text-ink" :aria-label="previousLabel" :disabled="page <= 1" @click="go(page - 1)">
        <span aria-hidden="true">‹</span>
      </button>
      <template v-for="(n, i) in numbers" :key="n === 0 ? `gap-${i}` : n">
        <span v-if="n === 0" aria-hidden="true" class="px-1 text-muted">…</span>
        <button
          v-else
          type="button"
          :class="[step, n === page ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink']"
          :aria-label="pageLabel(n)"
          :aria-current="n === page ? 'page' : undefined"
          @click="go(n)"
        >
          {{ n }}
        </button>
      </template>
      <button type="button" :class="step" class="border-line bg-surface text-ink" :aria-label="nextLabel" :disabled="page >= pages" @click="go(page + 1)">
        <span aria-hidden="true">›</span>
      </button>
    </span>
  </nav>
</template>
