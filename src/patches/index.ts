import type MwRandomizer from "../plugin";

import { patch as patchMwModel } from "./multiworld-model";
import { patch as patchChest } from "./chest";
import { patch as patchEntities } from "./entity";
import { patch as patchEvent } from "./event";
import { patch as patchMarquee } from "./marquee";
import { patch as patchGui } from "./gui-misc";
import { patch as patchMWHud } from "./multiworld-hud";
import { patch as patchQuest } from "./quest";
import { patch as patchShop } from "./shop";
import { patch as patchNewGame } from "./new-game";
import { patch as patchTextClient } from "./text-client";
import { patch as patchMenus } from "./menus";
import { patch as patchLogin } from "./login";
import { patch as patchMap } from "./map";
import { patch as patchDeathLink } from "./deathlink.ts";

export function applyPatches(plugin: MwRandomizer) {
	patchMwModel(plugin);
	patchChest(plugin);
	patchEntities(plugin);
	patchEvent(plugin);
	patchMarquee(plugin);
	patchGui(plugin);
	patchMWHud(plugin);
	patchQuest(plugin);
	patchShop(plugin);
	patchNewGame(plugin);
	patchTextClient(plugin);
	patchMenus(plugin);
	patchLogin(plugin);
	patchMap(plugin);
	patchDeathLink(plugin);
}
