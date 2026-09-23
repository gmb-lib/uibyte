// The package entry. Everything a consumer may import is re-exported here —
// there is no supported deep-import path into the source tree, so internals can
// move without breaking a host.
export { cn } from './lib/cn'
export type { ClassValue } from 'clsx'

// The token layer. A host importing the stylesheet gets the reference look; a
// host repointing the palette calls buildTheme/themeCss so the derived values
// move with it and stay legible.
export {
  buildTheme,
  themeCss,
  referenceAccent,
  referenceStatus,
  referenceSurfaces,
  referenceType,
  statusRoles,
  surfaceRoles,
  typeRoles,
} from './theme/tokens'
export type {
  StatusRole,
  SurfaceRole,
  Theme,
  ThemeInput,
  TypeRole,
} from './theme/tokens'
export {
  adjustToContrast,
  CONSOLE_RING_CONTRAST,
  deriveRole,
  MINIMUM_CONTRAST,
} from './theme/derive'
export type { DerivedRole, DeriveOptions, RoleOverride } from './theme/derive'
export { contrastRatio } from './theme/color'
export { radii, shadows, supportColors } from './theme/tokens'
export type { SupportColor } from './theme/tokens'

// The components.
export { default as AppShell } from './components/AppShell.vue'
export { default as SidebarContent } from './components/SidebarContent.vue'
export { default as MobileDrawer } from './components/MobileDrawer.vue'
export { default as StatusPill } from './components/StatusPill.vue'
export { default as FileChip } from './components/FileChip.vue'
export { default as FileDrop } from './components/FileDrop.vue'
export { default as DiffList } from './components/DiffList.vue'
export { default as NavIcon } from './components/NavIcon.vue'
export { default as Icon } from './components/Icon.vue'
export { default as IconPicker } from './components/IconPicker.vue'
export { iconGlyphs, iconNames, isIconName } from './components/icons'
export type { IconName, IconPart } from './components/icons'
export { default as OrderableList } from './components/OrderableList.vue'
export { default as Tabs } from './components/Tabs.vue'
export { default as BrandMark } from './components/BrandMark.vue'
export { Button, buttonVariants } from './components/ui/button'
export type { ButtonVariants } from './components/ui/button'
export type {
  DiffColumns,
  DiffGroup,
  DiffRow,
  IconPickerOption,
  LinkComponent,
  NavGroup,
  NavIconName,
  NavItem,
  PillLook,
  ShellLabels,
  TabItem,
} from './components/types'
