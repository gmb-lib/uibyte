# Security policy

This is a design system: design tokens, an application shell, and accessible primitives that host
applications compile into their own bundles. It deploys nowhere, holds no state, calls no API and
enforces no permission. That narrows its security surface a great deal — but it does not remove it,
because this code decides how a host's data is **rendered**, and rendering is where untrusted
content becomes markup.

Please report security problems privately. Do not open a public issue, pull request or discussion
for anything that could be exploited before a fix exists.

## How to report

Use **[private vulnerability reporting](https://github.com/gmb-lib/uibyte/security/advisories/new)**
on this repository. The report stays visible only to you and the maintainers until an advisory is
published, and it gives us one place to discuss and co-ordinate a fix with you.

Please include, as far as you can establish it:

- what the problem is, and what an attacker gains from it;
- the smallest set of steps that reproduces it — which component, which prop, which value — and
  against which version or tag;
- whether it needs a particular host configuration;
- whether you have told anyone else, and whether a disclosure date already binds you.

## What happens next

- We acknowledge a report within **five working days**.
- We tell you whether we can reproduce it, and what we think its severity is, as soon as we know.
- We keep you updated while a fix is prepared, and we agree a disclosure date with you. Our default
  is to publish an advisory once a fix is available, and in any case within **90 days** of the
  report — earlier if the problem is already public or being exploited.
- We credit you in the advisory unless you would rather stay anonymous.

There is no bug-bounty programme. We are grateful anyway, and we say so publicly.

## What we consider most serious

- Any path where a caller-supplied value reaches the page as markup rather than text — rendered as
  HTML, or used unchecked as a link target, an image source, an inline style, or an event handler.
  A component that accepts content and renders it as markup is a cross-site-scripting hole in every
  application that uses it.
- A shell or navigation primitive presenting an item the host marked as locked or unauthorised as if
  it were available. This kit is never the enforcement point — which is exactly why it must not be
  the reason a person believes an action is theirs to take.
- A token or derived status pair that resolves to an unreadable or invisible combination, in either
  colour mode, where the meaning a person acts on *is* the colour. The rule that derives each status
  pair exists so this cannot ship; a case that escapes it is a real finding.
- Anything this package pulls into a host build that the host did not ask for: an added runtime
  dependency, a network request, a cookie, or use of browser storage. A design system that reaches
  the network is doing something it has no business doing.
- A build or packaging change that ships more than the documented file list, or that lets a
  postinstall or similar script run in a consumer's install.

Denial of service is not a meaningful class here. Reports about outdated dependencies are welcome
where you can show the vulnerable path is actually reachable in a consumer's build.

## Scope

This policy covers the code in this repository. It does not cover Vue, Vite or Tailwind CSS (report
those to their maintainers), or the applications that consume this package. Authorization,
authentication and data access are the host application's — a component displaying something it was
handed is not a finding against this repository unless the *display* is the defect.

## Supported versions

Security fixes land on the most recent release. Older tags are not patched; if you are pinned to
one, the fix is to move forward. This package is pre-1.0 and consumed as a pinned git tag: the API
may change between minor versions, and a security fix may arrive alongside such a change.
