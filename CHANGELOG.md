# Changelog

Notable changes to this package, newest first. Versions are git tags; this file is written for
whoever bumps the dependency — what changed, and what it means for an application already built
on it.

This package ships **source**, compiled by the host, so every entry below is a change to what your
build compiles. Nothing here deploys and nothing holds state.

## v0.16.0

Options on two list components, for lists that are short, searched, or drawn as rows. Additive: with
none of them given, both draw and behave exactly as before.

### Added — `list` on `SplitDetail`

`list` is `fill` (the default) or `fit`. With `fit` the list takes the width of its content, never
wider than the room it has, and the open item sits right beside it, the pair aligned to the start —
for a short list or a tree, where `fill` leaves the item across empty width. The width below which the
item replaces the list, the way back and the focus behaviour are unchanged.

### Added — `fewerLabel`, `keep` and `layout` on `FoldMore`

`fewerLabel` gives words for a second button, shown once the list is unfolded, that folds it back to
the limit; focus returns to the button for the rest. `keep` is a function: items it accepts always
show, in their place, even beyond the limit, and only the items still hidden are counted — so a search
can show every match in a list folded after five, and no button appears when nothing is hidden.
`moreLabel` may now also be a function of how many items are still hidden. `layout` is `inline` (the
default) or `rows`, which draws each item as a block row with no separators and the buttons under the
rows.

**To adopt:** move the pin to `v0.16.0`.

## v0.15.1

### Fixed — `SelectField` shows its model when a choice is not taken

A host that does not take a choice — a change the server refused, so the model stays where it was —
was left with the select showing the option picked, since nothing redrew it. The select now puts itself
back to its model once the host has had its turn; a host that takes the choice, at once or after an
answer, sees it as before. No prop changes.

**To adopt:** move the pin to `v0.15.1`.

## v0.15.0

A second size for the box, and a second look for the file button — both found when an application moved
its own hand-built copies onto the `v0.14.0` pieces, where one look would have changed a screen already
drawn. Additive: nothing you use draws differently unless you ask for it.

### Added — `size` on `TextField` and `SelectField`

`size` is `md`, the box of a form (the default, as before), or `sm`, a compact box (13px text, a smaller
radius and padding) for a control inside a list's row or beside a few words, where the box of a form
would make the row taller than its text — a role picker in a `ControlList` row, say.

### Added — `look` and `icon` on `FilePick`

`look` is `link`, quiet text for an act in a row (the default, as before), or `button`, the kit's small
outline button, for an act beside other buttons. `icon` names a kit icon drawn before the words.

**To adopt:** move the pin to `v0.15.0`; nothing changes until you pass `size`, `look` or `icon`.

## v0.14.0

Three small pieces every form and list ends up drawing: a box for a short value, a choice from a
list in the same box, and a button that opens the file chooser. All three are additive: no component
you already use draws anything different.

### Added — `TextField`: a box for a short value

One box for `type` `text`, `search`, `date`, `number` or `email`, in the kit's look. `v-model` holds the
text in the box. The box always has a name: `label` draws one above it, `ariaLabel` names it when your
markup draws the label, and `id` lets your own `<label for>` reach it. `placeholder`, `name`,
`autocomplete`, `inputmode`, `min` and `max` go to the input as they are; `hint` is a quiet line the box
is described by; `invalid` and `error` colour the box, set `aria-invalid` and say why, announced;
`disabled` dims it. A `class` you pass lands on the outer element (set the width there; it fills its
container up to 420px by default) and any other attribute lands on the input.

### Added — `SelectField`: a choice from a list, in the same box

The platform's own `<select>`, so keyboard, phone picker and screen readers behave as they do
elsewhere. `options` is `{ value, label, disabled? }[]` (the type is `SelectOption`), `v-model` holds the
chosen `value`, and `placeholder` adds an empty first option. The name, hint, invalid, error, disabled,
`id` and class rules are `TextField`'s.

### Added — `FilePick`: a quiet button that opens the file chooser

A link-like button around a hidden native file input: `label`, `accept`, `multiple`, `disabled`; it emits
`files` (never empty) and empties the input after each pick so the same file can be chosen again. It
refuses nothing itself. For a drop zone, `FileDrop` is unchanged.

### Changed — docs only

The consuming guide now says that a usable identity code is settled as it is typed (the `v0.13.1`
behaviour).

**To adopt:** move the pin to `v0.14.0`. An application that hand-builds the same box, select or hidden
file input can replace them with these pieces; nothing requires it.

## v0.13.1

### Fixed — `IdentityCodeField`: the first click after typing a code is no longer lost

