import MwRandomizer from "../plugin";

declare global {
	namespace sc {
		namespace OpenWorld {
			type OptionState = ig.VarValue;
			type OptionList = Array<OptionState | null>;
		}

		interface OpenWorld {
			lastOptionList: OpenWorld.OptionList;

			addMWPatches(this: this, optionList: OpenWorld.OptionList): void;
			handlePatching(this: this, patchState: OpenWorld.OptionState, patchName: number): void;
		}

		interface OpenWorldConstructor extends ImpactClass<OpenWorld> {
			new(): OpenWorld;
		}

		var OpenWorld: OpenWorldConstructor;

		var openworld: OpenWorld;
	}
}

export function patch(plugin: MwRandomizer) {
	// Definition for Extra Patches
	const R_SHADELOCK = 0 // Shade barrier for vermillion tower
	const R_VTSKIP = 1 // Skip all Vermillion Tower after first fight
	const R_OPENFAJRO = 2 // Non-linear Upper Fajro
	const R_METEORVW = 3 // Vermillion Wasteland locked behind Meteor Shade
	const R_EXTRABARRIER = 4; // Extra barriers and shade-accesible teleport in CrossCentral
	const R_CLOSEDGAIA = 5; // Extra barriers in Gaia's Garden
	const R_DLCACTIVE = 6; // DLC Features
	const R_EXTRAQUESTS = 7; // DLC Features

	const mod = plugin.mod;

	sc.OpenWorld = ig.Class.extend({
		// Multiworld Patching
		addMWPatches(optionList) {
			if (optionList){ // Checks for MW extra patch list
				if (this.lastOptionList != optionList) {
					mod.runtimeAssets = {};
				}
				for (let x = 0; x < optionList.length; x++) {
					// Convert vars from mw.options into the open-world vars 
					this.handlePatching(optionList[x] ?? false, x);
				}
				this.lastOptionList = optionList;
				return true;
			}
		},

		handlePatching(patchstate, patchname) {
			// console.log("patching: ", Object.keys(DEFAULT_OPTIONS)[patchname], patchstate)
			if (patchstate) { // Adds patches
				switch(patchname) {
					case R_SHADELOCK:
						mod.addPatch('data/maps/arid/town-1.json', mod.baseDirectory + 'assets/data/maps/arid/town-1.json.patch');
						if (Number(patchstate) > 0) { 
							ig.vars.set("open-world.shadeLock", patchstate);
							ig.vars.set("open-world.towerLock", 1);
							mod.addPatch('data/maps/arid/town-1.json', mod.baseDirectory + 'extra-patches/locked-tower/shadebosslock-vt.json.patch');
						}
						else { ig.vars.set("open-world.towerLock", 0); }
						break;
					case R_VTSKIP:
						ig.vars.set("open-world.towerSkip", patchstate);
						mod.addPatch('data/maps/arid-dng/second/f0/center.json', mod.baseDirectory + 'extra-patches/tower-skip/centerf0.json.patch');
						break;
					case R_OPENFAJRO:
						ig.vars.set("open-world.openFajro", patchstate);
						mod.addPatch('data/maps/heat-dng/f3/room-01-cross.json', mod.baseDirectory + 'extra-patches/open-fajro/f3/room-01-cross.json.patch');
						mod.addPatch('data/maps/heat-dng/f3/room-02.json', mod.baseDirectory + 'extra-patches/open-fajro/f3/room-02.json.patch');
						mod.addPatch('data/maps/heat-dng/f3/room-06.json', mod.baseDirectory + 'extra-patches/open-fajro/f3/room-06.json.patch');
						mod.addPatch('data/maps/heat-dng/f3/room-07.json', mod.baseDirectory + 'extra-patches/open-fajro/f3/room-07.json.patch');
						mod.addPatch('data/maps/heat-dng/f4/corridor-east.json', mod.baseDirectory + 'extra-patches/open-fajro/f4/corridor-east.json.patch');
						mod.addPatch('data/maps/heat-dng/f4/room-01.json', mod.baseDirectory + 'extra-patches/open-fajro/f4/room-01.json.patch');
						mod.addPatch('data/maps/heat-dng/f4/room-03.json', mod.baseDirectory + 'extra-patches/open-fajro/f4/room-03.json.patch');
						mod.addPatch('data/maps/heat-dng/f4/room-10.json', mod.baseDirectory + 'extra-patches/open-fajro/f4/room-10.json.patch');
						break;
					case R_METEORVW:
						ig.vars.set("open-world.meteorPassage", patchstate);
						mod.addPatch('data/maps/forest/path-10-hidden.json', mod.baseDirectory + 'assets/data/maps/forest/path-10-hidden.json.patch');
						mod.addPatch('data/maps/forest/path-10-hidden.json', mod.baseDirectory + 'extra-patches/meteor-vw/passage-barrier.json.patch');
						break;
					case R_EXTRABARRIER:
					sc.OPTIONS_DEFINITION["openworld-visitedMaps"] = {
						type: "CHECKBOX",
						init: false,
						cat: sc.OPTION_CATEGORY.GENERAL,
						hasDivider: true,
						header: "cc-open-world",
					};
					sc.OPTIONS_DEFINITION["openworld-visitedMaps"] = {
						type: "CHECKBOX",
						init: false,
						cat: sc.OPTION_CATEGORY.GENERAL,
						hasDivider: true,
						header: "cc-open-world",
					};
						ig.vars.set("open-world.rhombusHubUnlock", patchstate);
						break;
					case R_CLOSEDGAIA:
						ig.vars.set("open-world.closedGaia", patchstate);
						break;
					case R_DLCACTIVE:
						ig.vars.set("open-world.dlcActive", patchstate);
						break;
					case R_EXTRAQUESTS:
						ig.vars.set("open-world.extraQuests", patchstate);
						break;
					} 
			}
		}
	});

	sc.openworld = new sc.OpenWorld();
}
