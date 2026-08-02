<script setup lang="ts">
import { computed, toRaw } from 'vue'
import NavIcon from './NavIcon.vue'
import type { LinkComponent, NavItem } from './types'

// The inside of the sidebar: an optional brand row, a section eyebrow, the
// primary navigation, and a footer the host fills.
//
// The console background is supplied by whatever wraps this — the desktop aside
// or the drawer panel — so this stays presentation-only. Every item emits
// `navigate`, which is how the drawer knows to close itself.
//
// The footer is a slot rather than built-in content: what sits at the bottom of
// a sidebar is always product-specific (a signed-in identity, a notice, a
// support link), and the moment the kit picks one it stops fitting the next
// application.
const props = withDefaults(
  defineProps<{
    items: NavItem[]
    /** Component used to render each item. Defaults to a plain anchor. */
    linkComponent?: LinkComponent
    /** Class applied by the link component to the active item. */
    activeClass?: string
    /** Small uppercase label above the navigation. Omit to hide it. */
    sectionLabel?: string
    /** Accessible name for the navigation landmark. */
    navLabel: string
    /** Drop the brand row when the wrapper draws its own. */
    hideBrand?: boolean
  }>(),
  {
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
</script>

<template>
  <div class="flex h-full flex-col px-3.5 pb-[18px]" :class="hideBrand ? 'pt-2' : 'pt-[18px]'">
    <div v-if="!hideBrand" class="pb-3">
      <slot name="brand" />
    </div>

    <p
      v-if="sectionLabel"
      class="pb-2 font-mono text-[10px] font-medium uppercase leading-none tracking-[0.12em] text-muted-strong"
    >
      {{ sectionLabel }}
    </p>

    <nav class="flex flex-col gap-[3px]" :aria-label="navLabel">
      <component
        :is="link"
        v-for="item in items"
        :key="item.key"
        v-bind="item.linkProps"
        class="flex items-center gap-[11px] rounded-[9px] px-3 py-2.5 text-sm font-medium text-console-muted hover:bg-white/[0.07] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
        :active-class="activeClass"
        @click="emit('navigate', item)"
      >
        <NavIcon :name="item.icon" />
        {{ item.label }}
      </component>
    </nav>

    <div class="mt-auto flex flex-col gap-3 pt-5">
      <slot name="footer" />
    </div>
  </div>
</template>