A person who typed a code and went straight to the form's button lost that click: leaving the box drew
the field's `settled` line, the line pushed everything below it down by its height while the mouse was
pressed, and the release landed above the button, so no click fired. A second click worked.

The field now says a usable code is settled as soon as it reads right, while the box still has the
focus, so the line is already in place when the button is pressed. Nothing else moves: the code is
rewritten to its one spelling only when the box is left, as before, and a code that cannot be used is
still refused only then, never mid-word. No prop or event changes; an application on `v0.13.0` takes it
by moving the pin.

## v0.13.0

A field for a person's identity code with the country that issued it chosen beside it, with the rule
it checks codes by; and one choice of a few, drawn side by side. Both pieces are additive: no
component you already use draws anything different.

### Added — `IdentityCodeField`: an identity code and its country, as one field

The country's choice and the code's box in one frame, because the two are one value — the same
digits in two countries are two people. `v-model` holds what is typed, `v-model:country` the chosen
two-letter code; `label` and `countryLabel` name the box and the choice; `id` lands on the box.

```vue
<IdentityCodeField
  v-model="form.code"
  v-model:country="form.country"
  :countries="countries"
  :label="t('person.code')"
  :country-label="t('person.codeCountry')"
  :describe="refusal"
  :note="t('person.codeWhy')"
/>
```

