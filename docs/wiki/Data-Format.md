This page contains an explanation of the data format which is used to determine which locations, items, and regions
exist in a particular world, as well as various additional attributes. This data is found in the `data/in` directory in
the CCMultiworldRandomizer project. It is written exclusively in JSON.

## Directory and file structure

The input data is not kept as one file; instead, it has been broken into multiple composable chunks. The main file is
`master.json`. This file is the starting point. Other files in the directory are imported in, using this file as a base.
Essentially, starting with `master.json`, all of the other files are merged in. Directories within `data/in` may exist.
Traditionally, they will have their own `master.json` file, which can merge in other files as well.

Each file's root must be an object. Keys within this object prefixed with an underscore are special keys,
which inform the preprocessor how to deal with these files. The most important special key is `_includes`, which
contains a list of files to merge into this one. Traditionally, an `_includes` key should be present in the
`master.json` file of each directory. Another important key is `_comment`, which gets stripped before files are merged.

Other special keys are more advanced and will be discussed in other sections.

### Specifics on merging

When a file (the addon) is merged into another file (the original), the preprocessor goes key-by-key through the root
object of the addon.

* If the key does not exist in the original, it modifies the original by inserting the key and its value from the addon.
* If the key *does* exist in the original:
  * If both the original and addon store objects at that key, it recursively merges them.
  * If both the original and addon store arrays at that key, it appends the addon's array to the original's array.
  * If the types do not match up or if one or both are strings, numbers, or booleans, it throws an error.

If this is confusing to you, just know that if your file has a field in it that other files do not have, it will be
added on, no matter how many levels deep you are.

## World structure

The "world" in this document refers to the data after it has been merged. The world data for CrossCode has the following
important keys:

- `regions`: Controls the regions that exist in the world. Regions are groups of locations that have similar logic to
  reach.
- `chests`, `cutscenes`, `elements`, `quests`: Contain lists of location. They are separated by type of check.
- `items`: Controls the list of items that exist in the world, including their names and internal game IDs.
- `itemPools`: Contains various pools of items which may be added to the world wholesale or drawn from
  probabilistically.
- `progressiveChains`: Contains lists of progressive items (items that should be given in sequence).
- `vars`: Contains definitions of variables, which can stand in for conditions that may change between different worlds.

### Regions

`regions` takes the form of an object containing different "logic modes" and their associated list of region
connections. Logic modes that currently exist are `linear` and `open`. More may be added later.

Inside of each child of `regions`, the following keys *must* exist:

- `connections`: A list of objects representing paths between regions. `from` is the region the connection comes from,
  `to` is the region the path leads to, and `condition` is a list of conditions that must be met to access the
  connection.
- `exclude`: A list of regions whose locations should not be included in the game. This exists for legacy reasons and
  should probably be kept empty in new code.
- `start`: The region where the player starts.
- `end`: The region where the player's goal resides.

### Locations

There are multiple different lists of locations, each tied to a particular method of acquiring the item at that
location. The types will be enumerated below, but the following are common attributes for each location:

- `region`: An object mapping logic modes to the region the location is found in for that logic mode.
- `reward`: The list of items acquired from the locations. In versions 0.1 through 0.4, this is used to indicate that
  the item should be added to the world's pool, but version 0.5 introduces custom item pools, with items that are
  relevant to every playthrough being hand-picked and filler items being added randomly from pools. This means it is no
  longer strictly necessary to track which item comes from where, but the length of this list still indicates how many
  items are given as a reward, and it may be used later, so it should be kept up to date.

  It's important to note that reward is a list because sometimes multiple checks will be sent out for completing the
  same task. This is the case with quests. Currently, no other type of location sends out multiple checks in this way,
  though it is theoretically possible.
- `condition`: A list of conditions that must be met to be able to access this location.

Additionally, most locations have a `location` field, which gives internal information about how to find the location in
game. Quests use their own system for this.

#### Chests

Chests have the additional key `clearance`:

- `clearance`: One of `Default`, `Bronze`, `Silver`, or `Gold`. This controls which key is necessary to open the chest.

The `location` field for chests includes two fields:

