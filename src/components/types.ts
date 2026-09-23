import type { Component } from 'vue'

import type { IconName } from './icons'
import type { StatusRole } from '../theme/tokens'

/**
 * How loudly a status pill renders. Volume, never meaning — the status role
 * carries the meaning. `soft` is the default derived pair; `solid` is the
 * loud form, for the one loudest thing on a row; `outline` is the quiet form.
 */
export type PillLook = 'soft' | 'solid' | 'outline'

/**
 * One choice in a tab strip.
 *
 * A disabled choice is **shown, never hidden**: drawn dimmed, announced as
 * unavailable and not activatable. Same posture as a locked navigation item —
 * a person may need to know a thing exists before they can ask for it, and an
 * absence says nothing at all.
 */
export interface TabItem {
  /** Stable identity for the choice, and what the host is told when it is made. */
  key: string
  /** The visible text. Already translated — the kit does no i18n. */
  label: string
  /**
   * Small chip drawn after the label, e.g. a count or a short note. Already
   * translated and already formatted; the kit neither counts nor formats.
   */
  tag?: string
  /** Drawn and announced, never activated. */
  disabled?: boolean
}

/**
 * The glyphs the navigation icon can draw, named for the shape.
 *
 * A narrow slice of the package's set: a sidebar wants a handful of
 * unmistakable marks, and offering all of them there would invite a navigation
 * drawn in beakers. Every name here is drawn from the same geometry as
 * `Icon` — one glyph, one definition.
 */
export type NavIconName = Extract<
  IconName,
  'grid' | 'doc' | 'pen' | 'plus' | 'shield' | 'mail' | 'clock' | 'people' | 'lock'
>

/**
 * One glyph offered by a picker: which one, and what to call it.
 *
 * The label is a finished, already-translated string — this package does no
 * i18n, and its own names are English shape words rather than anything to put
 * in front of somebody. An empty `name` means "no glyph".
 */
export interface IconPickerOption {
  name: IconName | ''
  label: string
}

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

/**
 * One row of a diff list: a keyed thing, what happens to it, and why.
 *
 * Every word is the host's, finished and translated — the status's own words
 * included, because the same role reads "added" in one list and "applied" in
 * another. The role only tones the pill.
 */
export interface DiffRow {
  /** What the row is about, drawn in mono — e.g. an item's key. */
  key: string
  /** Which part of the group the row belongs to, when the group has parts. */
  part?: string
  /** Which role tones the row's pill. */
  status: StatusRole
  /** The pill's words. */
  statusLabel: string
  /** Why, or what moves. A row without one draws a dash no reader hears. */
  detail?: string
  /** Kept behind the group's fold until it is opened — e.g. rows that do not change. */
  folded?: boolean
  /** Drawn marked, in its own role's tint, for a row a reader must not miss. */
  marked?: boolean
}

/** A titled group of rows in a diff list, e.g. one section of a document. */
export interface DiffGroup {
  /** Stable identity for the group. */
  key: string
  /** The group's heading. */
  title: string
  /** A short status for the whole group, drawn as a pill beside the title. */
  badge?: string
  /** Which role tones the badge. */
  badgeStatus?: StatusRole
  /** A count or summary after the title, already formatted — e.g. "5 changes". */
  summary?: string
  /** A sentence under the title, e.g. why a group has no rows. */
  note?: string
  /**
   * The fold toggle's words, e.g. "38 unchanged". Drawn only when a row is
   * folded; the kit neither counts nor pluralises, so the host says it.
   */
  foldedLabel?: string
  rows: DiffRow[]
}

/** The column headings a diff list draws, already translated. */
export interface DiffColumns {
  part: string
  key: string
  status: string
  detail: string
}