The package carries **no countries and no words**. `countries` is yours — a list of `CountryGroup`s,
each `{ key, label?, countries: { code, label }[] }`, the names already in the reader's language; a
group with a label is drawn under it as a heading, one without draws its countries plainly. So is
every sentence: `describe(error, country)` returns what a person is told about a code that cannot be
used, given why (an `IdentityCodeError`) and the country whose format refused it — the code's own when
it names one (`PNOEE-…` typed beside Latvia is explained by Estonia's format), otherwise the one it was
read beside, and carried on the error as `country` for `length` and `digits`; `settled` is an optional
line once a usable code is settled, and `note` an optional quiet line under the field that the box is
described by.

The field settles what was typed on leaving the box, on Enter (which does not send the form) and on a
change of country: a usable code is rewritten as its country writes it, and a code that names its own
country moves the choice there when you offer it — when you do not, the box keeps the whole code, so
the code is never read beside the wrong country. A refusal is said under the field in your sentence,
announced, with the box marked invalid and the frame in the refusal colour; typing again takes it
away. The empty box shows the chosen country's pattern where its format is known (in the code face), or your
`placeholder` (in the text face).

### Added — the identity-code rule

`parseIdentityCode(typed, country)` — the one stored spelling of a code, what a person is shown, and
the code taken apart; or why it cannot be used — `displayIdentityCode(stored)` and
`identityCodePattern(country)`, with the types `IdentityCode`, `IdentityCodeOk`, `IdentityCodeError`,
`IdentityCodeProblem` and `IdentityCodeResult`. The field checks codes with it; a form gating its Send
calls it too, so the two give the same answer. A service receiving a code should canonicalise it
again — the rule explains a refusal before anything is sent, and cannot decide an identity.

### Added — `SegmentedChoice`: one choice of a few, all in view

Your `options` side by side in one frame, the chosen one filled: `v-model` holds the chosen key and
`label` names the group for a reader. Each option is a `SegmentedOption`, `{ key, label, disabled? }`,
its words already translated.

```vue
<SegmentedChoice v-model="way" :options="ways" :label="t('add.how')" />
```

It is a radio group with a single stop in the page order: the arrow keys move along it and choose as
they go, wrapping at the ends; Home and End go to the first and the last; Space and Enter choose the
option the caret is on; an option that cannot be chosen is shown, announced and stepped over. The
chosen one is filled, drawn heavier and announced as checked — never its colour alone — and every
option keeps the room of its heavier words, so choosing one moves nothing along. In a narrow box the
options wrap onto another line. What each choice shows is yours to draw.

## v0.12.0

A list whose rows hold controls, two places in a page's header — beside the title, and the title's own — a glyph
of your choosing on a status pill, and `FindField`'s several-at-once card drawn line first. Everything but the
last is additive: a `ListTable`, a `PageHeader` and a `StatusPill` that pass nothing new draw exactly the markup they
drew in v0.11.1. The last moves the box of a `FindField` with `multiple`.

### Added — `ControlList`: rows that hold controls of their own

For a list whose rows are not a way into something but hold your controls — a choice made in place, an act on
that row, a link elsewhere. `ListTable` cannot carry such a row: its whole row is one link or one button, and a
control inside a link or a button is two targets at once. `ControlList` is the same list with plain rows: the
same `columns`, `rows`, `rowKey`, `label`, `sort`, `sortedLabels`, `sort` event and `footer` slot, the same
card, header and grid, folding the same way by its own width. Each row is its cells and nothing else — never a
link, a button or a stop of its own — and each control you put in a `cell-<key>` slot is its own stop in the page
order. The header is for the eye, so name each control for its row.

`row-after` draws something about one row under its cells, inside its entry — the question asked before an act
on it, say:

```vue
<ControlList :columns="columns" :rows="page" :row-key="(p) => p.id" :label="t('people.title')">
  <template #cell-access="{ row }">
    <select :value="row.access" :aria-label="t('people.accessOf', { name: row.name })" @change="change(row, $event)">
      <option v-for="a in levels" :key="a.id" :value="a.id">{{ a.name }}</option>
    </select>
  </template>
  <template #cell-act="{ row }"><Button size="sm" variant="ghost" @click="asking = row.id">{{ t('people.remove') }}</Button></template>
  <template #row-after="{ row }">
    <ConfirmAsk v-if="asking === row.id" :question="t('people.removeAsk', { name: row.name })" :confirm-label="t('people.remove')"
                :keep-label="t('common.keep')" danger @confirm="remove(row)" @keep="asking = ''" />
  </template>
</ControlList>
```

A column that holds only an act takes an empty `label`. `ListTable` does not change: every row of it is still one
target, and there is no setting that makes it otherwise — a list whose whole row opens one thing stays a
`ListTable`.

### Added — `PageHeader` `title-after`: a mark beside the title

A slot for one short mark of yours — a pill saying the page's subject is locked, say — drawn on the title's line,
after it, and going under the title when the line is too narrow for both. It sits beside the heading, not in it,
so the heading is still named by the title alone and a reader hears the mark's words after it:

```vue
<PageHeader :title="area.name">
  <template v-if="area.locked" #title-after>
    <StatusPill status="idle" look="outline" icon="lock" :label="t('area.locked')" />
  </template>
</PageHeader>
```

A header given no mark draws exactly what it drew before.

### Added — `PageHeader` `title`: your content in the title's place

A slot drawn **instead of the visible title** — a form that edits the thing the page is about, say — while the way
back, `eyebrow`, `subtitle` and the actions keep their places. The page keeps its heading, at its level, for a reader
only, and it says your `title`; so while the slot is drawn, word `title` for what is happening:

```vue
<PageHeader :title="editing ? t('item.editing', { name: item.name }) : item.name" :back="back" :link-component="RouterLink">
  <template v-if="editing" #title><ItemForm v-model="draft" @save="save()" @cancel="editing = false" /></template>
</PageHeader>
```

The slot takes the title's whole line, so a `title-after` mark is not drawn with it. Without the slot the title is
drawn as before. If you hid the heading yourself while editing (a class reaching into the header), drop it: the
header does it now.

### Added — `StatusPill` `icon`: a glyph of yours in the mark's place

A glyph name from the package's set (`Icon`'s names), drawn where the pill's mark sits — the role's glyph in soft
and solid, the dot in outline — at the pill's size and weight, in the label's colour, hidden from a reader. The
label still carries the meaning. A name this version does not know draws the role's own mark.

```vue
<StatusPill status="idle" look="outline" size="sm" icon="lock" :label="t('area.notIncluded')" />
```

A pill without `icon` draws exactly what it drew before.

### Changed — `FindField` with `multiple`: the line first, then the box, in one card

The several-at-once field is now one card: your `summary` line at the top, then the box, then the ticks — it was
the box alone, with the line at the top of the ticks' card under it. The box spans the card. What changes for an
app already built on it: the box moves into the card, under the line, and is as wide as the card; while the list
is being read or could not be read, its words sit in the card under the box. `summary` is still not drawn until the
list is read. The one-at-a-time field is unchanged.

## v0.11.1

A fix to the side menu's width, and `align` on `LanguageMenu`.

### Fixed — the side menu's column fills the menu

On a wide screen the side menu is a fixed width, but its column was only as wide as the longest line in it — a
link's name, or the signed-in line in the footer — so the links' highlight stopped short of the menu's edge, and
anything spread across the footer was only as wide as that line. With a short line a full-width menu at the foot
was narrow, and its list could reach past the menu's edge. The column now fills the menu. What changes for an app
already built on it: the links' highlight and anything spread across the footer reach the menu's width. The phone's
drawer always filled its width and is unchanged.

### Added — `LanguageMenu` `align`

