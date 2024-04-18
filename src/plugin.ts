import * as ap from 'archipelago.js';
import {WorldData, RawElement, RawQuest, ItemInfo} from './item-data.model';
import {readJsonFromFile} from './utils';
import "./types/multiworld-model.d";
import {applyPatches} from "./patches/index";

export default class MwRandomizer {
	baseDirectory: string;
	randoData: WorldData;
	itemdb: any;

	constructor(mod: {baseDirectory: string}) {
		this.baseDirectory = mod.baseDirectory
	}

	getColoredStatus(status: string) {
		switch (status.toLowerCase()) {
			case ap.CONNECTION_STATUS.CONNECTED.toLowerCase():
				return `\\c[2]${status}\\c[0]`;
			case ap.CONNECTION_STATUS.DISCONNECTED.toLowerCase():
				return `\\c[1]${status}\\c[0]`;
			case ap.CONNECTION_STATUS.WAITING_FOR_AUTH.toLowerCase():
			case ap.CONNECTION_STATUS.CONNECTING.toLowerCase():
				return `\\c[3]${status}\\c[0]`;
		}
	}

	getItemInfo(item: ap.NetworkItem): ItemInfo {
		let gameName: string = sc.multiworld.client.data.players[item.player].game;
		let gameInfo: ap.GamePackage = sc.multiworld.client.data.package.get(gameName);
		if (gameInfo.item_id_to_name[item.item] == undefined) {
			gameInfo = sc.multiworld.gamepackage;
			gameName = "CrossCode";
		}

		if (gameInfo.item_id_to_name[item.item] == undefined) {
			return {icon: "ap-item-default", label: "Unknown", player: "Archipelago", level: 0, isScalable: false};
		}

		const playerId = sc.multiworld.client.players.get(item.player);
		const playerName = playerId?.alias ?? playerId?.name;

		let label = gameInfo.item_id_to_name[item.item];
		let player = playerName ? playerName : "Archipelago";

		if (gameName == "CrossCode") {
			const comboId: number = item.item;
			let level = 0;
			let icon = "item-default";
			let isScalable = false;
			if (comboId >= sc.multiworld.baseNormalItemId) {
				const [itemId, _] = sc.multiworld.getItemDataFromComboId(item.item);
				const dbEntry = sc.inventory.getItem(itemId);
				if (dbEntry) {
					icon = dbEntry.icon + sc.inventory.getRaritySuffix(dbEntry.rarity);
					isScalable = dbEntry.isScalable || false;
					if (dbEntry.type == sc.ITEMS_TYPES.EQUIP) {
						level = dbEntry.level;
					}
				}
			}

			return {icon, label, player, level, isScalable};
		}

		let cls = "unknown";
		if (item.flags & ap.ITEM_FLAGS.PROGRESSION) {
			cls = "prog";
		} else if (item.flags & ap.ITEM_FLAGS.NEVER_EXCLUDE) {
			cls = "useful";
		} else if (item.flags & ap.ITEM_FLAGS.TRAP) {
			cls = "trap";
		} else if (item.flags == 0) {
			cls = "filler";
		}

		let icon = `ap-item-${cls}`;
		return {icon, label, player, level: 0, isScalable: false};
	}

	getGuiString(item: {icon: string, label: string}): string {
		return `\\i[${item.icon}]${item.label}`;
	}

	async prestart() {
		window.moduleCache.registerModPrefix("mw-rando", this.baseDirectory.substring(7));
		ig.lib = this.baseDirectory.substring(7);

		ig._loadScript("mw-rando.multiworld-model");

		let randoData: WorldData = await readJsonFromFile(this.baseDirectory + "data/out/data.json")
		this.randoData = randoData;
		sc.randoData = randoData;

		let itemdb = await readJsonFromFile("assets/data/item-database.json");
		this.itemdb = itemdb;

		// For those times JS decides to override `this`
		// Used several times in the injection code
		let plugin = this;

		applyPatches(this);

		sc.PartyModel.inject({
			addPartyMember(name: string, ...args) {
				this.parent(name, ...args);
				sc.party.getPartyMemberModel(name).setSpLevel(sc.model.player.spLevel);
			}
		});

		let mwIcons = new ig.Font(
			plugin.baseDirectory.substring(7) + "assets/media/font/icons-multiworld.png",
			16,
			ig.MultiFont.ICON_START,
		);

		let index = sc.fontsystem.font.iconSets.length;
		sc.fontsystem.font.pushIconSet(mwIcons);
		sc.fontsystem.font.setMapping({
			"mw-item": [index, 0],
			"ap-logo": [index, 2],
			"ap-item-unknown": [index, 2],
			"ap-item-trap": [index, 3],
			"ap-item-filler": [index, 4],
			"ap-item-useful": [index, 5],
			"ap-item-prog": [index, 6],
		});

		sc.CrossCode.inject({
			init(...args) {
				this.parent(...args);
				sc.multiWorldHud = new sc.MultiWorldHudBox();
				sc.gui.rightHudPanel.addHudBox(sc.multiWorldHud);
			},

			gotoTitle(...args) {
				if (sc.multiworld.client.status == ap.CONNECTION_STATUS.CONNECTED) {
					sc.multiworld.client.disconnect();
					// sc.multiworld.updateConnectionStatus();
				}
				this.parent(...args);
			},
		});
	}
}
