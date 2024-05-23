import * as ap from 'archipelago.js';
import type MwRandomizer from "../plugin";
import "../types/multiworld-model.d";

export function patch(plugin: MwRandomizer) {
	ig.ENTITY.Chest.inject({
		init(...args) {
			this.parent(...args);

			const map = plugin.randoData?.items[ig.game.mapName];
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
}