Which edge of the button its list lines up with — `'start'` or `'end'` (the default), as on `Menu`. A language
menu among the values of a settings list, opening below its button, lines up with the button's start:

```vue
<LanguageMenu v-model="locale" align="start" :label="t('language')" :languages="languages" />
```

## v0.11.0

Three options that say where a `Menu` sits — which side its list opens on, which surface its button is drawn
for, and whether it spans its container — and a note an item can carry after its words. `LanguageMenu` takes
all four. Everything is additive: a menu that passes none of them draws exactly the markup it drew in v0.10.0.

### Added — `Menu`: opening upward, a button for the dark menu, the full width

- `side` (`'bottom'` or `'top'`, default `'bottom'`) — which side of the button the list opens on. A button at
  the foot of a column has no room below it; with no room above, the list opens below instead.
- `tone` (`'surface'` or `'console'`, default `'surface'`) — `'console'` draws the button for the dark
  application menu: no fill of its own, the dark surface's line for its border, light words, a faint fill when
  pointed at or open, a quieter arrow, and the focus ring made for the dark surface (`console-focus`). The list
  it opens stays the light list every menu opens.
- `block` (default `false`) — the button spans its container; its words take the room between whatever leads
  them and the arrow, and the list it opens is at least as wide as the button.

### Added — a note after an item's words

`MenuItem.note` is a short word drawn after the item's words, small, quiet and in mono — *everyone here*
beside the one everyone has, say. It is in the page's language, not the item's: when an item carries one, its
`lang` marks its words alone, so a reader says the name in its own language and the note in the page's. The
note is part of the item's name, heard after its words. An item without a note is drawn as before.

### Added — `LanguageMenu` carries them

`LanguageOption.note` reaches the language's item, and `side`, `tone` and `block` reach its menu; with `block`,
the group around the menu spans its container too (it was, and without `block` still is, inline). A language
menu at the foot of a dark side menu, opening upward across its width, the deployment's language marked:

```vue
<template #sidebar-footer>
  <LanguageMenu v-model="locale" side="top" tone="console" block :label="t('language')"
                :languages="[{ code: 'en', name: 'English' },
                             { code: 'lv', name: 'Latviešu', note: t('language.everyoneHere') }]" />
</template>
```

## v0.10.0

A window for a short form, two optional additions to `FindField`, a way to move an `OrderableList` row by
its grip alone, and a name of its own for a `Menu`. Everything is additive: nothing you already pass changes
what is drawn.

### Added — `Window`: a short form over the page

For a form that belongs to the page under it — changing an item's details, say — where leaving the page would
lose the person's place. You hold it open with `v-model:open`; it draws your `title` as its heading and names
itself by it, your form in the default slot and your buttons in `footer`.

```vue
<Window v-model:open="editing" :title="t('item.edit')" :close-label="t('common.close')" :busy="saving">
  <ItemForm v-model="draft" />
  <template #footer>
    <Button variant="outline" @click="editing = false">{{ t('common.cancel') }}</Button>
    <Button :disabled="saving" @click="save()">{{ t('common.save') }}</Button>
  </template>
</Window>
```

When it opens, focus moves to the first thing in its body that takes it (the window itself when there is none),
Tab stays inside, and the page behind is held still and hidden from a reader. Escape, the close mark and a
press outside close it — emitting `update:open` with `false` — and focus goes back to whatever opened it. While
`busy` is set, none of the three closes it, so a save under way is never left with its answer unseen; setting
`open` yourself still does. An Escape
that something inside has already used for itself, such as a `FindField` closing its list, leaves the window
open. `size="wide"` is for a form laid out in two columns. It folds by the width of the space it opens in, as
the rest of the package does — here the whole page, since it opens on the page's body: below 640px it takes the
full width and height.

`ConfirmAsk` does not change: an act asked about first is still asked in place, not in a window.

The name is also the browser's: in a module that imports this one, `Window` as a type is still the browser's,
but `Window` as a value — `x instanceof Window` — is now the component. Such a module imports it under another
name: `import { Window as FormWindow } from 'uibyte'`.

### Added — `FindField`: a glyph per option, and a line under the list

A `FindOption` may carry an `icon`, a glyph name from the package's set, drawn before its name in the list, in
the box once chosen, and beside each tick. It is for the eye only — the name carries the meaning — and, as with
`Icon`, a name this version does not know draws nothing and keeps no room open for itself.

`footer` is a quiet line under the options, said whenever the list is open, and the box is described by it.

