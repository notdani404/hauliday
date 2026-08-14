# Drift check

Run this before calling any Dewey screen done, and when auditing existing work.

The honest risk with a personal design language is entropy: each project bends one rule for a good reason, and after two years there's no family left. These questions catch it early.

**One *no* is a discussion. Two is a drift.**

1. Is everything the machine wrote set in mono with tabular figures?
2. Does every raised surface sit on a hard offset shadow with no blur?
3. Does every status read correctly with the colour removed?
4. Is the primary action in the same place it is in every other product?
5. Can every dimension on screen be divided by four?
6. Is there exactly one component here that does not exist elsewhere in the family?

## On question six

This is the one that catches real drift, and it fails in **both** directions.

**Zero bespoke parts** means the product has no identity of its own and probably shouldn't be a separate dialect — it should just use dewey core.

**Three or more** means it has quietly forked. The honest move is to say so out loud rather than keep flying the family colours. A fork is a legitimate outcome; a silent fork is not.

## How to report a drift check

Don't just list pass/fail. For each *no*, state:

- which rule broke
- whether it's breaking the rule or honouring the reason behind it (see `dialects.md` — Sessionist's density inversion is legitimate; rounded corners because they look friendlier is not)
- the specific fix, with the token that should have been used

If a break is legitimate and recurring, propose it as a change to Dewey itself with a rev bump, rather than leaving it as a local exception. Silent exceptions are how design languages die.

## Fast visual audit

Three checks that catch most problems in seconds:

- **Greyscale it.** Any status you can no longer read fails question three.
- **Squint at the saturation.** More than roughly 5% of the screen saturated means a signal is being used decoratively.
- **Look for a blur.** One soft shadow anywhere means the elevation model has been abandoned, and usually means a component was pasted in from outside the system.
