# Client for CrossCode Archipelago Integration

This is still under heavy development, though it works and will, for the most part, be pretty stable.

# Discord server

[**Join our Discord to help with alpha and beta testing.**](https://discord.gg/ZSWfgQdfGr)

# Setup guide

## How to generate your own multiworld with crosscode seeds

Download the APWorld file from the [releases page of the CrossCode development branch](https://github.com/CodeTriangle/Archipelago/releases/latest) and put it into `lib/worlds` in your Archipelago folder. **This integration requires Archipelago 0.4.2 to roll the seed**.

Then put your yamls in the `Players` directory and run the `Generate` program. If you need a yaml to build off of, we have some in the discord.

## How to host a multiworld with crosscode seeds

Either host it on archipelago.gg using the usual process or self-host. You should be able to use the `MultiServer` program from any up-to-date Archipelago installation regardless of whether it has the CrossCode APWorld. If you have issues, use the instructions above to install the CrossCode APWorld and then try again.

## How to join a multiworld with crosscode seeds

Install [CCLoader2](https://wiki.c2dl.info/CCLoader), then download the *most recent* [CCMultiworldRandomizer release](https://github.com/CodeTriangle/CCMultiworldRandomizer/releases/latest) and place it into the `assets/mods` directory. **Make sure you get the `.ccmod` file and not the source code zip for all mods downloaded.**

You will also need the following dependency mods:
* [CC-Open-World](https://github.com/buanjautista/cc-open-world/releases/latest) (version 0.1.7 or greater): this is to prevent softlocks when you inevitably sequence-break the game.
* [CCUILib](https://github.com/conorlawton/CCUILib/releases/latest): gives access to the text input box.
  * Note that as of writing this, there is a bug with CCUILib where pressing tab while a text input field is selected unfocuses the window. This is expected, just don't press tab. I've submitted a fixed release to the author, but that has not been released yet and I can't be bothered to package someone else's mod.
* [nax-module-cache](https://github.com/conorlawton/nax-module-cache/releases/latest): technically just a requirement for CCUILib.

Open CrossCode and start a new save file. I recommend New Game+ with the Skip Beginning option. Also consider using Get on My Level, especially if you are using open mode logic. You will start in the last stretch of the Rookie Dungeon. **The chests in the rookie dungeon are not in logic.**

Until further notice, you **must** associate an archipelago connection before collecting any chests beyond the Rookie Dungeon due to some latent bugs.

You will know if the mod is working when you get to space for the first time and you don't recieve the Disc of Insight and Green Leaf Shade as expected.

## Optional poptracker package

Courtesy of Lurch9229, you can have a fancier interface for tracking your progress. [See here for information](https://github.com/lurch9229/CrossCode-Poptracker-AP).

## How to get support

First off, thank you for beta testing! I truly appreciate it.

Second off, please make sure you are using the most recent version of both the mod and the APWorld. I will not provide support for outdated versions of either.

With that out of the way, here's what to do:
1. Join our [testing discord server](https://discord.gg/ZSWfgQdfGr).
2. Make sure you can see the #bug-report forum.
3. Create a new thread in that forum, following all the rules for posting. These include but are not limited to:
   * Software versions of all software involved.
   * What you did leading up to the issue.
   * The *expected* behavior.
   * The *actual* behavior (in enough detail that I could feasibly reproduce it).

I'm pretty active on Discord, so I should see your message within a few hours. For bugs that have a quick fix, I have generally been able to address them within a week. For more sophisticated bugs or for bugs that I suspect are hidden in code that will be rewritten later, I'll modify this page to include a workaround until such time as I can actually fix it.

# A note on versions

Every `x.0.0` version and every `0.y.0` version defines a new connection interface between client and server. In other words, You can use any mod with version `0.1.a` to talk to any server with an APWorld of version `0.1.b` server, regardless of what `a` and `b` are, but a client with version `0.2.a` and a server with version `0.1.b` will not be able to talk to each other. Similarly, `1.a.b` can talk to `1.c.d` but `2.a.b` cannot talk to `1.c.d`.