- `map`: The filename, excluding extensions and with slashes (`/` or `\`) replaced with dots (`.`), inside of
  `assets/data/maps`, where the chest is located.
- `mapId`: The value of `.settings.mapId` in the chest's entity data.

#### Cutscenes

Cutscenes refer to a variety of things, primarily Literal cutscenes where the game stops and plays out a sequence that
gives the player an item and items received in dialog encounters with an NPC. The previous name for cutscenes is
"event". That name is more informative, as it uses CrossCode's internal system of "events", which are lists of actions
that the game plays out while the player is not in control. This system works by replacing `GIVE_ITEM` events or
whatever else might cause the player to check a location with a different event that gives them the Archipelago item
associated with that location or sends the item to another world. The easiest way to figure out the system is by just
diving into the game's files.

Cutscenes have no additional keys.

The `location` value for cutscenes includes three fields:

- `map`: The filename, excluding extensions and with slashes (`/` or `\`) replaced with dots (`.`), inside of
  `assets/data/maps`, where the event takes place.
- `mapId`: The value of `.settings.mapId` in the data of the entity where the event list is stored.
- `path`: The period-separated path, leading from the root of the entity data to the event to be replaced. Numbers
  as a path element indicate the index into the array.

#### Elements

Elements are Heat, Cold, Shock, or Wave. Elements have no additional keys.

The `location` value of elements includes two fields:

- `map`: The filename, excluding extensions and with slashes (`/` or `\`) replaced with dots (`.`), inside of
  `assets/data/maps`, where the element is located.
- `mapId`: The value of `.settings.mapId` in the entity data for the cutscene which gives the element. All instances of
  the `SET_PLAYER_CORE` event whose index matches that of an element unlock are replaced with checking the Archipelago
  location.

#### Quests

Quest locations represent the results of completing quests. Quest locations do not include cutscenes found while playing
a quest.

Quests are unique in that they often have multiple rewards because completing a quest checks multiple locations. They
also occasionally have no reward because they don't give any checks in vanilla. This is treated as containing one check
which adds a random filler item to the item pool.

Quest locations do not have a `location` value, though perhaps they should. Instead, they utilize a `questId` value,
which can be found in `assets/data/database.json` inside of `"quests"`.

### Variable conditions

Variable conditions (simply called `vars` in the data) are conditions which may change based on different factors
decided by the player's YAML options. For example, the Archipelago option `vt_shade_lock` controls what is required
for the `vtShadeLock` variable condition to be satisfied.

Variable conditions definitions are structured as an object containing different possible condition lists which may be
associate with that variable. Multiple different values of the variable may be specified, in which case the conditions
listed for each included value are all required. For example:

```json
"vtShadeLock": {
  "shades": [
    [ "item", "Blue Ice Shade" ],
    [ "item", "Red Flame Shade" ],
    [ "item", "Purple Bolt Shade" ],
    [ "item", "Azure Drop Shade" ]
  ],
  "bosses": [
    [ "cutscene", "Temple Mine Shade Statue"],
    [ "cutscene", "Faj'ro Shade Statue"],
    [ "cutscene", "Zir'vitar Shade Statue"],
    [ "cutscene", "So'najiz Shade Statue"]
  ]
},
```

When the option `vt_shade_lock` is set to `shades`, then whenever the associated variable condition is required, that
means that it requires all of the conditions listed in `shades`. When it is set to `bosses`, it requires all of the
conditions listed in `bosses`. When the option is set to `shades_and_bosses`, it requires all conditions in both
categories.

## Important data structures

There are a few structures that appear in many places inside the data. They have been extracted into this section.

### Conditions

Conditions take many forms:

* `[ "item", "$item_name", $quantity ]`: the player must have at least `$quantity` of the item `$item_name` (this only
  works for progressive items).
* `[ "location", "$location_name" ]`: the player must be able to reach the location `$location_name`.
* `[ "quest", "$quest_name" ]`: the player must be able to complete the quest `$quest_name`.
* `[ "region", "$region_name" ]`: the player must be able to reach the region `$region_name`.
* `[ "any_element" ]`: the player must have one of the four elements (for instance, to light up a lamp).
* `[ "var", "$var_name" ]`: the conditions contained by the world's value of the variable `$var_name` must be satisifed.

By default, you have to meet all the conditions in the condition list. If you want to have an either or scenario, you
can use `[ "or", $condition1, $condition2]` for that.

### Items

Items given to the player (primarily due to being received as rewards) come in a few different varieties as well:

* `[ "item", "$item_name", $amount ]`: The item gives `$amount` instances of the item `$item_name`.
* `[ "element", "$element_name" ]`: The item bestows the ability to use the element `$element_name`.
* `[ "sp_upgrade" ]`: The item increases the player's SP cap by 4.