```vue
<FindField v-model="kind" :options="kinds.map((k) => ({ key: k.id, label: k.name, icon: k.icon }))"
           :label="t('item.kind')" :no-match="t('kinds.noMatch')" :footer="t('kinds.count', { n: kinds.length })" />
```

An option without a glyph and a field without a footer are drawn as before. The box and the open list each now
sit inside one more element than they did, which matters only to a test of yours that reaches into the field's
markup by position.

### Added — `OrderableList`: a row moved by its grip alone

For a list whose rows hold links or buttons of their own — a heading with a list of things that open under it,
say. The list as it was cannot carry such a row: it makes the whole row the drag source and the keyboard stop,
draws it as a card with its position, and tells a reader each row is an option to choose. With `handle`, the
list is a plain list and you draw each row in full; the row's grip reaches your slot as `grip`, for you to
place wherever the row wants it.

```vue
<OrderableList handle :items="groups" :item-key="(g) => g.id" :label="(g) => g.name" :list-label="t('groups.title')"
               :row-label="(name, at, of) => t('groups.move', { name, at, of })" @move="moveGroup">
  <template #default="{ item, grip }">
    <div class="flex items-center gap-3"><component :is="grip" /><h3>{{ item.name }}</h3></div>
    <EntryList :entries="item.entries" />
  </template>
</OrderableList>
```

The grip is a button in the Tab order, named by your `rowLabel`, and Alt+ArrowUp / Alt+ArrowDown on it emits
`move` as a focused row does today. Only a drag that starts on the grip moves the row — the whole row, with the
same drop line and fade; anywhere else in it, text selects and links drag as links. If you apply a move later,
after writing it somewhere, focus goes back to the moved row's grip once you draw the new order, unless the
person has moved on. Without `orderable`, `grip` is absent and nothing moves. A list without `handle` is drawn
and behaves exactly as before.

### Added — `Menu`: a name that says what it acts on

`about` is what the button acts on, in your words. The button is then named by its words followed by that —
*Move to… — Quarterly report* — your visible words first, so the name still holds what is on screen. Nothing
drawn changes. It is for a page that draws one menu per row, where every button says the same thing and a reader
or a voice command could not tell them apart; an `aria-label` given to `Menu` does not reach its button, so this
is the way to name it. Without `about`, the button is named by its words alone, as before.

```vue
<Menu :label="t('row.moveTo')" :about="row.name" :items="destinations" @select="(to) => move(row, to)" />
```

## v0.9.0

A release of pieces that screens share, so each is built once with the keyboard and reader behaviour
it promises. One meaning changes — **done moves from `ontrack` to a new `closed` role** (below); no existing
component changes shape.

### Added — a sixth status role, `closed`; `ontrack` no longer means done

Finished work now has its own role: `closed`, a muted blue with its derived pair (`status-closed-bg`, `-fg`,
`-border`, `-solid-bg`, `-solid-fg`), and its own mark in `StatusPill` — a check inside a circle, so it never
relies on colour to differ from `ontrack`'s open check. `ontrack` keeps *on track, valid, under way*.

```vue
<StatusPill status="closed" :label="t('status.closed')" />
```

**What to do when you upgrade:** move the states that mean *done* or *finished* from `ontrack` to `closed`;
leave *cancelled* and *closed without an outcome* in `idle`. Nothing breaks if you do not — a done state just
keeps reading as on track. A theme built with `buildTheme` gains the new role from the reference dot
`#5B78DA`, and can set its own through `status.closed`.

### Added — `PageHeader`: the title once, one way back, actions that give way

The top of a page: its heading, an optional area above it and a quiet line under it, and the page's
own actions at the top right. When the row is too narrow for both, the actions wrap under the title;
the title is never squeezed. The row decides this from its own width, not the window's.

```vue
<PageHeader
  :title="item.name"
  :eyebrow="t('area.workspace')"
  :back="{ label: t('items.title'), linkProps: { to: { name: 'items' } } }"
  :link-component="RouterLink"
>
  <template #actions><Button variant="outline">{{ t('item.edit') }}</Button></template>
</PageHeader>
```

`back` is the destination's name and the props for your link component; the arrow is drawn and hidden
from a reader, so pass the name alone. The heading is an `h1` unless you give `level` (2 or 3) for a
page inside another's frame.

### Added — `StateBlock`: loading, empty, or failed — and never a code

What a read says when it has nothing to show. One `state` prop with three values, so an empty answer
and a failure cannot be drawn as each other; a failure is announced at once, the other two politely.
Give `retryLabel` and a failure offers to try again (`@retry`); anything else a person can do goes in
the `actions` slot, outside the announcement.

