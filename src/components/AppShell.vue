<script setup lang="ts">
import { computed, defineAsyncComponent, ref, toRaw } from 'vue'
import NavIcon from './NavIcon.vue'
import SidebarContent from './SidebarContent.vue'
import type { LinkComponent, NavGroup, NavItem, ShellLabels } from './types'

// The application frame: a console sidebar on the left, a translucent top bar,
// the page below it, and — on small screens — a bottom tab bar plus a drawer.
//
// It owns the frame and nothing else. Navigation destinations arrive as props,
// every piece of text arrives already translated, and the actions are slots, so
// the shell has no opinion about routing, translation or what a product's
// primary action happens to be.

// The drawer ships only to sessions that open it. Desktop never loads its code,
// or the dialog primitive it pulls in.
const MobileDrawer = defineAsyncComponent(() => import('./MobileDrawer.vue'))

const props = withDefaults(
  defineProps<{
    /** Flat navigation. Ignored when `groups` is supplied. */
    items?: NavItem[]
    /** Grouped navigation, each group under its own eyebrow label. */
    groups?: NavGroup[]
    labels: ShellLabels
    /** Component used to render navigation links. Defaults to a plain anchor. */
    linkComponent?: LinkComponent
    /** Class the link component applies to the active item. */
    activeClass?: string
  }>(),
  { items: () => [], linkComponent: 'a', activeClass: 'bg-white/[0.07] !text-white' },
)

const emit = defineEmits<{ navigate: [item: NavItem] }>()

// Unwrapped before it is rendered — see SidebarContent for why.
const link = computed(() => toRaw(props.linkComponent))

// The bottom tab bar has no room for group structure; it gets every
// destination in order, locked ones included — locked is never hidden.
const flatItems = computed<NavItem[]>(() =>
  props.groups?.length ? props.groups.flatMap((group) => group.items) : props.items,
)

const drawerOpen = ref(false)
const drawerLoaded = ref(false)

function openDrawer(): void {
  // Mounted on first open so the chunk is fetched on demand, then left mounted.
  drawerLoaded.value = true
  drawerOpen.value = true
}

function onNavigate(item: NavItem): void {
  drawerOpen.value = false
  emit('navigate', item)
}
</script>

<template>
  <div class="flex min-h-screen bg-paper">
    <!-- Bypass block: a keyboard or assistive-technology user jumps straight to
         the page content instead of walking the whole navigation. -->
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-btn focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
    >
      {{ labels.skipToContent }}
    </a>

    <aside
      class="sticky top-0 hidden h-screen w-[250px] shrink-0 bg-console text-console-text lg:flex"
    >
      <SidebarContent
        :items="items"
        :groups="groups"
        :link-component="link"
        :active-class="activeClass"
        :nav-label="labels.primaryNav"
        :section-label="labels.section"
        :locked-label="labels.locked"
        @navigate="onNavigate"
      >
        <template #brand><slot name="brand" /></template>
        <template #extra><slot name="sidebar-extra" /></template>
        <template #footer><slot name="sidebar-footer" /></template>
      </SidebarContent>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="sticky top-0 z-10 flex h-[60px] items-center gap-3 border-b border-line bg-paper/[0.86] px-4 backdrop-blur-[10px] sm:px-5 lg:px-[30px]"
      >
        <button
          type="button"
          class="-ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-btn text-ink hover:bg-band focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus lg:hidden"
          :aria-label="labels.openMenu"
          @click="openDrawer"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round" />
          </svg>
        </button>

        <!-- Whatever the product puts at the left of its top bar on desktop. -->
        <div class="hidden lg:flex"><slot name="topbar-start" /></div>

        <!-- Small screens centre the brand; large ones push the actions right. -->
        <div class="flex flex-1 justify-center lg:hidden"><slot name="brand-compact" /></div>
        <div class="hidden flex-1 lg:block"></div>

        <slot name="topbar-actions" />
      </header>

      <main
        id="main"
        tabindex="-1"
        class="flex-1 px-4 py-6 pb-24 focus:outline-none sm:px-8 sm:py-8 lg:px-9 lg:pb-[60px] lg:pt-[34px]"
      >
        <slot />
      </main>
    </div>

    <nav
      data-testid="bottom-nav"
      class="fixed inset-x-0 bottom-0 z-30 flex border-t border-console-line bg-console pb-[env(safe-area-inset-bottom)] lg:hidden"
      :aria-label="labels.primaryNav"
    >
      <template v-for="item in flatItems" :key="item.key">
        <a
          v-if="item.locked"
          aria-disabled="true"
          class="flex flex-1 cursor-not-allowed flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-console-muted opacity-55"
        >
          <NavIcon :name="item.icon" :size="20" />
          {{ item.label }}
          <span v-if="labels.locked" class="sr-only">{{ labels.locked }}</span>
        </a>
        <component
          :is="link"
          v-else
          v-bind="item.linkProps"
          class="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-console-muted focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-console-focus"
          active-class="!text-white"
          @click="emit('navigate', item)"
        >
          <NavIcon :name="item.icon" :size="20" />
          {{ item.label }}
        </component>
      </template>
    </nav>

    <MobileDrawer
      v-if="drawerLoaded"
      v-model:open="drawerOpen"
      :title="labels.menu"
      :close-label="labels.close"
    >
      <template #header><slot name="brand-drawer" /></template>
      <SidebarContent
        hide-brand
        :items="items"
        :groups="groups"
        :link-component="link"
        :active-class="activeClass"
        :nav-label="labels.primaryNav"
        :section-label="labels.section"
        :locked-label="labels.locked"
        @navigate="onNavigate"
      >
        <template #extra><slot name="sidebar-extra" /></template>
        <template #footer><slot name="sidebar-footer" /></template>
      </SidebarContent>
    </MobileDrawer>
  </div>
</template>
