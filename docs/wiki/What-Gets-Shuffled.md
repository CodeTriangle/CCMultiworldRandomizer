CCMultiworldRandomizer shuffles locations
in every main area in the game,
excluding DLC areas.
The default set of locations
includes all chests and cutscene items
in these areas.
Quest rewards and shop items
can additionally be added to the pool
by enabling their respective YAML options.

A small number of quests
contain items that unlock things
in the vanilla game.
The rewards of these quests
are also included in the randomizer,
but they are marked as "excluded" by default
if Quest Randomization is not enabled.
This means that if you don't want
to worry about quests,
they will not contain important items
and you will never need to check them.

Additionally, the Broken Weapons,
despite being part of the
*A Promise is a Promise* questline
are included in the pool.
The quests themselves are not in the pool
unless Quest Randomization is on.

The default set of locations
is about 250 locations in size.

## Quest Randomization

When Quest Randomization is enabled,
the rewards for all quests
(with a few exceptions)
will be randomized as well.
There will be one location in the world
for each item reward the quest has.

Items found while completing a quest
are not shuffled
(with the exception of
the *A Promise is a Promise* questline
explained in the last section),
so quests function mostly as units
that can be tackled
similar to how they are in vanilla.

Quest randomization adds
about **200** locations to the pool.

## Shop Randomization

Shop Randomization creates locations
that are sent by purchasing items from shops.
The particulars
of what Shop Randomization adds
depends on YAML options;
however, in all cases,
once a randomized slot is purchased,
the vanilla behavior of the slot returns
and its item can be purchased.

If **Shop Send Mode** is **Per-Item Type**,
then a location is added
for each type of item
(for example, Sandwich).
Therefore, purchasing a sandwich
from any shop in the game
clears the same check.
With this option,
about **60** locations are added.
If **Shop Send Mode** is **Per Slot**,
then a location is added
for each item slot in each shop.
Therefore, purchasing a Sandwich in Rookie Harbor
clears a separate check
than purchasing a Sandwich in Bergen Village.
With this option,
about **200** locations are added.

Shop slots are locked based on
the **Shop Receive Mode** option.
Read the template YAML
for more information on this option.
