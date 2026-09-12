# How the status colours are derived

Each status role is set by **one** value — the saturated form, used for the dot.
Its background, foreground and border are computed from that value and the
surface it sits on. This file records the choices behind that computation,
because changing any of them silently changes the palette of every application
built on this package.

## Why derive at all

Exposing a background, a foreground and a border as separate knobs means a host
who repoints one of them ships an unreadable label. Deriving them from a single
value makes legibility a property of the system instead of a review comment.

The direction is one-way: the role colour produces the rest, and nothing ever
produces a role colour from a background. That is what keeps the unreadable
combination unreachable rather than merely discouraged.

## The derived values

| Value | Rule |
|---|---|
| background | the role colour at 12% over the surface |
| border | the role colour at 28% over the surface |
| foreground | the role colour darkened until it clears 4.5:1 against that background |
| solid background | the role colour darkened until **white** clears 4.5:1 against it (the loud look's fill; white is its fixed foreground) |

Two further families use the same machinery:

| Value | Rule |
|---|---|
| accent-deep | the accent colour darkened until it clears 4.5:1 against the page surface — the accent's text form |
| console focus ring | the focus colour moved toward whichever extreme has more headroom against the console surface, until it clears **9:1** |

**Why the ring's floor is 9:1 and not 4.5:1.** The number is empirical. A ring
measuring 5.5:1 against a near-black surface was still reported hard to see in
live use — a small area of a dark saturated hue disappears long before the
ratio says it should — while the look that was accepted measures 9.6:1. The
floor sits above the measured failure and just under the accepted look. The
direction adapts: on a dark surface the ring lightens, on a light one it
darkens, and a surface too middling for either direction fails loudly.

## The choices, and why

**Mixing happens in OKLab.** Mixing in sRGB drags a saturated colour through a
darker, greyer path on its way to a light surface, so a 12% tint of a vivid
colour arrives muddy. OKLab is close enough to perceptually uniform that a small
amount of a colour reads as a clean tint of it.

**Darkening happens in OKLCh, holding chroma and hue.** Lowering lightness in
OKLCh keeps the colour recognisably the same colour. The obvious alternatives
are worse: HSL lightness shifts perceived hue badly around blue and yellow, and
mixing toward the ink colour desaturates as it darkens, so a strong role colour
arrives washed out at exactly the point where it carries the most meaning.

**The amount of darkening is searched, not fixed.** This is the important one.
Luminance at a given lightness varies enormously with hue — a yellow and a blue
at the same OKLCh lightness are nowhere near the same brightness — so any fixed
step is either not enough for one hue or far too much for another. A binary
search over lightness finds the *largest* value that still clears the ratio,
which darkens each hue exactly as much as it needs to and no more. Against the
reference palette this lands between 4.50:1 and 4.54:1: at the requirement, not
comfortably past it, which is what "no more than it needs" means.

**Contrast is measured in sRGB.** The accessibility requirement is defined in
terms of sRGB relative luminance, so it is evaluated there rather than in the
space used for the search. The two spaces are each used for what they are for.

**Every check is made against the rounded value.** A colour that clears the
ratio at full precision can fall a hundredth under it once written as six hex
digits, and the ratio that matters is the one a browser paints. Candidates are
rounded to what a stylesheet can express before being measured — without this,
derived pairs land at 4.48:1 while every intermediate calculation insists they
passed.

**Out-of-gamut results lose chroma, not hue.** A darkened colour can fall
outside sRGB; chroma is reduced until it fits, holding lightness and hue. Letting
a channel clip instead would shift the hue, which is the one thing the
derivation is supposed to preserve.

**An impossible request throws.** If no lightness of a hue can reach the ratio
against the given background, the derivation fails loudly rather than returning
the closest miss.

## What is deliberately not guaranteed

An **explicit pair** supplied by a host is taken verbatim, including an
unreadable one. Overriding is how a host says "I know exactly what I want here";
the guarantee lives in the derivation, and opting out of the derivation opts out
of the guarantee.

Repointing a role by **overwriting the custom property in a stylesheet** changes
the dot but not the values already computed from it — the result stays legible,
because those values are still a derived, checked pair, but it no longer matches
the colour it came from. Repointing through the theme builder recomputes them
together. This is why the builder, and not the stylesheet, is documented as the
way to re-skin.

## How this is kept true

The stylesheet is generated from the rule, never typed by hand, and a test fails
if the file on disk disagrees with what the rule produces today. The contrast
floor is checked for the reference palette, for deliberately hostile inputs
(pure white, pure black, fully saturated primaries, the surface colour itself),
across a sweep of the entire hue circle at five chromas and five lightnesses,
and again by parsing the published stylesheet back and measuring the pairs it
actually declares.
