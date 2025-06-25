import * as ap from "archipelago.js";
import type MwRandomizer from "../plugin";
import {RawChest} from "../item-data.model";

declare global {
	namespace ig.ENTITY {
		interface Chest {
			mwCheck?: RawChest;
			analyzeColor: sc.ANALYSIS_COLORS;
			analyzeLabel: string;
			collectedLabel: string;
			rawChest: ap.Item | undefined;
		}
	}
	namespace sc {
		namespace QUICK_MENU_TYPES {
			namespace Chest {
				interface Settings extends sc.QuickMenuTypesBaseSettings {
					type: "Chest";
					entity: ig.ENTITY.Chest;
				}
			}
			interface Chest extends sc.QuickMenuTypesBase {}
			interface ChestConstructor extends ImpactClass<Chest> {
				new (
					type: string,
					settings: sc.QUICK_MENU_TYPES.Chest.Settings,
					screen: sc.QuickFocusScreen
				): Chest;
			}
			var Chest: ChestConstructor;
		}
		namespace QUICK_INFO_BOXES {
			interface Chest extends ig.BoxGui {
				areaGui: sc.TextGui;
				locationGui: sc.TextGui;
				collectedGui: sc.TextGui;
				line: sc.LineGui;
				clearance: sc.TextGui;
				arrow: sc.QuickItemArrow;
				typeGui: sc.TextGui;
				active: boolean;

				show(this: this, tooltip: sc.QuickMenuTypesBase): void;
				hide(this: this): void;
				setData(this: this, chest: ig.Entity): boolean;
				alignToBase(this: this, otherHook: ig.GuiHook): void;
			}
			interface ChestConstructor extends ImpactClass<Chest> {
				new (): Chest;
			}
			var Chest: ChestConstructor;
		}
	}
}

export function patch(plugin: MwRandomizer) {
	ig.ENTITY.Chest.inject({
		init(...args) {
			this.parent(...args);

			const map = plugin.randoData?.items[ig.game.mapName];
			if (!map) {
				return;
			}

			this.mwCheck = map.chests?.[this.mapId!];
			if (!this.mwCheck) {
				return;
			}

			if (!sc.multiworld.locationInfo) {
				return;
			}

			if (!this.isOpen) {
				sc.multiworld.seenChests.add(this.mwCheck.mwids[0]);
			}

			const clearance = sc.multiworld.options.chestClearanceLevels?.[this.mwCheck.mwids[0]];

			if (clearance != undefined) {
				this.chestType = sc.CHEST_TYPE[clearance];
			}

			const anims = this.animSheet.anims as unknown as Record<
					'idleKey' | 'idleMasterKey' | 'idleGold' | 'idleSilver' |
					'idleBronze' | 'idle' | 'open' | 'end',
				ig.SingleDirAnimationSet>

			// FILLER items get a normal chest with an archipelago logo on it
			// These are the default values
			this.analyzeColor = sc.ANALYSIS_COLORS.GREY;
			this.analyzeLabel = "\\C[blue]Filler";
			this.collectedLabel = "\\c[3]Not Collected";
			let sequence = 8;

			let newOffX = 0;
			let newOffY = 80;
			this.rawChest = sc.multiworld.locationInfo[this.mwCheck.mwids[0]];

			if (this.rawChest == undefined) {
				return;
			}

			if (this.rawChest.progression) {
				// PROGRESSION items get a green chest
				newOffY = 192;
				this.analyzeColor = sc.ANALYSIS_COLORS.GREEN;
				this.analyzeLabel = "\\C[green]Progression";
				sequence = 6;
			} else if (this.rawChest.useful || this.rawChest.trap) {
				// USEFUL and TRAP items get a blue chest
				newOffY = 136;
				this.analyzeColor = sc.ANALYSIS_COLORS.BLUE;
				this.analyzeLabel = "\\C[dark-blue]Useful";
				sequence = 7;
			}

			if (sc.multiworld.localCheckedLocations.has(this.mwCheck.mwids[0])) {
				// If the item was checked (i.e. in a divergent play session), make it gray
				newOffX = 128;
				newOffY = 0;
				this.analyzeColor = sc.ANALYSIS_COLORS.GREY;
				this.collectedLabel = "\\C[gray]Collected";
				sequence = 0;
			}

			for (const name of Object.keys(anims) as (keyof typeof anims)[]) {
				let animations = anims[name].animations;

				if (name.startsWith("idle")) {
					const sheet = animations[0].sheet as ig.TileSheet;
					sheet.offY = newOffY;
					sheet.offX = newOffX;
				}

				if (name == "idleGold") {
					animations[1].sequence = [sequence];
				}

				if (name == "open" || name == "end") {
					const sheet = animations[0].sheet as ig.TileSheet;
					sheet.offY = newOffY + 24;
				}
			}
		},

		_initGfx() {
			if (!this.isOpen && this.chestType.anim) {
				this.setCurrentAnim(this.chestType.anim, true, null, true);
			}
		},

		getQuickMenuSettings() {
			let disabled = this.isOpen || (this.hideManager && this.hideManager.hidden);
			if (this.rawChest != undefined) {
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
				};
			}
		},

		isQuickMenuVisible() {
			return !!(this.mwCheck && this.rawChest);
		},

		_reallyOpenUp() {
			if (this.rawChest == undefined) {
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
			offsets: {default: {x: 432, y: 304}, flipped: {x: 456, y: 304}},
		}),
		transitions: {
			HIDDEN: {
				state: {alpha: 0},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR,
			},
			DEFAULT: {state: {}, time: 0.2, timeFunction: KEY_SPLINES.EASE},
		},

		init() {
			this.parent(127, 100);
			this.areaGui = new sc.TextGui("", {font: sc.fontsystem.tinyFont});
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

			this.clearance = new sc.TextGui("", {font: sc.fontsystem.tinyFont});
			this.clearance.setPos(5, 13);
			this.clearance.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.addChildGui(this.clearance);

			this.arrow = new sc.QuickItemArrow();
			this.addChildGui(this.arrow);

			this.typeGui = new sc.TextGui("", {font: sc.fontsystem.tinyFont});
			this.typeGui.setPos(8, 13);
			this.typeGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
			this.addChildGui(this.typeGui);

			this.collectedGui = new sc.TextGui("", {font: sc.fontsystem.tinyFont});
			this.collectedGui.setPos(0, 4);
			this.collectedGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
			this.addChildGui(this.collectedGui);
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
			if (!(chest instanceof ig.ENTITY.Chest) || !chest.mwCheck) {
				return false;
			}

			const area = ig.LangLabel.getText(sc.map.areas[sc.map.currentArea.cacheKey].name);
			const [shortArea, location] = chest.mwCheck.name.split(": ", 2);

			let level = null;

			if (chest.chestType == sc.CHEST_TYPE.Bronze) {
				level = "Bronze";
			}
			if (chest.chestType == sc.CHEST_TYPE.Silver) {
				level = "Silver";
			}
			if (chest.chestType == sc.CHEST_TYPE.Gold) {
				level = "Gold";
			}

			this.areaGui.setText(`\\c[4]${shortArea}\\c[0]`);
			this.locationGui.setText(location);
			if (level) {
				this.clearance.setText(`\\c[3]${level}\\c[0]`);
				this.line.hook.size.x = 114 - this.clearance.hook.size.x;
			} else {
				this.clearance.setText("");
				this.line.hook.size.x = 117;
			}

			this.hook.size.y = 41 + this.locationGui.hook.size.y;

			this.typeGui.setText(`Type: ${chest.analyzeLabel}\\c[0]`);
			this.collectedGui.setText(chest.collectedLabel);

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
}
