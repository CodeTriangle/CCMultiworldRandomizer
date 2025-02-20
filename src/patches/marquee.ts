import * as ap from "archipelago.js";
import type MwRandomizer from "../plugin";
import type { ItemInfo, RawQuest } from "../item-data.model";
import { getElementIconString } from "../utils";

declare global {
	namespace sc {
		namespace TextMarqueeGui {
			interface Settings extends sc.TextGui.Settings {
				autoScroll?: boolean;
				scrollSpeed?: number;
				holdTime?: number;
				holdOnReset?: boolean;
			}
		}

		interface TextMarqueeGui extends ig.GuiElementBase {
			textGui: sc.TextGui;
			active: boolean;
			scrollSpeed: number;
			holdTime: number;
			holdOnReset: boolean;
			currentPosition: number;
			direction: number;
			timer: number;
			group: sc.MarqueeGroup;

			setText(this: this, text: string): void;
			addToGroup(this: this, group: sc.MarqueeGroup): void;
			activate(this: this): void;
			deactivate(this: this): void;
			reset(this: this): void;
			startTimer(this: this): void;
		}

		interface TextMarqueeGuiConstructor extends ImpactClass<TextMarqueeGui> {
			new(text: string, width: number, settings: sc.TextMarqueeGui.Settings | undefined): TextMarqueeGui;
		}

		var TextMarqueeGui: sc.TextMarqueeGuiConstructor;

		interface ItemMarqueeGui extends ig.GuiElementBase {
			iconGui: sc.TextGui;
			labelGui: sc.TextMarqueeGui;
			settings: sc.TextMarqueeGui.Settings;

			setText(this: this, text: string): void;
			addToGroup(this: this, group: sc.MarqueeGroup): void;
		}

		interface ItemMarqueeGuiConstructor extends ImpactClass<ItemMarqueeGui> {
			new(icon: string, label: string, width: number, settings?: sc.TextMarqueeGui.Settings): ItemMarqueeGui;
		}

		var ItemMarqueeGui: sc.ItemMarqueeGuiConstructor;

		interface MultiWorldItemMarqueeGui extends sc.ItemMarqueeGui {
			worldGui: sc.TextGui;
			itemInfo: ItemInfo;

			setText(this: this, text: string): void;
		}

		interface MultiWorldItemMarqueeGuiConstructor extends ImpactClass<MultiWorldItemMarqueeGui> {
			new(data: ItemInfo, width: number, settings?: sc.TextMarqueeGui.Settings): MultiWorldItemMarqueeGui;
		}

		var MultiWorldItemMarqueeGui: sc.MultiWorldItemMarqueeGuiConstructor;

		interface MarqueeGroup extends ig.Class {
			elements: TextMarqueeGui[];
			active: boolean;
			finished: TextMarqueeGui[];

			add(this: this, gui: sc.TextMarqueeGui): void;
			setDone(this: this, gui: sc.TextMarqueeGui): void;
			activate(this: this): void;
			deactivate(this: this): void;
			reset(this: this): void;
		}

		interface MarqueeGroupConstructor extends ImpactClass<MarqueeGroup> {
			new(active: boolean): MarqueeGroup;
		}

		var MarqueeGroup: sc.MarqueeGroupConstructor;

		interface ButtonGui {
			textChild: ItemMarqueeGui
		}
	}
}

