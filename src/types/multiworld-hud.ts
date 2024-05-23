import type {ItemInfo, RawQuest} from "../item-data.model";

declare global {
	namespace sc {
		interface MultiWorldItemContent extends ig.GuiElementBase {
			timer: number;
			id: number;
			player: number;
			textGui: sc.TextGui;
			subGui: MultiWorldItemContent

			updateOption(this: this, isNormalSize: boolean): void;
			updateTimer(this: this): void;
		}

		interface MultiWorldItemContentConstructor extends ImpactClass<MultiWorldItemContent> {
			new (item: ItemInfo, receive: boolean): MultiWorldItemContent;
		}

		var MultiWorldItemContent: sc.MultiWorldItemContentConstructor;

		interface MultiWorldHudBox extends sc.RightHudBoxGui, sc.Model.Observer {
			contentEntries: MultiWorldItemContent[];
			delayedStack: MultiWorldItemContent[];
			size: number;

			addEntry(this: this, itemInfo: ItemInfo, receive: boolean): void;
			_popDelayed(this: this): void;
			_updateSizes(this: this, isNormalSize: boolean): void;
		}

		interface MultiWorldHudBoxConstructor extends ImpactClass<MultiWorldHudBox> {
			new (): MultiWorldHudBox;
		}

		var MultiWorldHudBox: sc.MultiWorldHudBoxConstructor;

		interface MultiWorldQuestItemBox extends ig.GuiElementBase {
			gfx: ig.Image;
			scrollBox: sc.ScrollPane;
			content: ig.GuiElementBase;
			hideRewards: boolean;
			includeAllRewards: boolean;

			setQuest(this: this, mwQuest: RawQuest, quest: sc.Quest): void;
		}

		interface MultiWorldQuestItemBoxConstructor extends ImpactClass<MultiWorldQuestItemBox> {
			new (
				width: number,
				height: number,
				quest: sc.Quest,
				mwQuest: RawQuest,
				showRewardAnyway: boolean,
				includeAllRewards: boolean
			): MultiWorldQuestItemBox;
		}

		var MultiWorldQuestItemBox: sc.MultiWorldQuestItemBoxConstructor;
	}
}
