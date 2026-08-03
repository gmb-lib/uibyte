import type { Component } from 'vue'

/** The glyphs the navigation icon can draw, named for the shape. */
export type NavIconName =
  | 'grid'
  | 'doc'
  | 'pen'
  | 'plus'
  | 'shield'
  | 'mail'
  | 'clock'
  | 'people'
  | 'lock'

/**
 * One navigation destination.
 *
 * There is no router here on purpose. A host passes whichever link component it
 * already uses through `linkComponent`, and `linkProps` is handed to it
 * untouched — so a routed application gets real routed links, active states and
 * all, and the kit stays free of a routing dependency it would then impose on
 * every consumer.
 */
export interface NavItem {
  /** Stable identity for the item. */
  key: string
  /** The visible text. Already translated — the kit does no i18n. */
  label: string
  icon: NavIconName
  /** Props handed verbatim to the link component, e.g. `{ to: { name: 'home' } }`. */
  linkProps?: Record<string, unknown>
  /**
   * A locked destination is shown, never hidden: drawn dimmed with a lock
   * glyph, stripped of navigation, and announced as unavailable. For a
   * capability a person may see exists but cannot open — an area their role
   * does not reach, or a module not part of their plan.
   */
  locked?: boolean
  /**
   * Small uppercase chip rendered after the label, e.g. an access level or an
   * availability note. Already translated.
   */
  tag?: string
}

/** A labelled group of navigation destinations. */
export interface NavGroup {
  /** Stable identity for the group. */
  key: string
  /** The visible group label, drawn as a small uppercase eyebrow. Already translated. */
  label: string
  items: NavItem[]
}

/** A link component, or the name of an intrinsic element. Defaults to `a`. */
export type LinkComponent = Component | string

/**
 * Every piece of text the shell renders. Supplied already translated: the kit
 * does no i18n, so a host keeps one translation system instead of configuring a
 * second one inside a dependency.
 */
export interface ShellLabels {
  /** Bypass-block text, for keyboard and assistive-technology users. */
  skipToContent: string
  /** Accessible name for the control that opens the drawer. */
  openMenu: string
  /** Accessible name for the drawer itself. */
  menu: string
  /** Accessible name for the drawer's close control. */
  close: string
  /** Accessible name for the primary navigation landmark. */
  primaryNav: string
  /** Small uppercase label above the sidebar navigation. Optional. */
  section?: string
  /**
   * Announced after a locked item's name, for assistive technology
   * (e.g. "not available"). Optional but recommended when any item is locked.
   */
  locked?: string
}
