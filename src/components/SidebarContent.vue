<script setup lang="ts">
import { computed, toRaw } from 'vue'
import NavIcon from './NavIcon.vue'
import type { LinkComponent, NavGroup, NavItem } from './types'

// The inside of the sidebar: an optional brand row, the primary navigation —
// flat, or in labelled groups — and a footer the host fills.
//
// The console background is supplied by whatever wraps this — the desktop aside
// or the drawer panel — so this stays presentation-only. Every navigable item
// emits `navigate`, which is how the drawer knows to close itself.
//
// A locked item is shown, never hidden: dimmed, marked with a lock glyph, and
// stripped of navigation. Someone should be able to see a capability exists
// even when they cannot open it.
//
// The footer is a slot rather than built-in content: what sits at the bottom of
// a sidebar is always product-specific (a signed-in identity, a notice, a
// support link), and the moment this component picks one it stops fitting the
// next application. The `extra` slot is the same idea for content that belongs
// between the navigation and the footer.
const props = withDefaults(
  defineProps<{
    /** Flat navigation. Ignored when `groups` is supplied. */
    items?: NavItem[]
    /** Grouped navigation, each group under its own eyebrow label. */
    groups?: NavGroup[]
    /** Component used to render each item. Defaults to a plain anchor. */
    linkComponent?: LinkComponent
    /** Class applied by the link component to the active item. */
    activeClass?: string
    /** Small uppercase label above a flat navigation. Omit to hide it. */
    sectionLabel?: string
    /** Accessible name for the navigation landmark. */
    navLabel: string
    /** Announced after a locked item's name, for assistive technology. */
    lockedLabel?: string
    /** Drop the brand row when the wrapper draws its own. */
    hideBrand?: boolean
  }>(),
  {
    items: () => [],
    linkComponent: 'a',
    activeClass: 'bg-white/[0.07] !text-white',
    hideBrand: false,
  },
)

const emit = defineEmits<{ navigate: [item: NavItem] }>()

// Unwrapped before it is rendered: a component reaching `<component :is>` as a
// reactive proxy makes Vue warn, and the host should not have to know to call
// markRaw on something it is only handing over to be rendered.
const link = computed(() => toRaw(props.linkComponent))

// One rendering path: a flat list is a single group carrying the section label.
const sections = computed<NavGroup[]>(() =>
  props.groups?.length
    ? props.groups
    : [{ key: 'nav', label: props.sectionLabel ?? '', items: props.items }],
)
</script>

<template>
  <div class="flex h-full flex-col px-3.5 pb-[18px]" :class="hideBrand ? 'pt-2' : 'pt-[18px]'">
    <div v-if="!hideBrand" class="pb-3">
      <slot name="brand" />
    </div>

    <nav class="flex flex-col gap-[3px]" :aria-label="navLabel">
      <template v-for="(group, groupIndex) in sections" :key="group.key">
        <p
          v-if="group.label"
          class="pb-2 font-mono text-[10px] font-medium uppercase leading-none tracking-[0.12em] text-muted-strong"
          :class="groupIndex > 0 ? 'pt-5' : ''"
        >
          {{ group.label }}
        </p>

        <template v-for="item in group.items" :key="item.key">
          <!-- A placeholder link: no href, so it navigates nowhere and stays
               out of the tab order, while assistive technology still reads it
               and hears it is unavailable. -->
          <a
            v-if="item.locked"
            aria-disabled="true"
            class="flex cursor-not-allowed items-center gap-[11px] rounded-[9px] px-3 py-2.5 text-sm font-medium text-console-muted opacity-55"
          >
            <NavIcon :name="item.icon" />
            <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
            <span
              v-if="item.tag"
              class="rounded-[5px] bg-white/[0.08] px-1.5 py-0.5 font-mono text-[9.5px] font-medium uppercase leading-none tracking-[0.08em]"
            >
              {{ item.tag }}
            </span>
            <NavIcon name="lock" :size="13" class="shrink-0" />
            <span v-if="lockedLabel" class="sr-only">{{ lockedLabel }}</span>
          </a>

          <component
            :is="link"
            v-else
            v-bind="item.linkProps"
            class="flex items-center gap-[11px] rounded-[9px] px-3 py-2.5 text-sm font-medium text-console-muted hover:bg-white/[0.07] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-console-focus"
            :active-class="activeClass"
            @click="emit('navigate', item)"
          >
            <NavIcon :name="item.icon" />
            <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
            <span
              v-if="item.tag"
              class="rounded-[5px] bg-white/[0.08] px-1.5 py-0.5 font-mono text-[9.5px] font-medium uppercase leading-none tracking-[0.08em]"
            >
              {{ item.tag }}
            </span>
          </component>
        </template>
      </template>
    </nav>

    <slot name="extra" />

    <div class="mt-auto flex flex-col gap-3 pt-5">
      <slot name="footer" />
    </div>
  </div>
</template>
