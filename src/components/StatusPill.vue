<script setup lang="ts">
import type { StatusRole } from '../theme/tokens'

// A status, rendered as colour *and* an icon *and* a text label. Never colour
// alone: the icon is what carries the meaning for a reader who cannot separate
// the hues, and the label is what carries it for everyone else. It is not
// optional, which is why it is not a prop.
//
// The colours come from the role's derived pair, so a host that repoints the
// role still gets a readable pill.
withDefaults(
  defineProps<{ status: StatusRole; label: string; size?: 'default' | 'sm' }>(),
  { size: 'default' },
)
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-pill font-medium"
    :class="[
      size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[12px]',
      {
        'bg-status-ontrack-bg text-status-ontrack-fg': status === 'ontrack',
        'bg-status-blocked-bg text-status-blocked-fg': status === 'blocked',
        'bg-status-approaching-bg text-status-approaching-fg': status === 'approaching',
        'bg-status-late-bg text-status-late-fg': status === 'late',
        'bg-status-idle-bg text-status-idle-fg': status === 'idle',
      },
    ]"
  >
    <svg
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
