## How long does it take to complete CrossCode randomized?

CrossCode is a long game. Without quest randomization, there are about 250 locations, most of which require significant
effort to reach. Gaia's Garden itself has over 60 chests, most of which are only accessible after long platforming
puzzles spanning multiple screens. One area in CrossCode is the size of a shorter Archipelago game. Without quests, runs
can take 6-10 hours, and with quests that number is closer to 12-15.

## What's up with these weird-colored chests?

Because CrossCode is such a long game, it has proven to be very helpful for the player to differentiate at a glance
between chests that should be prioritized and chests that are not as relevant to logic. Therefore, chests are
color-coded and given symbols according to what kinds of items they contain. Green chests with the `!!` symbol are
progression items and should probably be opened if possible. Deep blue chests with the `+` symbol are useful items. They
are not relevant to logic, but they might help another player to finish their game easier. Light blue chests with the
Archipelago logo contain filler items. Their contents are often less than helpful. Light blue chests with no logo (the
kind that look like vanilla chests) are not shuffled. Chests containing traps appear as if they contained useful items.

## Is there a way to figure out which chest is which?

Yes! Enter analyze mode (left on the quick menu) and hover any unopened chest in the game. A dialog will appear
indicating the chest's name and what type of item it contains (filler, useful, or progression).

## I can't hint the shade that I need to continue! What do I do?

You probably have `progressive_area_unlocks` set, which replaces all instances of particular shades and passes with the
correct number of items named "Progressive (something) Unlock".

Depending on the value of that option, you need to search for different things:

| Item | `dungeons` | `overworld` | `split` | `combined` |
|---|---|---|---|---|
| Green Leaf Shade  | Green Leaf Shade | Progressive Overworld Area Unlock | Progressive Overworld Area Unlock | Progressive Area Unlock |
| Mine Pass         | Progressive Dungeon Unlock | Mine Pass         | Progressive Dungeon Unlock | Progressive Area Unlock |
| Blue Ice Shade    | Blue Ice Shade   | Progressive Overworld Area Unlock | Progressive Overworld Area Unlock | Progressive Area Unlock |
| Yellow Sand Shade | Progressive Dungeon Unlock | Yellow Sand Shade | Progressive Dungeon Unlock | Progressive Area Unlock |
| Red Flame Shade   | Red Flame Shade  | Progressive Overworld Area Unlock | Progressive Overworld Area Unlock | Progressive Area Unlock |
| Green Seed Shade  | Green Seed Shade | Progressive Overworld Area Unlock | Progressive Overworld Area Unlock | Progressive Area Unlock |
| Purple Bolt Shade | Progressive Dungeon Unlock | Purple Bolt Shade | Progressive Dungeon Unlock | Progressive Area Unlock |
| Azure Drop Shade  | Progressive Dungeon Unlock | Azure Drop Shade  | Progressive Dungeon Unlock | Progressive Area Unlock |
| Star Shade        | Star Shade       | Progressive Overworld Area Unlock | Progressive Overworld Area Unlock | Progressive Area Unlock |
| Meteor Shade      | Meteor Shade     | Progressive Overworld Area Unlock | Progressive Overworld Area Unlock | Progressive Area Unlock |
| Azure Archipelago Pass\* | Azure Archipelago Pass | Progressive Overworld Area Unlock | Progressive Overworld Area Unlock | Progressive Area Unlock |
| Ancient Shade\*   | Progressive Dungeon Unlock | Ancient Shade     | Progressive Dungeon Unlock | Progressive Area Unlock |

\* Only shuffled when DLC is enabled

## The mod won't update past 0.7.0. What do I do?

This is due to a change in the mod repositories. In fact, no mods will update in this state. The simplest solution to
this is to simply reinstall CCLoader. Simply follow the [installation instructions](https://wiki.c2dl.info/CCLoader)
once again. You can also change the repositories manually, but this is more manual a process. Ask for help on the
Discord if you are interested in doing this.

## Is glitched logic supported?

No, and it probably will never be.
The reason is that even the simplest of glitches blow this game wide open. Barrier skips, which are easy in concept if
not execution, destroy what little progression gating there is, which would make almost every overworld check an
instant sphere 1. Flare jumps, another popular glitch, allow you to get almost anywhere in a dungeon as long as you have
heat.

Glitched logic in CrossCode, as far as anyone has been able to think to implement it, basically just means no logic.

## Will you support *X*?

Maybe. Before asking us on Discord, you may want to search for previous conversations on the topic. You're free to bring
it up again with your own spin on the idea. Or, if you're interested, you can also [work on it yourself](Contributing.md).
