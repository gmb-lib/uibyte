<script setup lang="ts">
import { reactive, useId } from 'vue'
import StatusPill from './StatusPill.vue'
import type { StatusRole } from '../theme/tokens'
import type { DiffColumns, DiffGroup, DiffRow } from './types'

// What a change would do, or did: titled groups of keyed rows, each with a
// status pill and the reason beside it.
//
// It judges nothing. Which rows exist, what each is called, which role tones
// it, which are folded and which are marked are all the host's answer to its
// own question, rendered — so the list reads the same whether it shows a
// preview or an outcome. The only thing it holds is which groups a reader has
// unfolded.
defineProps<{
  groups: DiffGroup[]
  /** The column headings, already translated. */
  columns: DiffColumns
}>()

const uid = useId()
const titleId = (group: DiffGroup): string => `${uid}-${group.key}-title`
const tableId = (group: DiffGroup): string => `${uid}-${group.key}-rows`

const unfolded = reactive(new Set<string>())
function toggle(group: DiffGroup) {
  if (unfolded.has(group.key)) unfolded.delete(group.key)
  else unfolded.add(group.key)
}

const hasFolded = (group: DiffGroup): boolean => group.rows.some((row) => row.folded)
const hasParts = (group: DiffGroup): boolean => group.rows.some((row) => row.part)
const visibleRows = (group: DiffGroup): DiffRow[] =>
  group.rows.filter((row) => !row.folded || unfolded.has(group.key))
// Two rows may share a key under different parts, so the part is in the identity.
const rowId = (row: DiffRow): string => `${row.part ?? ''}\u0000${row.key}`

// Written out as full literal strings so a consumer's utility scan sees every
// class this component can render.
const markedByRole: Record<StatusRole, string> = {
  ontrack: 'bg-status-ontrack-bg/40',
  blocked: 'bg-status-blocked-bg/40',
  approaching: 'bg-status-approaching-bg/40',
  late: 'bg-status-late-bg/40',
  idle: 'bg-status-idle-bg/40',
}
</script>

<template>
  <div class="space-y-[18px]">
    <section v-for="group in groups" :key="group.key" :aria-labelledby="titleId(group)">
      <h4 class="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-ink">
        <span :id="titleId(group)">{{ group.title }}</span>
        <StatusPill
          v-if="group.badge"
          :status="group.badgeStatus ?? 'idle'"
          :label="group.badge"
          size="sm"
        />
        <span
          v-if="group.summary || hasFolded(group)"
          class="font-mono text-[11px] font-medium text-muted"
        >
          <span v-if="group.summary">{{ group.summary }}</span>
          <span v-if="group.summary && hasFolded(group)" aria-hidden="true"> · </span>
          <button
            v-if="hasFolded(group)"
            type="button"
            class="underline underline-offset-2 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
            :aria-expanded="unfolded.has(group.key)"
            :aria-controls="tableId(group)"
            @click="toggle(group)"
          >
            {{ group.foldedLabel }}
          </button>
        </span>
      </h4>

      <p v-if="group.note" class="mt-1.5 text-[12.5px] text-muted-strong">{{ group.note }}</p>

      <table
        v-if="group.rows.length"
        v-show="visibleRows(group).length"
        :id="tableId(group)"
        class="mt-2 w-full border-collapse text-[13px]"
      >
        <thead>
          <tr
            class="border-b border-line text-left font-mono text-[10px] uppercase tracking-[0.12em] text-muted"
          >
            <th v-if="hasParts(group)" scope="col" class="pb-1.5 pr-2.5 font-medium">
              {{ columns.part }}
            </th>
            <th scope="col" class="pb-1.5 pr-2.5 font-medium">{{ columns.key }}</th>
            <th scope="col" class="pb-1.5 pr-2.5 font-medium">{{ columns.status }}</th>
            <th scope="col" class="pb-1.5 font-medium">{{ columns.detail }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in visibleRows(group)"
            :key="rowId(row)"
            class="border-b border-line align-top"
            :class="row.marked ? markedByRole[row.status] : ''"
            :data-marked="row.marked || undefined"
          >
            <td v-if="hasParts(group)" class="py-[7px] pr-2.5 text-[12.5px] text-muted-strong">
              {{ row.part }}
            </td>
            <td class="py-[7px] pr-2.5 font-mono text-[12px] text-ink">{{ row.key }}</td>
            <td class="py-[7px] pr-2.5">
              <StatusPill :status="row.status" :label="row.statusLabel" size="sm" />
            </td>
            <td class="py-[7px] text-[12.5px] text-muted-strong">
              <template v-if="row.detail">{{ row.detail }}</template>
              <span v-else aria-hidden="true">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
