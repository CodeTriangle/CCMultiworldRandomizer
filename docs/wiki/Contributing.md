## My philosophy on contribution

CrossCode's integration with Archipelago is a passion project of mine. It is my project that I work on during my
evenings and weekends. As such, it does not receive much focus in my life. By the time I'm finished writing code for my
job, I sometimes don't even want to write any code. When I do feel up to it, I don't want to write code I'm not
interested in, and I don't have to since no one is paying me to do this work.

That means that my limited time is spent on, in decreasing order of importance, fixing bugs, working on features that I
think would make the randomizer broadly more fun to the most people, and working on features that would improve my
personal experience with the randomizer. I will not work on features that I don't believe are likely to improve the
experience substantially compared to the effort put in.

But hope is not lost. I consider the active and interested community surrounding this project to be its single most
important aspect. If you have a feature that you think other people would like, or if you have something that only
interests you, or if I'm simply not getting around to adding something fast enough, you're more than welcome to step
in and work on it yourself.

## Where you come in

I am of the opinion that CrossCode AP is fairly easy to contribute to. There are a few ways to do this, depending on
what exactly you want to achieve.

I am more than willing to help you out as well to explain anything that's not clear and even change the randomizer
itself to accommodate your changes better. Please reach out if this interests you.

### Logic Contributions

All logic for CrossCode Archipelago is stored in the [`data/in/`](https://github.com/CodeTriangle/CCMultiworldRandomizer/tree/master/data/in)
directory in the CCMultiworldRandomizer repository as JSON files. It should be pretty easy to make whatever changes that
you need. Ongoing documentation of the JSON format used by these files is stored on the [Data Format](Data-Format.md)
page. If you're interested in adding new logic or fixing logic bugs, it can all be done through this.

Please discuss new logic in the **#logic** channel of the Discord.

### Code Contributions

For more detailed information, see the [Development-Flow wiki page](Development-Flow.md).

#### CCMultiworldRandomizer

CrossCode is an easy game to mod. The game is written in JavaScript, one of the most well-known programming languages.
Since JavaScript can't be compiled, you have the entire source code of the game available for your viewing pleasure at
`assets/js/game.compiled.js` in your CrossCode installation. Give it a look! It's long, but many procedures are not too
hard to parse.

It is possible to get a development environment for CCMultiworldRandomizer up and running in minutes, and once you make
the changes, it's all just a reload away.

If you want to learn the ropes of modding CrossCode, please discuss this in **#cc-modding-discussion** in the Discord.

#### APWorld

CCMultiworldRandomizer is only one half of the equation. Anything involved with generating the world happens in my own
fork of the Archipelago project, located [here](https://github.com/CodeTriangle/Archipelago). Archipelago is written in
Python, a language which is very easy to learn. Unfortunately, in CrossCode's case, this is one of the more complex
parts to modify yourself because large portions of the code, especially the code describing the logic, is generated from
the input data. As long as you're not touching logic, it should be possible to change things with no additional setup;
however, if you'll be working with logic in any form, you will also need to take some additional steps. Documentation on
that process is available [here](Development-Flow.md#generate-logic).

## Ongoing Community Projects

The following is a list of current community-driven efforts to expand the project. Please contact the people listed for
information on progress and how you can help.

### Glitched Logic

An effort to add barrier skips and other glitches to the logic of the randomizer, enabling faster access to regions
based on the player's skill.

Discuss this project in **#development-general** or **#logic**.

**Contributors:**

* @sterlia (Discord) / @TheShadowOfLight (GitHub)
