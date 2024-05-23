import * as ap from 'archipelago.js';
import {WorldData, RawElement, RawQuest, ItemInfo} from './item-data.model';
import {readJsonFromFile} from './utils';
import "./types/multiworld-model.d";
import {applyPatches} from "./patches/index";

export default class MwRandomizer {
	baseDirectory: string;
	randoData: WorldData | null = null;
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
			gameInfo = sc.multiworld.datapackage;
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

	/**
	 * Modify `itemsGui` such that represents the quest rewards for the
	 * multiworld, based on user preferences for occluding specific data.
	 *
	 * @remarks
	 * This function signature sucks. I have to do things a really annoying way
	 * for this to work.
	 *
	 * @param quest - The sc.Quest object representing the quest in the base game.
	 * @param showRewardAnyway - Overrides computed parameter for whether to hide
	 * the rewards. This is meant to bypass user settings and show the reward
	 * even if it is not desired (i.e. at the end of the quest).
	 * @param mwQuest - The object from `data.json` that stores location IDs.
	 * @param itemsGui - The GUI to modify.
	 * @param gfx - Argument required to draw the level if required. Inspect
	 * sc.QuestDialog.setQuest or sc.QuestDetailsView._setQuest for how to obtain
	 * it.
	 */

	makeApItemsGui(
		quest: sc.Quest,
		showRewardAnyway: boolean,
		mwQuest: RawQuest,
		itemsGui: ig.GuiElementBase,
		gfx: ig.Image
	) {
		if (sc.multiworld.client.status != ap.CONNECTION_STATUS.CONNECTED) {
			return;
		}

		let itemGuis: sc.TextGui[] = [];
		let worldGuis: sc.TextGui[] = [];

		itemsGui.removeAllChildren();
		itemsGui.gfx = gfx;

		const hiddenQuestRewardMode = sc.multiworld.options.hiddenQuestRewardMode;
		let hideRewards = quest.hideRewards;
		if (hiddenQuestRewardMode == "show_all") {
			hideRewards = false;
		} else if (hiddenQuestRewardMode == "hide_all") {
			hideRewards = true;
		}

		hideRewards = hideRewards && !showRewardAnyway;

		if (sc.multiworld.options.questDialogHints && !hideRewards) {
			sc.multiworld.client.locations.scout(ap.CREATE_AS_HINT_MODE.HINT_ONLY_NEW, ...mwQuest.mwids);
		}

		for (let i = 0; i < mwQuest.mwids.length; i++) {
			const mwid: number = mwQuest.mwids[i]
			const item: ap.NetworkItem = sc.multiworld.locationInfo[mwid];

			const itemInfo = this.getItemInfo(item);

			if (hideRewards) {
				itemInfo.label = "?????????????";
				if (sc.multiworld.questSettings.hidePlayer) {
					itemInfo.player =  "?????????????";
				}
			}

			const itemGui = new sc.TextGui(this.getGuiString(itemInfo));
			itemGui.setPos(0, i * 20);
			const worldGui = new sc.TextGui(itemInfo.player, { "font": sc.fontsystem.tinyFont });

			if (itemInfo.level > 0) {
				itemGui.setDrawCallback(function (width: number, height: number) {
					sc.MenuHelper.drawLevel(
						itemInfo.level,
						width,
						height,
						itemsGui.gfx,
						itemInfo.isScalable
					);
				});
			}

			worldGui.setPos(15, itemGui.hook.size.y - 2);
			itemsGui.addChildGui(itemGui);
			itemGui.addChildGui(worldGui);
			worldGuis.push(worldGui);
			itemGuis.push(itemGui);
		}
	}

	async prestart() {
		window.moduleCache.registerModPrefix("mw-rando", this.baseDirectory.substring(7));
		ig.lib = this.baseDirectory.substring(7);

		ig._loadScript("mw-rando.multiworld-model");

		let randoData: WorldData = await readJsonFromFile(this.baseDirectory + "data/out/data.json")
		this.randoData = randoData;

		let maps = randoData.items;

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
