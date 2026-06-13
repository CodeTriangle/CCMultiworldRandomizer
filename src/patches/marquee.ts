import * as ap from "archipelago.js";
import type MwRandomizer from "../plugin";
import type { ItemInfo, RawQuest } from "../item-data.model";
import { getElementIconString } from "../utils";

declare global {
	namespace sc {
		interface MultiWorldItemMarqueeGui extends codetriangle.marquee.ItemMarqueeGui {
			worldGui: sc.TextGui;
			itemInfo: ItemInfo;

			setText(this: this, text: string): void;
		}
	}
}

export function patch(plugin: MwRandomizer) {
	sc.MultiWorldItemMarqueeGui = codetriangle.marquee.ItemMarqueeGui.extend({
		init(itemInfo: ItemInfo, width: number, settings?: codetriangle.marquee.TextMarqueeGui.Settings) {
			this.parent(itemInfo.icon, itemInfo.label, width, settings);

			this.itemInfo = itemInfo;

			this.worldGui = new sc.TextGui(itemInfo.player, { "font": sc.fontsystem.tinyFont });
			this.worldGui.setPos(17, this.iconGui.hook.size.y - 2);
			this.addChildGui(this.worldGui);

			this.hook.size.y += 4;
		}
	});
}