```vue
<StateBlock state="failed" :title="t('list.down')" :retry-label="t('common.tryAgain')" @retry="read()" />
```

There is no prop for an error code, on purpose: say what happened in words, and keep the code for your
logs. With no words the block says nothing — it has no sentence of its own.

### Added — `FindField`: find one thing or several, by typing

Type a few letters and choose from what matches, among `options` you have already read. One at a time it is a
combobox whose matches open under the box; with `multiple` it is a box over ticks, the ticked kept in view.

```vue
<FindField v-model="holder" :options="people" :label="t('handOver.to')" :no-match="t('people.noMatch')" />
```

Typing never chooses, and when the list could not be read (`failed`) nothing is offered in its place — there is
no way to type a key instead. Matching ignores case and the marks over letters; the same rule is exported as
`findMatches(query, ...texts)` for lists you filter yourself.

### Added — `ActLine` and `ConfirmAsk`: an act's answer, and an act asked about first

`ActLine` says what an act did, or why it was refused, in your sentence — politely or at once, toned by the
outcome, with an optional way on beside it. `ConfirmAsk` asks in place, never in a window over the page: the
question, what it does, *do it* and *keep it*; it takes focus when it appears and gives it back when it goes.

```vue
<ActLine outcome="refused" :text="t('roles.refused.setupBox')" />
<ConfirmAsk :question="t('file.remove.ask')" :detail="t('common.final')" :confirm-label="t('file.remove.do')"
            :keep-label="t('common.keep')" danger @confirm="remove()" @keep="asking = false" />
```

### Added — `ListTable`, `Pager` and `CountStrip`: a long list, the way through it, and counts that filter it

`ListTable` draws rows on a shared grid where **the whole row is the way in** — your link, or a button that
emits `open` — and folds by its own width: a column's `priority` says whether it stays, folds under the title,
or goes. `Pager` says where the page sits in your words and offers previous, next and the pages around this
one. `CountStrip` draws counts you have already read as the filters, one chosen at a time.

```vue
<CountStrip v-model="filter" :items="counts" :label="t('people.show')" />
<ListTable :columns="columns" :rows="rows" :row-key="(r) => r.id" :label="t('people.title')" @open="show">
  <template #footer><Pager v-model:page="page" :pages="pages" :range="range" v-bind="pagerWords" /></template>
</ListTable>
```

### Added — `Menu` and `LanguageMenu`, and the `globe` glyph

`Menu` is a button that opens a short list on the page's body — a list of acts (`@select`), or one choice among
options (`v-model`, the chosen one checked). `LanguageMenu` is the menu every sign-in page needs: the language in
use named in itself beside a globe, opening every language you carry, each named and marked in its own language.

```vue
<LanguageMenu v-model="locale" :languages="[{ code: 'en', name: 'English' }, { code: 'lv', name: 'Latviešu' }]"
              :label="t('language')" />
```

The glyph set grows from 27 to 28 names with `globe`. No picker offers it until you list it.

### Added — `SplitDetail`, `FoldMore` and `DayList`

`SplitDetail` shows an item beside its list when its own width allows, and alone with a way back when it does
not, moving focus so a keyboard reader is never left behind. `FoldMore` shows the first few and your words for the
rest, held open while a search runs. `DayList` draws what happened under the days you group, with older lines on
request.

```vue
<SplitDetail :open="!!item" :back-label="t('items.title')" @back="item = null">
  <template #list>…</template>
  <template #detail>…</template>
</SplitDetail>
```

### Added — a `DiffList` row can be drawn by name

`DiffRow` gains an optional `label`: the row is then drawn by the thing's name, with its `key` after it in
quieter mono. A row without one is drawn exactly as before.

```ts
{ key: 'delivery', label: t('types.delivery'), status: 'ontrack', statusLabel: t('diff.added') }
```

### Added — `Button`'s `danger` variant

For an act that cannot be undone, painted from the late role's derived solid pair, which the token layer
guarantees white text reads on. The other variants are unchanged.

## v0.8.0

### Added — the `gear` glyph

The set grows from 26 to 27 names: `gear`, a toothed wheel around a hub — the mark people read as
"settings" before they read the word beside it.

```vue
<Icon name="gear" />
```

It is also one of the navigation marks `NavIcon` draws (`NavIconName` gains `gear`), so a sidebar can
carry it beside `grid`, `doc` and the rest.

Additive: no name moved and no drawing changed. An application that offers glyphs through
`IconPicker` chooses its own `options`, so `gear` appears in nobody's picker until a host lists it.

## v0.7.0

### Added — `FileDrop`: the platform's own file input, with a zone around it