export function patch(plugin: MwRandomizer) {
	const DEFAULT_SCROLL_SPEED = 30;
	const DEFAULT_HOLD_TIME = 1;

	sc.TextMarqueeGui = ig.GuiElementBase.extend({
		init(text: string, width: number, settings: sc.TextMarqueeGui.Settings | undefined) {
			this.parent();

			this.textGui = new sc.TextGui(text, settings);

			this.addChildGui(this.textGui);

			this.setSize(width, this.textGui.hook.size.y);
			this.hook.clip = true;

			this.active = settings?.autoScroll || false;
			this.scrollSpeed = settings?.scrollSpeed || DEFAULT_SCROLL_SPEED;
			this.holdTime = settings?.holdTime || DEFAULT_HOLD_TIME;
			this.holdOnReset = settings?.holdOnReset == undefined ? true : settings.holdOnReset;

			this.reset();
		},

		setText(text) {
		    this.textGui.setText(text);
		},

		activate() {
			this.active = true;
		},

		deactivate() {
			this.active = false;
		},

		reset() {
			this.currentPosition = 0;
			if (this.holdOnReset) {
				this.timer = this.holdTime;
				this.direction = 1;
			} else {
				this.timer = 0;
				this.direction = -1;
			}
			this.textGui.hook.pos.x = 0;
		},

		startTimer() {
			if (this.group) {
				this.group.setDone(this);
			} else {
				this.timer = this.holdTime;
			}
		},

		addToGroup(group) {
			group.add(this);
			this.group = group;
		},

		update() {
			this.parent();

			if (!this.active) {
				return;
			}

			if (this.textGui.hook.size.x < this.hook.size.x) {
				this.textGui.hook.pos.x = 0;
				this.group?.setDone(this);
				return;
			}

			const prevPos = this.textGui.hook.pos.x;
			if (this.timer > 0) {
				this.timer -= ig.system.actualTick;
				if (this.timer > 0) {
					return;
				} else {
					this.direction = -this.direction;
				}
			}

			let nextPos = prevPos + Math.sign(this.direction) * this.scrollSpeed * ig.system.actualTick;

			if (this.direction < 0 && nextPos < this.hook.size.x - this.textGui.hook.size.x) {
				nextPos = this.hook.size.x - this.textGui.hook.size.x;
				this.startTimer();
			} else if (this.direction > 0 && nextPos > 0) {
				nextPos = 0;
				this.startTimer();
			}

			this.textGui.hook.pos.x = nextPos;
		},
	});

	sc.ItemMarqueeGui = ig.GuiElementBase.extend({
		init(icon: string, label: string, width: number, settings?: sc.TextMarqueeGui.Settings) {
			this.parent();

			this.iconGui = new sc.TextGui(`\\i[${icon}]`);
			this.addChildGui(this.iconGui);
			this.settings = settings || { autoScroll: true };

			this.labelGui = new sc.TextMarqueeGui(label, width - 15, this.settings);
			this.labelGui.hook.pos.x = 15;
			this.addChildGui(this.labelGui);

			this.hook.size.x = width;
			this.hook.size.y = this.iconGui.hook.size.y;
		},

		setText(text) {
			this.labelGui.setText(text);
		},

		addToGroup(group) {
			this.labelGui.addToGroup(group);
		},
	});

	sc.MultiWorldItemMarqueeGui = sc.ItemMarqueeGui.extend({
		init(itemInfo: ItemInfo, width: number, settings?: sc.TextMarqueeGui.Settings) {
			this.parent(itemInfo.icon, itemInfo.label, width, settings);

			this.itemInfo = itemInfo;

			this.worldGui = new sc.TextGui(itemInfo.player, { "font": sc.fontsystem.tinyFont });
			this.worldGui.setPos(17, this.iconGui.hook.size.y - 2);
			this.addChildGui(this.worldGui);

			this.hook.size.y += 4;
		}
	});

	sc.MarqueeGroup = ig.Class.extend({
		init(active) {
			this.elements = [];
			this.active = active;
			this.finished = [];
		},

		add(gui) {
			if (this.elements.includes(gui)) {
				return;
			}

			gui.active = this.active;
			this.elements.push(gui);
		},

		setDone(gui) {
			if (this.elements.includes(gui) && !this.finished.includes(gui)) {
				this.finished.push(gui);
			}

			if (this.finished.length != 0 && this.finished.length != this.elements.length) {
				gui.deactivate();
				return;
			}

			for (const el of this.elements) {
				el.activate();
				el.timer = el.holdTime;
			}

			this.finished = [];
		},

		activate() {
			for (const el of this.elements) {
				el.activate();
			}
		},

		deactivate() {
			for (const el of this.elements) {
				el.deactivate();
			}
		},

		reset() {
			for (const el of this.elements) {
				el.reset();
			}
		},
	});
}
