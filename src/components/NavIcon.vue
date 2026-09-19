<script setup lang="ts">
import { computed } from 'vue'

import Icon from './Icon.vue'
import { isIconName } from './icons'
import type { NavIconName } from './types'

// The navigation line icons: a sidebar, a drawer and a bottom tab bar all draw
// the same glyph. Named for the shape, never for what an application happens to
// use it for.
//
// The geometry itself lives with the rest of the set, so a mark drawn in a
// navigation and the same mark drawn anywhere else can never drift apart. What
// this adds is the narrower list and the guarantee a navigation needs: an item
// always gets a glyph, because a row of names with one blank space in it reads
// as a broken row.
const props = defineProps<{ name: NavIconName; size?: number }>()

const glyph = computed(() => (isIconName(props.name) ? props.name : 'shield'))
</script>

<template>
  <Icon :name="glyph" :size="size ?? 17" />
</template>