A place to hand over files — dropped onto it, or chosen through the platform's chooser. The zone is a
`<label>` around a visually hidden native input, so a click anywhere opens the chooser, the keyboard
reaches it as the one control it is, and a reader hears it by the words you give it:

```vue
<FileDrop
  :label="t('import.drop')"
  :hint="t('import.dropHint')"
  accept=".json,application/json"
  @files="([file]) => preview(file)"
  @rejected="(files, why) => (refusal = t(`import.rejected.${why}`))"
/>
```

Three things it does that a zone drawn by hand usually does not:

- **`accept` holds for a drop too.** The platform only filters what the chooser offers; a dropped file
  is checked here against the same rule, and what it refuses comes back in `rejected` with the reason
  `'type'` instead of being lost. Several files landing where `multiple` is off come back as
  `'count'` — which one was meant is not the component's guess.
- **The same file can be chosen twice.** The input is cleared after every choice, so correcting a file
  and choosing it again is still heard.
- **The highlight does not flicker.** Moving over the zone's own text fires `dragleave` on the zone;
  the component counts enters and leaves, so the highlight holds until the file has actually left.

`files` is never an empty list; `disabled` makes both the drop and the click do nothing.

### Added — `DiffList`: what a change would do, or did, rendered from your answer

Titled groups of keyed rows, each with a status pill and the reason beside it. It judges nothing:
which rows exist, what each is called and which role tones it are yours, so the same list shows a
preview and an outcome. Every word is yours, the status's own included — a row carries `statusLabel`
beside its `status` role, because the same role reads *added* in one list and *applied* in another.

- Rows marked `folded` wait behind one toggle per group, reading your `foldedLabel` (the package
  neither counts nor pluralises) and telling a reader whether it is open.
- A row marked `marked` is drawn in its own role's tint, for the one a reader must not miss.
- The part column appears only where a group's rows have parts; a group with no rows draws its title
  and its `note`.
- It keeps one thing of its own — which groups are unfolded. A new answer is a new list.

New types: `DiffGroup`, `DiffRow`, `DiffColumns`.

Nothing existing changed; upgrading from `v0.6.0` needs no edit to an application already built on it.

## v0.6.0

### Added — `Icon` and `IconPicker`: a named glyph set, and the grid that chooses from it

Twenty-six glyphs drawn by this package, each named for its **shape** — `wrench`, `beaker`,
`calendar`, `truck`, `beetle` — and drawn at the family's stroke weight in the colour of the text
around them.

The reason they are named rather than drawn is that a mark is often **data**: somebody chooses it,
you store it, it travels in an exported configuration file, and something reads it back in a
different deployment. A name survives all of that and draws the same mark at the other end. So:

```vue
<Icon name="wrench" />
<Icon :name="kind.icon" :size="14" />
<Icon name="alert" :size="18" :label="t('task.overdue')" />
```

**A name this version does not know draws nothing at all** — no placeholder, no question mark, no
reserved space. That is deliberate: a column of empty wells says a setting was missed, a column with
nothing in it says nothing is wrong. Ask `isIconName(name)` first if you need to react to it, and
import `iconNames` for the whole set.

A glyph is decoration unless you say otherwise. Give `label` only where the mark carries meaning no
neighbouring text carries, and it is announced as an image by that name.

`IconPicker` is the grid, and it is a radio group rather than a row of buttons — **one** stop in the
page order, arrow keys inside it, wrapping, `Home` and `End` at the ends. Twenty-six separate tab
stops is what a hand-drawn grid produces, and it makes the keyboard walk the whole set to reach
whatever comes after it.

```vue
<IconPicker v-model="form.icon" :options="glyphs" :label="t('kind.icon')" :clear-label="t('kind.noIcon')" />
```

```ts
import { iconNames, type IconPickerOption } from 'uibyte'

const glyphs: IconPickerOption[] = iconNames.map((name) => ({ name, label: t(`glyph.${name}`) }))
```

**Which glyphs, and what each is called, are yours.** `options` carries finished, already-translated
labels — this package's own names are English shape words, which are identifiers rather than words
to put in front of somebody. `clearLabel` offers the way back to nothing; omit it and a chosen glyph
can never be unchosen.

The full set: `alert` · `beaker` · `beetle` · `bolt` · `box` · `calendar` · `cart` · `chat` ·
`check` · `clipboard` · `clock` · `doc` · `flame` · `grid` · `lock` · `mail` · `pen` · `people` ·
`plus` · `ruler` · `shield` · `star` · `tag` · `target` · `truck` · `wrench`.

### Changed — `NavIcon` draws from the same geometry

