import type MwRandomizer from '../plugin';
import { ItemInfo } from '../item-data.model';
import "../types/multiworld-model.d";

export function patch(plugin: MwRandomizer) {
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
}
