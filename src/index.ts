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
export { deriveRole, MINIMUM_CONTRAST } from './theme/derive'
export type { DerivedRole, DeriveOptions, RoleOverride } from './theme/derive'
export { contrastRatio } from './theme/color'