Nothing about it moves: same name, same nine names it accepts, same size default, and it still
always draws a mark rather than leaving a hole in a row. What changed is where the drawing comes
from — one definition per glyph, so a mark in a sidebar and the same mark on a row can no longer
drift apart. Asserted glyph for glyph in the suite.

**Nothing else moves.** Additive; no component, token or type changed.

## v0.5.0

### Added — `Tabs`, a strip of choices with the keyboard contract it announces

A row of choices, and optionally the panel under them. The behaviour is the point: `role="tablist"`
tells a reader that the arrow keys move along the strip, and a row that announces itself that way
and then does not move is worse than plain buttons, which promise nothing.

So the component owns all of it — the strip is **one** stop in the page order rather than one per
choice, the arrow keys move along it and wrap, `Home` and `End` go to the ends, disabled choices are
stepped over, choosing follows focus, and the panel is wired to the choice that opened it.

You own which one is chosen; the component only says which was asked for.

```vue
<Tabs v-model="section" :tabs="sections" :label="t('settings.sections')">
  <template #default="{ tab }">
    <GeneralPanel v-if="tab.key === 'general'" />
    <PeoplePanel v-else-if="tab.key === 'people'" />
  </template>
</Tabs>
```

```ts
import type { TabItem } from 'uibyte'

const sections: TabItem[] = [
  { key: 'general', label: t('settings.general') },
  { key: 'people', label: t('settings.people'), tag: String(people.length) },
  { key: 'billing', label: t('settings.billing'), disabled: true },
]
```

`TabItem` is `{ key, label, tag?, disabled? }`. `label` and `tag` are **already translated and
already formatted** — this package neither counts nor formats, so a count is a string. A `disabled`
choice is **shown, never hidden**: drawn dimmed, announced as unavailable, never activated, and
never given the strip's tab stop. Use it for something a person may need to know exists before they
can ask for it.

Omit the default slot and you get the strip alone — no panel is rendered and no `aria-controls`
promises one.

**Nothing existing moves.** Additive only; no component, token or type changed.

## v0.4.0

### Added — `FileChip`, a file described

The mark its own name implies, the name, a line of facts about it, and an optional badge. It
**formats nothing**: `meta` is a list of finished, already-translated strings drawn in the order you
give them, because `1.8 MB` versus `1,8 MB` is your locale's decision. The `badge` is a string,
never a state — the chip stores no copy of it, derives nothing and asks no one. An `action` slot
holds whatever the file can be done to, keeping its own accessible name and focus ring.

The badge's colour is derived, and its contrast was proven on the chip's own background rather than
on the tint the derivation targets — so a repointed palette still yields a legible badge.

## v0.3.0

### Added — two more pill looks, a page accent family, and a focus ring that survives a dark surface

- `StatusPill` gained `look`: `soft` (the default pair), `solid` (the loud form, for the one loudest
  thing on a row) and `outline` (the quiet form). **Volume, never meaning** — the status role carries
  the meaning, and the label and mark are never optional.
- An **accent family**: one `accent` value in, `--color-accent` for graphics and fills and
  `--color-accent-deep` darkened until it reads as text. Use `-deep` for anything textual; the base
  is deliberately not text-safe.
- `--color-console-focus`, derived from `--color-focus` and lightened until it is unmistakable
  against the console colour. A technically-passing dark ring still disappears in practice, so the
  floor there is far above the text ratio.

## v0.2.0

### Added — grouped navigation, and a destination shown but not open

- `NavGroup` (`{ key, label, items }`) — the sidebar draws one small uppercase eyebrow per group;
  the small-screen bottom bar flattens them.
- `NavItem.locked` — drawn dimmed with a lock glyph, stripped of navigation and announced as
  unavailable. **Locked, never hidden**: an area a role does not reach, or a capability not part of
  a plan, is a different message from an absence.
- `NavItem.tag` — a small uppercase chip after the label, already translated.
- `ShellLabels` gained the assistive-technology suffix used on locked rows.

### Added — a source-hygiene gate

The package is shared by unrelated applications and stays shareable only while it knows nothing
about any of them. A test now walks the whole source tree and fails on a consumer's vocabulary or on
a reference to a document a reader cannot resolve — previously upheld by remembering to check, which
is a habit rather than a rule.

## v0.1.1

### Added — the adoption guide

`docs/consuming.md`: the wiring steps, a symptom-to-cause table for the ways a host's build can go
wrong, the props and slots each component expects, and how to repoint the palette through the theme
builder so the derived values move with it.

## v0.1.0

Initial code.
