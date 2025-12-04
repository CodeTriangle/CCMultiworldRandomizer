import type MwRandomizer from '../plugin';
import { ItemInfo } from '../item-data.model';


export function patch(plugin: MwRandomizer) {
	// And for my next trick I will rip off ItemContent and ItemHudGui from the base game
	// pls don't sue
	sc.MultiWorldNotifyBase = ig.GuiElementBase.extend({
		timer: 0,
		id: -1,
		player: -1,
		textGui: null,
		init: function (text: string) {
			this.parent();
			this.timer = 5;

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

	sc.MultiWorldItemContent = sc.MultiWorldNotifyBase.extend({
		init: function (item: ItemInfo, receive: boolean) {
			let verb = receive ? "Received" : "Sent";
			let prep = receive ? "from": "to";
			let text = `${verb} \\c[3]${plugin.getGuiString(item)}\\c[0] ${prep} \\c[3]${item.player}\\c[0]`;
			let isNormalSize = sc.options.get("item-hud-size") == sc.ITEM_HUD_SIZE.NORMAL;
			this.parent(text);
		},
	});

	sc.MultiWorldDeathContent = sc.MultiWorldNotifyBase.extend({
		init: function (receive: boolean, source?: string) {
			let verb = receive ? "Received" : "Sent";
			let prep = receive ? "from" : "to";
			let subject = receive ? source : "your friends";
			let icon = "trophies-COMBAT";
			let text = `\\c[1]${verb} \\i[${icon}]Death\\i[${icon}] ${prep} ${subject}\\c[0]`;
			this.parent(text);
		}
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

		addEntry: function (entry: any) {
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

				// potential crash? setContent doesn't exist on sc.MultiWorldItemContent
				// gui.setContent(gui.subGui);
			}
			this.rearrangeContent();
		},

		modelChanged: function (model, msg: number, data: any) {
			if (model == sc.multiworld) {
				if (
					msg == sc.MULTIWORLD_MSG.ITEM_SENT &&
					sc.options.get("show-items")
				) {
					const itemInfo = sc.multiworld.getItemInfo(data);
					this.addEntry(new sc.MultiWorldItemContent(itemInfo, false));
				} else if (
					msg == sc.MULTIWORLD_MSG.ITEM_RECEIVED &&
					sc.options.get("show-items")
				) {
					const itemInfo = sc.multiworld.getItemInfo(data);
					this.addEntry(new sc.MultiWorldItemContent(itemInfo, true));
				} else if (msg == sc.MULTIWORLD_MSG.DEATH_SENT) {
					this.addEntry(new sc.MultiWorldDeathContent(false));
				} else if (msg == sc.MULTIWORLD_MSG.DEATH_RECEIVED) {
					this.addEntry(new sc.MultiWorldDeathContent(true, data.source));
				}
			} else if (model == sc.model) {
				if (sc.model.isReset()) {
					this.clearContent();
					this.delayedStack.length = 0;
					this.hide();
				} else if (
					sc.model.isCutscene() ||
					sc.model.isHUDBlocked() ||
					sc.quests.hasQuestSolvedDialogs()
				) {
						this.hide()
				} else if (
					!sc.model.isCutscene() &&
					!sc.model.isHUDBlocked() &&
					this.contentEntries.length > 0 &&
					!sc.quests.hasQuestSolvedDialogs()
				) {
					this.show();
				}
			} else if (model == sc.options && msg == sc.OPTIONS_EVENT.OPTION_CHANGED) {
				const itemHudSize = sc.options.get("item-hud-size");
				if (itemHudSize != this.size) {
					this._updateSizes(itemHudSize == sc.ITEM_HUD_SIZE.NORMAL);
					this.size = itemHudSize;
				}
			}
		},
	});
}
