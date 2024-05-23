import type MwRandomizer from "../plugin";

import { patch as patchChest } from "./chest";
import { patch as patchEntities } from "./entity";
import { patch as patchEvent } from "./event";
import { patch as patchGui } from "./gui-misc";
import { patch as patchMWHud } from "./multiworld-hud";
import { patch as patchQuest } from "./quest";
import { patch as patchNewGame } from "./new-game";

export function applyPatches(plugin: MwRandomizer) {
	patchChest(plugin);
	patchEntities(plugin);
	patchEvent(plugin);
	patchGui(plugin);
	patchMWHud(plugin);
	patchQuest(plugin);
	patchNewGame(plugin);
}
