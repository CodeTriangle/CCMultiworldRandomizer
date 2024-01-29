import * as ap from 'archipelago.js';
import {WorldData, RawElement, RawQuest, ItemInfo} from './item-data.model';
import {readJsonFromFile} from './utils';
import "./types/multiworld-model.d";

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
		let quests = randoData.quests;

		let itemdb = await readJsonFromFile("assets/data/item-database.json");
		this.itemdb = itemdb;

		// For those times JS decides to override `this`
		// Used several times in the injection code
		let plugin = this;

		ig.ENTITY.Chest.inject({
			init(...args) {
				this.parent(...args);

				const map = maps[ig.game.mapName];
				if (!map) {
					return;
				}

				this.mwCheck = map.chests?.[this.mapId];
				if (!this.mwCheck) {
					return;
				}

				if (!sc.multiworld.locationInfo) {
					return;
				}

				const keyLayer = this.animSheet.anims.idleKey.animations[1];
				const masterKeyLayer = this.animSheet.anims.idleMasterKey.animations[1];
				let layerToAdd = null;

				this.analyzeColor = sc.ANALYSIS_COLORS.GREY;
				this.analyzeLabel = "Filler";

				let newOffY = 0;
				this.rawChest = sc.multiworld.locationInfo[this.mwCheck.mwids[0]];
				let flags = this.rawChest.flags;
				if (flags & (ap.ITEM_FLAGS.NEVER_EXCLUDE | ap.ITEM_FLAGS.TRAP)) {
					// USEFUL and TRAP items get a blue chest
					newOffY = 80;
					layerToAdd = keyLayer;
					this.analyzeColor = sc.ANALYSIS_COLORS.BLUE;
					this.analyzeLabel = "Useful";
				} else if (flags & ap.ITEM_FLAGS.PROGRESSION) {
					// PROGRESSION items get a green chest
					newOffY = 136;
					layerToAdd = masterKeyLayer;
					this.analyzeColor = sc.ANALYSIS_COLORS.GREEN;
					this.analyzeLabel = "Progression";
				}

				this.animSheet.anims.idleKey = this.animSheet.anims.idleMasterKey = this.animSheet.anims.idle;

				if (newOffY == 0) {
					return;
				}

				for (const name of Object.keys(this.animSheet.anims)) {
					let animations = this.animSheet.anims[name].animations;

					if (name.startsWith("idle")) {
						animations[0].sheet.offY = newOffY;
						layerToAdd && animations.splice(1, 0, layerToAdd);
					}
					if (name == "open" || name == "end") {
						this.animSheet.anims[name].animations[0].sheet.offY = newOffY + 24;
					}
				}
			},

			getQuickMenuSettings() {
				let disabled = this.isOpen || (this.hideManager && this.hideManager.hidden);
				if (this.mwCheck) {
					return {
						type: "Chest",
						disabled: disabled,
					};
				} else {
					return {
						type: "Analyzable",
						disabled: disabled,
						color: this.analyzeColor ?? 0,
						text: "\\c[1]Not in logic",
					}
				}
			},

			_reallyOpenUp() {
				if (
					this.mwCheck === undefined ||
					this.mwCheck.mwids === undefined ||
					this.mwCheck.mwids.length == 0 ||
					sc.multiworld.locationInfo[this.mwCheck.mwids[0]] === undefined
				) {
					console.warn('Chest not in logic');
					return this.parent();
				}

				const old = sc.ItemDropEntity.spawnDrops;
				try {
					if (this.mwCheck) {
						sc.multiworld.reallyCheckLocations(this.mwCheck.mwids);
					}

					this.amount = 0;
					return this.parent();
				} finally {
					sc.ItemDropEntity.spawnDrops = old;
				}
			},
		});

		sc.QUICK_MENU_TYPES.Chest = sc.QuickMenuTypesBase.extend({
			init(type, settings, screen) {
				this.parent(type, settings, screen);
				this.setIconColor(settings.entity.analyzeColor);
			},
		});

		sc.QUICK_INFO_BOXES.Chest = ig.BoxGui.extend({
			ninepatch: new ig.NinePatch("media/gui/menu.png", {
				width: 8,
				height: 8,
				left: 8,
				top: 8,
				right: 8,
				bottom: 8,
				offsets: { default: { x: 432, y: 304 }, flipped: { x: 456, y: 304 } },
			}),
			transitions: {
				HIDDEN: {
					state: { alpha: 0 },
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR,
				},
				DEFAULT: { state: {}, time: 0.2, timeFunction: KEY_SPLINES.EASE },
			},
			
			init() {
				this.parent(127, 100);
				this.areaGui = new sc.TextGui("", { font: sc.fontsystem.tinyFont });
				this.areaGui.setPos(0, 6);
				this.areaGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
				this.addChildGui(this.areaGui);

				this.locationGui = new sc.TextGui("", {
					font: sc.fontsystem.smallFont,
					maxWidth: 115,
					linePadding: -2,
				});
				this.locationGui.setPos(8, 19);
				this.addChildGui(this.locationGui);

				this.line = new sc.LineGui(117);
				this.line.setPos(5, 16);
				this.addChildGui(this.line);

				this.clearance = new sc.TextGui("", { font: sc.fontsystem.tinyFont });
				this.clearance.setPos(5, 13);
				this.clearance.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
				this.addChildGui(this.clearance);

				this.arrow = new sc.QuickItemArrow();
				this.addChildGui(this.arrow);

				this.typeGui = new sc.TextGui("", { font: sc.fontsystem.tinyFont });
				this.typeGui.setPos(8, 5);
				this.typeGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
				this.addChildGui(this.typeGui);
			},

			show(tooltip) {
				let chest = tooltip.entity;
				if (!this.setData(chest)) {
					return;
				}
				this.alignToBase(tooltip.hook);
				this.doStateTransition("DEFAULT");
				this.active = true;
			},
			
			hide() {
				this.doStateTransition("HIDDEN");
				this.active = false;
			},

			setData(chest) {
				if (!chest.mwCheck) {
					return false;
				}

				let [area, location] =  chest.mwCheck.name.split(" - ");
				let level = null;
				const match = RegExp("(.+) \\((.+)\\)").exec(location);
				if (match) {
					location = match[1];
					level = match[2];
				}

				this.areaGui.setText(`\\c[4]${area}\\c[0]`);
				this.locationGui.setText(location);
				if (level) {
					this.clearance.setText(`\\c[3]${level}\\c[0]`);
					this.line.hook.size.x = 114 - this.clearance.hook.size.x;
				} else {
					this.clearance.setText("");
					this.line.hook.size.x = 117;
				}

				this.hook.size.y = 34 + this.locationGui.hook.size.y;

				this.typeGui.setText(`Type: \\c[3]${chest.analyzeLabel}\\c[0]`);

				return true;
			},

			alignToBase: function (otherHook) {
				let hook = this.hook;
				let invisible = hook.currentState.alpha == 0;

				let vec = Vec2.createC(0, 0);
				vec.x = otherHook.pos.x + Math.floor(otherHook.size.x / 2);
				vec.y = otherHook.pos.y + Math.floor(otherHook.size.y / 2);

				let above = vec.y - 25;

				vec.y = Math.max(10, Math.min(ig.system.height - this.hook.size.y - 10, above));

				if (invisible) {
					hook.pos.y = vec.y;
				}

				var arrowY = 17 + (above - vec.y);
				if (vec.x + 173 < ig.system.width) {
					this.currentTileOffset = "default";
					if (invisible) hook.pos.x = vec.x + 20 + 10;
					hook.doPosTranstition(vec.x + 20, vec.y, 0.2, KEY_SPLINES.EASE);
					this.arrow.setPosition(-10, Math.max(7, Math.min(hook.size.y - 15, arrowY)), false);
				} else {
					this.currentTileOffset = "flipped";
					if (invisible) hook.pos.x = vec.x - hook.size.x - 20 - 10 - 1;
					hook.doPosTranstition(
						vec.x - hook.size.x - 20 - 1,
						vec.y,
						0.2,
						KEY_SPLINES.EASE,
					);
					this.arrow.setPosition(
						hook.size.x + 1,
						Math.max(7, Math.min(hook.size.y - 15, arrowY)),
						true,
					);
				}

				this.arrow.bottomAnchor = false;
				this.arrow.flipY = false;
				if (arrowY < 7) {
					this.arrow.bottomAnchor = true;
					this.arrow.flipY = true;
				} else if (arrowY > hook.size.y - 15) {
					this.arrow.bottomAnchor = true;
				}
			},
		});

		ig.EVENT_STEP.SET_PLAYER_CORE.inject({
			start() {
				if (
					this.core != sc.PLAYER_CORE.ELEMENT_HEAT &&
					this.core != sc.PLAYER_CORE.ELEMENT_COLD &&
					this.core != sc.PLAYER_CORE.ELEMENT_SHOCK &&
					this.core != sc.PLAYER_CORE.ELEMENT_WAVE
				) {
					return this.parent();
				}

				const map = maps[ig.game.mapName];
				if (!map || !map.elements) {
					return this.parent();
				}

				const check = Object.values(map.elements)[0] as RawElement;
				sc.multiworld.reallyCheckLocations(check.mwids);
			}
		});

		ig.EVENT_STEP.RESET_SKILL_TREE.inject({
			start() {
				if (maps[ig.game.mapName]) {
					return; // do not reset the skilltree if there is a check in the room
				}
				return this.parent();
			}
		});

		ig.EVENT_STEP.SEND_ITEM = ig.EventStepBase.extend({
			mwids: [],
			oldItem: undefined,
			init(settings) {
				this.mwids = settings.mwids.filter(x => sc.multiworld.locationInfo[x] != undefined);
				this.oldItem = {
					"item": settings.item,
					"amount": settings.amount,
				}
			},
			start() {
				if (this.mwids.length == 0) {
					let amount = ig.Event.getExpressionValue(this.oldItem.amount);
					sc.model.player.addItem(this.oldItem.item, amount, false);
				}

				sc.multiworld.reallyCheckLocations(this.mwids);
			}
		});

		ig.EVENT_STEP.MW_GOAL_COMPLETED = ig.EventStepBase.extend({
			init(settings) {
				// In the future, goal will only update client status if it checks off
				// a specific goal specified by their yaml. For now, there's only one
				// goal.
				this.goal = settings.goal;
			},
			start() {
				sc.multiworld.client.updateStatus(ap.CLIENT_STATUS.GOAL);
			}
		});

		sc.PartyModel.inject({
			addPartyMember(name: string, ...args) {
				this.parent(name, ...args);
				sc.party.getPartyMemberModel(name).setSpLevel(sc.model.player.spLevel);
			}
		});

		ig.Game.inject({
			loadLevel(map, ...args) {
				const mapOverrides = maps[map.name.replace(/[\\\/]/g, '.')];
				if (mapOverrides) {
					for (const entity of map.entities) {
						if (
							entity
							&& entity.settings
							&& entity.settings.mapId
							&& mapOverrides.cutscenes
							&& mapOverrides.cutscenes[entity.settings.mapId]
						) {
								for (const check of mapOverrides.cutscenes[entity.settings.mapId]) {
									const path = check.path.slice(1).split(/\./g);

									set(entity, 'SEND_ITEM', [...path, 'type']);
									set(entity, check.mwids, [...path, 'mwids']);
								}
							}
					}
				}

				return this.parent(map, ...args);
			}
		});

		sc.QuestModel.inject({
			_collectRewards(quest: sc.Quest) {
				const check = quests[quest.id];
				if (
					check == undefined ||
					check.mwids == undefined ||
					check.mwids.length == 0 ||
					sc.multiworld.locationInfo[check.mwids[0]] === undefined
				) {
					return this.parent(quest);
				}

				sc.multiworld.reallyCheckLocations(check.mwids);
			},
		});

		sc.QuestDialogWrapper.inject({
			init(
				quest: sc.Quest,
				callback: CallableFunction,
				finished: bool,
				characterName: string,
				mapName: string,
			) {
				this.parent(quest, callback, finished, characterName, mapName);

				sc.Model.addObserver(sc.multiworld, this.questBox);
			},

			_close(a) {
				this.parent(a);

				sc.Model.removeObserver(sc.multiworld, this.questBox);
			},
		});

		sc.QuestDialog.inject({
			init(quest: sc.Quest, finished: boolean) {
				this.parent(quest, finished);

				this.finished = finished;
			},

			setQuestRewards(quest: sc.Quest, hideRewards: boolean, finished: boolean) {
				this.parent(quest, hideRewards, finished);
				let mwQuest = randoData.quests[quest.id]
				this.mwQuest = mwQuest;
				if (
					mwQuest === undefined ||
					mwQuest.mwids === undefined ||
					mwQuest.mwids.length === 0 ||
					sc.multiworld.locationInfo[mwQuest.mwids[0]] === undefined
				) {
					return;
				}

				this.setSize(this.hook.size.x, this.hook.size.y + 6);
				
				plugin.makeApItemsGui(quest, !hideRewards, mwQuest, this.itemsGui, this.gfx);
			},

			modelChanged(model: sc.Model, msg: number, data: any) {
				if (
					model == sc.multiworld &&
					msg == sc.MULTIWORLD_MSG.CONNECTION_STATUS_CHANGED &&
					this.mwQuest &&
					sc.multiworld.locationInfo[this.mwQuest.mwids[0]] === undefined
				) {
					plugin.makeApItemsGui(this.quest, this.finished, this.mwQuest, this.itemsGui, this.gfx);
				}
			}
		});

		sc.QuestDetailsView.inject({
			_setQuest(quest: sc.Quest) {
				this.parent(quest);
				let mwQuest = randoData.quests[quest.id]
				if (
					mwQuest === undefined ||
					sc.multiworld.locationInfo[mwQuest.mwids[0]] === undefined
				) {
					return;
				}
				
				plugin.makeApItemsGui(quest, false, mwQuest, this.itemsGui, this.gfx);
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

		// And for my next trick I will rip off ItemContent and ItemHudGui from the base game
		// pls don't sue
		sc.MultiWorldItemContent = ig.GuiElementBase.extend({
			timer: 0,
			id: -1,
			player: -1,
			textGui: null,
			init: function (item: ItemInfo, receive: boolean) {
				this.parent();
				this.timer = 5;

				let verb = receive ? "Received" : "Sent";
				let prep = receive ? "from": "to";
				let text = `${verb} \\c[3]${plugin.getGuiString(item)}\\c[0] ${prep} \\c[3]${item.player}\\c[0]`;
				let isNormalSize = sc.options.get("item-hud-size") == sc.ITEM_HUD_SIZE.NORMAL;

				this.textGui = new sc.TextGui(text, {
					speed: ig.TextBlock.SPEED.IMMEDIATE,
					font: isNormalSize ? sc.fontsystem.font : sc.fontsystem.smallFont,
				});
				this.textGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
				this.addChildGui(this.textGui);

				this.setSize(
					this.textGui.hook.size.x + 4,
					isNormalSize ? 18 : 8
				);

				this.hook.pivot.x = this.hook.size.x;
				this.hook.pivot.y = 0;
			},

			updateOption: function (isNormalSize: boolean) {
				if (isNormalSize) {
					if (this.textGui.font == sc.fontsystem.font) return;
					this.textGui.setFont(sc.fontsystem.font);
				} else {
					if (this.textGui.font == sc.fontsystem.smallFont) return;
					this.textGui.setFont(sc.fontsystem.smallFont);
				}

				this.setSize(
					this.textGui.hook.size.x + 4,
					isNormalSize ? 18 : 8
				);
			},

			updateTimer: function () {
				if (this.timer > 0) this.timer = this.timer - ig.system.tick;
			},
		});

		sc.MultiWorldHudBox = sc.RightHudBoxGui.extend({
			contentEntries: [],
			delayedStack: [],
			size: 0,

			init: function() {
				this.parent("Archipelago");
				this.size = sc.options.get("item-hud-size");
				sc.Model.addObserver(sc.multiworld, this);
				sc.Model.addObserver(sc.model, this);
				sc.Model.addObserver(sc.options, this);
			},

			addEntry: function (itemInfo: ItemInfo, receive: boolean) {
				let entry = new sc.MultiWorldItemContent(itemInfo, receive);
				if (this.contentEntries.length >= 5) {
					this.delayedStack.push(entry);
				} else {
					this.pushContent(entry, true);
				}
				this.hidden && this.show();
			},

			update: function () {
				if (!sc.model.isPaused() && !sc.model.isMenu() && !this.hidden) {
					for (let i = this.contentEntries.length, gui = null; i--; ) {
						gui = this.contentEntries[i].subGui;
						gui.updateTimer();

						if (gui.timer <= 0) {
							gui = this.removeContent(i);
							if (i == 0 && this.contentEntries.length == 0)
								gui.hook.pivot.y = gui.hook.size.y / 2;
							else {
								gui.hook.pivot.y = 0;
								gui.hook.anim.timeFunction = KEY_SPLINES.EASE_OUT;
							}
							this._popDelayed();
						}
					}

					!this.hidden && this.contentEntries.length == 0 && this.hide();
				}
			},

			_popDelayed: function () {
				if (this.delayedStack.length != 0) {
					var b = this.delayedStack.splice(0, 1)[0];
					this.pushContent(b, true);
				}
			},

			_updateSizes: function (isNormalSize: boolean) {
				for (var i = this.contentEntries.length, gui = null; i--; ) {
					gui = this.contentEntries[i];
					gui.subGui.updateOption(isNormalSize);
					gui.setContent(gui.subGui);
				}
				this.rearrangeContent();
			},

			modelChanged: function (model: any, msg: number, data: any) {
				if (model == sc.multiworld) {
					if (
						msg == sc.MULTIWORLD_MSG.ITEM_SENT &&
						sc.options.get("show-items")
					) {
						this.addEntry(plugin.getItemInfo(data), false);
					} else if (
						msg == sc.MULTIWORLD_MSG.ITEM_RECEIVED &&
						sc.options.get("show-items")
					) {
						this.addEntry(plugin.getItemInfo(data), true);
					}
				} else if (model == sc.model) {
					if (model.isReset()) {
						this.clearContent();
						this.delayedStack.length = 0;
						this.hide();
					} else if (
						model.isCutscene() ||
						model.isHUDBlocked() ||
						sc.quests.hasQuestSolvedDialogs()
					) {
							this.hide()
					} else if (
						!model.isCutscene() &&
						!model.isHUDBlocked() &&
						this.contentEntries.length > 0 &&
						!sc.quests.hasQuestSolvedDialogs()
					) {
						this.show();
					}
				} else if (model == sc.options && msg == sc.OPTIONS_EVENT.OPTION_CHANGED) {
					model = sc.options.get("item-hud-size");
					if (model != this.size) {
						this._updateSizes(model == sc.ITEM_HUD_SIZE.NORMAL);
						this.size = model;
					}
				}
			},
		});

		sc.APConnectionStatusGui = sc.TextGui.extend({
			init: function () {
				this.parent("", {font: sc.fontsystem.tinyFont});
				this.updateText();

				sc.Model.addObserver(sc.multiworld, this);
			},

			updateText: function () {
				this.setText(`AP: ${plugin.getColoredStatus(sc.multiworld.client.status.toUpperCase())}`);
			},

			modelChanged(model: any, msg: number, data: any) {
				if (model == sc.multiworld && msg == sc.MULTIWORLD_MSG.CONNECTION_STATUS_CHANGED) {
					this.updateText();
				}
			},
		});

		sc.PauseScreenGui.inject({
			init(...args) {
				this.parent(...args);

				this.apConnectionStatusGui = new sc.APConnectionStatusGui();

				this.apConnectionStatusGui.setAlign(this.versionGui.hook.align.x, this.versionGui.hook.align.y);
				this.apConnectionStatusGui.setPos(0, this.versionGui.hook.size.y * 2);

				this.versionGui.addChildGui(this.apConnectionStatusGui);

				this.apSettingsButton = new sc.ButtonGui("\\i[ap-logo] Archipelago Settings");
				this.apSettingsButton.setPos(3, 3);
				this.buttonGroup.addFocusGui(this.apSettingsButton);
				this.apSettingsButton.onButtonPress = function () {
					sc.menu.setDirectMode(true, sc.MENU_SUBMENU.AP_CONNECTION);
					sc.model.enterMenu(true);
				}.bind(this);

				this.addChildGui(this.apSettingsButton);
			},
		});

		sc.APConnectionBox = sc.BaseMenu.extend({
			gfx: new ig.Image("media/gui/menu.png"),

			fields: [
				{
					key: "hostname",
					label: "Hostname",
				},
				{
					key: "port",
					label: "Port",
				},
				{
					key: "name",
					label: "Slot Name",
				}
			],

			textGuis: [],
			inputGuis: [],

			textColumnWidth: 0,
			hSpacer: 5,
			vSpacer: 3,

			msgBox: null,
			msgBoxBox: null,
			inputList: null,
			content: null,
			connect: null,
			disconnect: null,
			buttonHolder: null,

			buttongroup: null,
			back: null,
			keepOpen: false,

			init: function () {
				this.parent();

				this.hook.zIndex = 9999999;
				this.hook.localAlpha = 0.0;
				this.hook.pauseGui = true;
				this.hook.size.x = ig.system.width;
				this.hook.size.y = ig.system.height;

				this.buttongroup = new sc.ButtonGroup();
				sc.menu.buttonInteract.pushButtonGroup(this.buttongroup);

				this.buttongroup.addPressCallback(() => {});

				sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));

				this.inputList = new ig.GuiElementBase();

				for (let i = 0; i < this.fields.length; i++) {
					let textGui = new sc.TextGui(this.fields[i].label);
					this.textColumnWidth = Math.max(this.textColumnWidth, textGui.hook.size.x);
					textGui.hook.pos.y = (textGui.hook.size.y + this.vSpacer) * i;
					this.inputList.addChildGui(textGui);
					this.textGuis.push(textGui);

					let inputGui = new nax.ccuilib.InputField(200, textGui.hook.size.y);
					this.buttongroup.addFocusGui(inputGui, 0, i);
					inputGui.hook.pos.y = (textGui.hook.size.y + this.vSpacer) * i;
					
					if (sc.multiworld.connectionInfo) {
						//@ts-ignore
						let prefill = "" + sc.multiworld.connectionInfo[this.fields[i].key];
						inputGui.value = prefill.split("");
						inputGui.textChild.setText(prefill);
						inputGui.cursorPos = prefill.length;
						inputGui.cursor.hook.pos.x = inputGui.calculateCursorPos();
					}

					this.inputList.addChildGui(inputGui);
					this.inputGuis.push(inputGui);
				}
 
				for (const gui of this.inputGuis) {
					gui.hook.pos.x = this.textColumnWidth + this.hSpacer;
				}

				this.inputList.setSize(
					this.textColumnWidth + this.hSpacer + 200, 
					this.textGuis[0].hook.size.y * this.textGuis.length + this.vSpacer * (this.textGuis.length - 1)
				);

				this.content = new ig.GuiElementBase();

				this.msgBox = new sc.BlackWhiteBox(this.inputList.hook.size.x, this.inputList.hook.size.y);
				this.msgBox.setSize(this.inputList.hook.size.x + 22, this.inputList.hook.size.y + 10);
				this.msgBox.addChildGui(this.inputList);

				this.inputList.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);

				this.apConnectionStatusGui = new sc.APConnectionStatusGui();
				this.apConnectionStatusGui.setPos(7, 0);

				this.msgBoxBox = new ig.GuiElementBase();
				this.msgBoxBox.setSize(
					this.msgBox.hook.size.x,
					this.msgBox.hook.size.y + this.apConnectionStatusGui.hook.size.y
				);

				this.msgBox.setPos(0, this.apConnectionStatusGui.hook.size.y);

				this.msgBoxBox.addChildGui(this.apConnectionStatusGui);
				this.msgBoxBox.addChildGui(this.msgBox);
				this.msgBoxBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);

				this.connect = new sc.ButtonGui("Connect", sc.BUTTON_MENU_WIDTH);
				this.connect.onButtonPress = this.connectFromInput.bind(this);
				this.buttongroup.addFocusGui(this.connect, 0, this.fields.length);

				this.disconnect = new sc.ButtonGui("Disconnect", sc.BUTTON_MENU_WIDTH);
				this.disconnect.onButtonPress = () => { sc.multiworld.client.disconnect() };
				this.disconnect.setPos(sc.BUTTON_MENU_WIDTH + this.hSpacer);
				this.buttongroup.addFocusGui(this.disconnect, 1, this.fields.length);

				this.buttonHolder = new ig.GuiElementBase();

				this.buttonHolder.addChildGui(this.connect);
				this.buttonHolder.addChildGui(this.disconnect);
				this.buttonHolder.setSize(sc.BUTTON_MENU_WIDTH * 2 + this.hSpacer, sc.BUTTON_TYPE.DEFAULT.height);
				this.buttonHolder.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);

				this.content.addChildGui(this.msgBoxBox);
				this.content.addChildGui(this.buttonHolder);
				this.content.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);

				this.content.setSize(
					Math.max(
						this.msgBoxBox.hook.size.x,
						this.buttonHolder.hook.size.x
					),
					this.msgBoxBox.hook.size.y + this.buttonHolder.hook.size.y + this.vSpacer,
				);
				this.addChildGui(this.content);

				this.doStateTransition("HIDDEN", true);
			},

			getOptions() {
				let result = {};
				for (let i = 0; i < this.fields.length; i++) {
					result[this.fields[i].key] = this.inputGuis[i].value.join("");
				}

				return result;
			},

			connectFromInput() {
				let options = this.getOptions();
				if (isNaN(options.port)) {
					sc.Dialogs.showErrorDialog(
						"Port is not a number",
						true,
					);
					return;
				}
				let portNumber = Number(options.port);

				if (portNumber > 65535 || portNumber < 1) {
					sc.Dialogs.showErrorDialog(
						"Port must be between 1 and 65535",
						true
					);
					return;
				}

				sc.multiworld.login({
					game: 'CrossCode',
					hostname: options.hostname,
					port: portNumber,
					items_handling: ap.ITEMS_HANDLING_FLAGS.REMOTE_ALL,
					name: options.name,
				});
			},

			showMenu: function () {
				this.parent();
				ig.interact.setBlockDelay(0.1);
				this.addObservers();
				this.msgBox.doStateTransition("DEFAULT");
				this.doStateTransition("DEFAULT");
			},

			hideMenu: function () {
				this.parent();
				ig.interact.setBlockDelay(0.1);
				this.removeObservers();
				this.msgBox.doStateTransition("HIDDEN");
				this.doStateTransition("HIDDEN", false);
			},

			onBackButtonPress: function () {
				sc.menu.popBackCallback();
				sc.menu.popMenu();
			},

			addObservers: function () {
				sc.Model.addObserver(sc.model, this);
			},

			removeObservers: function () {
				sc.Model.removeObserver(sc.model, this);
			},

			modelChanged: function(model: any, msg: number, data: any) {
				if (model == sc.multiworld && msg == sc.MULTIWORLD_MSG.CONNECTION_STATUS_CHANGED) {
				}
			},

			onDetach: function () {},
		});

		sc.MENU_SUBMENU.AP_CONNECTION = 300000;
		sc.SUB_MENU_INFO[sc.MENU_SUBMENU.AP_CONNECTION] = {
			Clazz: sc.APConnectionBox,
			name: "apConnection",
		};

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

function set(root, value, path, offset = 0) {
	if (path.length <= offset) {
		return;
	}
	while (offset < path.length - 1) {
		root = root[path[offset]];
		offset++;
	}

	if (path.length - 1 === offset) {
		root[path[offset]] = value;
	}
}
