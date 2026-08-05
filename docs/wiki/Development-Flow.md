Developing on the CrossCode Archipelago project
is less than self-explanatory.
This wiki page is meant to clarify the process.

# The Repositories

The code for this project
is split into **two main repositories**,
both of which
you will probably need to pull.
Within these repositories,
there are a variety
of individual programs
and moving parts
that need to be discussed.

## `CCMultiworldRandomizer`

* **Link:** https://github.com/CodeTriangle/CCMultiworldRandomizer

This is the main repository
providing code and assets for the mod
and the logic data for the randomizer
The code is primarily written in TypeScript.

### Input data

The input data is contained in `data/in`.
It contains the logic for the randomizer
and some information on items
and other random details.
This is documented in more detail
in [the Data-Format wiki page](Data-Format.md),
although that page is
a work in progress.

### Output data

The output data, `data/out`,
is created by the [Code Generator](#code-generator)
and has three files:

* `data.json` has certain attributes
  used by the mod during runtime
  including the links between
  location IDs
  and their locations in-game,
  item descriptions,
  and chest marker locations.
* `items.json` caches item IDs
  so that subsequent generations
  still use the same item IDs.
* `locations.json` caches location IDs
  so that subsequent generations
  still use the same location IDs.

## `CodeTriangle/Archipelago`

* **Link:** https://github.com/CodeTriangle/Archipelago

This is my fork of the Archipelago project
with all of the code required
to perform randomization of CrossCode
including generating
Archipelago's native logic rules
from the logic data in `CCMultiworldRandomizer`.
It is primarily written in Python,
as that is the language
that Archipelago is written in.

### APWorld

The APWorld is the combination of code
that informs Archipelago
how to randomize a game.
This code is contained in `worlds/crosscode`
and all of its submodules
except for `codegen`.

### Code Generator

The code generator is a module
that produces portions
of the [apworld](#apworld),
including Python code
representing the items, locations,
and logic rules
included in the [input data](#input-data).
It also creates
the [output data](#output-data)
for use by the mod.
The code for this
is in `worlds/crosscode/codegen`.

## `ccap-yamls`

* **Link:** https://github.com/CodeTriangle/ccap-yamls

Various sets of YAMLs that I use
to prove generation
with different sets of options.
You likely don't need this,
but it can be helpful
if you are testing new options.

# Working on the Code

Depending on the work you are doing
you may not need all of the repositories,
but it might be a good idea
to get ahold of them anyway.

## Cloning

First, you'll need to get the repositories.
Clone [`CCMultiworldRandomizer`](#ccmultiworldrandomizer)
into your `assets/mods` folder
in your modded CrossCode installation.
It does not matter where you clone
my fork of Archipelago.
If you already checked out another fork
or the original,
you can just add my fork as a remote.

The primary branch of development
for `CCMultiworldRandomizer`
is `master`.
It usually has the code for the upcoming release
with current maintenance branches
being contained in `0.5-dev`, etc.

The primary branch of development
for `Archipelago` is `crosscode-dev`,
with maintenance happening
on `crosscode-0.5-dev`, etc.

## Setting up the Mod Workspace

`CCMultiworldRandomizer` uses
a node-based environment
to build the code.
Get `npm` or `pnpm`
and run `npm install` or `pnpm install`
to download all relevant packages.

You can run `npm start`
to compile the code for the mod,
or `npm run watch`
to continuously monitor changes
and rebuild the code as they happen.

CrossCode mods are pretty simple in structure,
so assuming the mod folder
is in the right place,
just loading the game
after building the mod
should get you your dev build.
The only thing to be aware of
is that dependency management
will not be handled for you.
Either get them from the mod manager
or download them yourself.

## Setting up the Archipelago Workspace

This is comparatively simpler.
Download python,
then set up a virtual environment.
Running any script
will prompt you to download
any dependencies;
there is no centralized `requirements.txt` file.

## Generate Logic

If you have changed logic
or anything else in the [input data](#input-data)
and you want to test those changes,
you will need to run the [code generator](#code-generator).
This is a bit of a process.

First, you will have to create symlinks
from your CrossCode installation.
Copying files back and forth
would also work,
but it would be a lot
of unnecessary manual labor,
so use symlinks if possible.
Do the following:

* Symlink `CCMultiworldRandomizer/data/in`
  to `worlds/crosscode/data/in`
* Symlink `CCMultiworldRandomizer/data/out`
  to `worlds/crosscode/data/out`
* Symlink `CrossCode/assets`
  to `worlds/crosscode/data/assets`

The original CrossCode files
are necessary for this step
as many small elements
are cross-referenced
instead of being included
in the input data.

Then, to run the code:

```sh
python -m worlds.crosscode.codegen
```

## Generate a Multiworld

In your Archipelago directory,
place YAMLS in `Players`
then run:

```sh
python Generate.py
```

*Protip:*
I tend to keep a lot of different
sets of YAMLs lying around,
for instance, the ones in [`ccap-yamls`](#ccap-yamls).
Check out the `--help` flag
for `Generate.py`
and you'll find some interesting options.
I like to use the `--player_files_path` option
instead of moving things
in and out of the `Players` directory itself.

## All Other Archipelago Tasks

Look through
[the Archipelago documentation](https://github.com/ArchipelagoMW/Archipelago/tree/main/docs),
stored in the repository itself,
to learn what else you can do
with your Archipelago development environment.
In particular,
you may be interested
in running tests.

## Packaging Files for Distribution

If you want to give out files
for other players to use,
you will need to generate them.

### Bundled ccmod

To create a ccmod,
run the following:
```javascript
npm run bundle
```

You can also give it a flag
to include in the version name
as an additional suffix
by pasing an additional string argument.

### Bundled apworld

To create the APWorld,
run the following
in the root of
your clone of Archipelago:

```sh
python -m worlds.crosscode.bundle
```

### Template YAML

To create a template YAML
with any options changes
you have added to the APWorld,
open a python interactive session
and run the following.

```python
__import__("Options").generate_yaml_templates("./Players/Template")
```

Then copy `Players/Template/CrossCode.yaml`.
