<script setup lang="ts">
import type { StatusRole } from '../theme/tokens'
import type { PillLook } from './types'

// A status, rendered as colour *and* a mark *and* a text label. Never colour
// alone: the label is what carries the meaning for everyone, and the mark is
// what carries it for a reader who cannot separate the hues. Neither is
// optional, which is why neither is a prop.
//
// The colours come from the role's derived set, so a host that repoints the
// role still gets a readable pill in every look.
//
// The look is volume, never meaning: `soft` is the default pair, `solid` is
// the loud form (one loudest thing on a row), `outline` is the quiet form.
// The role-distinct glyph belongs to soft and solid; outline's mark is a
// filled dot in the role colour, and its status is carried by the label plus
// the look's own structure.
const props = withDefaults(
  defineProps<{
    status: StatusRole
    label: string
    size?: 'default' | 'sm'
    look?: PillLook
  }>(),
  { size: 'default', look: 'soft' },
)

// Written out as full literal strings so a consumer's utility scan sees every
// class this component can render.
const softByRole: Record<StatusRole, string> = {
  ontrack: 'bg-status-ontrack-bg text-status-ontrack-fg',
  blocked: 'bg-status-blocked-bg text-status-blocked-fg',
  approaching: 'bg-status-approaching-bg text-status-approaching-fg',
  late: 'bg-status-late-bg text-status-late-fg',
  idle: 'bg-status-idle-bg text-status-idle-fg',
}

const solidByRole: Record<StatusRole, string> = {
  ontrack: 'bg-status-ontrack-solid-bg text-status-ontrack-solid-fg',
  blocked: 'bg-status-blocked-solid-bg text-status-blocked-solid-fg',
  approaching: 'bg-status-approaching-solid-bg text-status-approaching-solid-fg',
  late: 'bg-status-late-solid-bg text-status-late-solid-fg',
  idle: 'bg-status-idle-solid-bg text-status-idle-solid-fg',
}

const dotByRole: Record<StatusRole, string> = {
  ontrack: 'bg-status-ontrack',
  blocked: 'bg-status-blocked',
  approaching: 'bg-status-approaching',
  late: 'bg-status-late',
  idle: 'bg-status-idle',
}

const lookClass = (): string => {
  if (props.look === 'solid') return solidByRole[props.status]
  if (props.look === 'outline') return 'bg-surface text-ink border border-line'
  return softByRole[props.status]
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-pill font-medium"
    :class="[
      size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[12px]',
      lookClass(),
    ]"
  >
    <span
      v-if="look === 'outline'"
      class="h-[7px] w-[7px] shrink-0 rounded-pill"
      :class="dotByRole[status]"
      aria-hidden="true"
    />
    <svg
      v-else
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.4"
      aria-hidden="true"
      class="shrink-0"
    >
      <!-- One glyph per role, so two roles sharing a hue stay distinguishable. -->
      <path
        v-if="status === 'ontrack'"
        d="M5 13l4 4L19 7"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <template v-else-if="status === 'blocked'">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M6 18 18 6" stroke-linecap="round" />
      </template>
      <template v-else-if="status === 'approaching'">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" stroke-linecap="round" stroke-linejoin="round" />
      </template>
      <template v-else-if="status === 'late'">
        <path d="M12 4.5 21 19.5H3z" stroke-linejoin="round" />
        <path d="M12 10v3.5M12 16.6v.2" stroke-linecap="round" />
      </template>
      <circle v-else cx="12" cy="12" r="4.5" fill="currentColor" stroke="none" />
    </svg>
    {{ label }}
  </span>
</template>
