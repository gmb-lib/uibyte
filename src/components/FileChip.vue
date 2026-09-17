<script setup lang="ts">
import { computed } from 'vue'
import type { StatusRole } from '../theme/tokens'

// A file, described: the mark its own name implies, the name, a line of facts
// about it, and an optional badge.
//
// Everything it draws is handed to it already finished. This package does no
// formatting and no translation, so a size, a person and a date arrive as
// strings in `meta` and are only joined here. That is also what lets one chip
// serve a host that shows "PDF · 1.8 MB" and a host that shows
// "1.8 MB · who · when" — the parts and their order belong to the host.
//
// The badge is a string, never a state. Whatever it reflects is read by the
// host at the moment it draws, so this component stores nothing, derives
// nothing and asks no one — it paints the words it is given, in a role colour
// that is guaranteed to read on its own background.
const props = withDefaults(
  defineProps<{
    /** The file's name, shown as-is and truncated when there is no room. */
    name: string
    /**
     * Facts about the file, already formatted and already translated, drawn in
     * the given order and separated for the eye only.
     */
    meta?: string[]
    /** Short affirmative text, e.g. a state the host has just read. Optional. */
    badge?: string
    /** Which role colours the badge. Volume and tone only; the words carry the meaning. */
    badgeStatus?: StatusRole
  }>(),
  { meta: () => [], badge: undefined, badgeStatus: 'ontrack' },
)

// The mark's letters come from the name rather than from a media type, because
// the name is what a person recognises the file by. A suffix longer than five
// characters is not a suffix, so the mark stays empty rather than inventing one.
const mark = computed<string>(() => {
  const dot = props.name.lastIndexOf('.')
  if (dot <= 0 || dot === props.name.length - 1) return ''
  const suffix = props.name.slice(dot + 1)
  return /^[a-z0-9]{1,5}$/i.test(suffix) ? suffix.toUpperCase() : ''
})

// Written out as full literal strings so a consumer's utility scan sees every
// class this component can render.
const badgeByRole: Record<StatusRole, string> = {
  ontrack: 'text-status-ontrack-fg',
  blocked: 'text-status-blocked-fg',
  approaching: 'text-status-approaching-fg',
  late: 'text-status-late-fg',
  idle: 'text-status-idle-fg',
}
</script>

<template>
  <span
    class="inline-flex max-w-full items-center gap-2.5 rounded-btn border border-line bg-surface px-3 py-2 text-[13px]"
  >
    <!-- The mark only repeats what the name already ends with, so it is
         decoration and is kept away from assistive technology. The radius is a
         shape of this mark, not a corner anything else is measured by. -->
    <span
      class="grid h-8 w-[26px] shrink-0 items-end justify-center rounded-[3px] border border-line bg-band pb-[3px]"
      aria-hidden="true"
    >
      <span class="font-mono text-[8px] uppercase leading-none tracking-[0.06em] text-muted">{{
        mark
      }}</span>
    </span>

    <span class="min-w-0">
      <span class="block truncate font-medium text-ink">{{ name }}</span>

      <span v-if="meta.length" class="block truncate font-mono text-[10.5px] text-muted">
        <template v-for="(part, i) in meta" :key="i"
          ><span v-if="i > 0" aria-hidden="true"> · </span><span>{{ part }}</span></template
        >
      </span>

      <span
        v-if="badge"
        class="block text-[11px] font-semibold"
        :class="badgeByRole[badgeStatus]"
        >{{ badge }}</span
      >
    </span>

    <!-- Whatever the host puts here owns its own accessible name and its own
         focus ring; this package does not decide what a file can be done to. -->
    <span v-if="$slots.action" class="shrink-0">
      <slot name="action" />
    </span>
  </span>
</template>
