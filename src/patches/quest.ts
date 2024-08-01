import * as ap from "archipelago.js";
import type MwRandomizer from "../plugin";
import type { RawQuest } from "../item-data.model";
import { getElementIconString } from "../utils";

declare global {
	namespace sc {
		interface QuestDialog extends sc.Model.Observer {
			finished: boolean;
			mwQuest: RawQuest;
			newItemsGui: sc.MultiWorldQuestItemBox;
		}
		interface QuestDetailsView {
			newItemsGui: sc.MultiWorldQuestItemBox;
		}
	}
}

export function patch(plugin: MwRandomizer) {
	let quests = plugin.randoData?.quests;
	sc.QuestModel.inject({
		_collectRewards(quest: sc.Quest) {
			const previousItemAmounts: Record<sc.ItemID, number> = {};

			if (quest.rewards.items) {
				for (const item of quest.rewards.items) {
					previousItemAmounts[item.id] = sc.model.player.getItemAmount(item.id);
				}
			}

			this.parent(quest);

			if (quest.rewards.items) {
				for (const item of quest.rewards.items) {
					const toTakeAway = sc.model.player.getItemAmount(item.id) - previousItemAmounts[item.id];

					if (toTakeAway > 0) {
						sc.model.player.removeItem(item.id, toTakeAway);
					}
				}
			}

			const check = quests?.[quest.id];
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
			callback,
			finished,
			characterName,
			mapName,
		) {
			this.parent(quest, callback, finished, characterName, mapName);

			this.buttons.hook.pos.y = finished ? 22 : 23;
			this.questBox.hook.pos.y -= 1;
			this.questBox.hook.size.y += 10;

			if (this.overlay) {
				this.questBox.removeChildGui(this.overlay);
				this.overlay = new ig.BoxGui(281, this.questBox.hook.size.y, false, this.questBox.ninepatch);
				this.overlay.hook.transitions = {
					DEFAULT: { state: {}, time: 0.2, timeFunction: KEY_SPLINES.LINEAR },
					HIDDEN: {
						state: { alpha: 0 },
						time: 0.2,
						timeFunction: KEY_SPLINES.LINEAR,
					},
				};
				this.overlay.doStateTransition("HIDDEN", true);
				this.questBox.addChildGui(this.overlay);
			}

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
			let mwQuest = plugin.randoData?.quests[quest.id];
			this.mwQuest = mwQuest;
			if (
				mwQuest === undefined ||
				mwQuest.mwids === undefined ||
				mwQuest.mwids.length === 0 ||
				sc.multiworld.locationInfo[mwQuest.mwids[0]] === undefined
			) {
				return;
			}

			this.removeChildGui(this.itemsGui);
			if (this.newItemsGui) {
				this.removeChildGui(this.newItemsGui);
			}

			this.newItemsGui = new sc.MultiWorldQuestItemBox(
				142,
				finished ? 65 : 88,
				quest,
				mwQuest,
				finished,
				false
			);

			this.newItemsGui.setPos(124, finished ? 181 : 158);
			this.addChildGui(this.newItemsGui);
		},

		modelChanged(model: sc.Model, msg: number, data: any) {
			if (
				model == sc.multiworld &&
				msg == sc.MULTIWORLD_MSG.CONNECTION_STATUS_CHANGED &&
				this.mwQuest &&
				sc.multiworld.locationInfo[this.mwQuest.mwids[0]] === undefined
			) {
				this.newItemsGui.setQuest(this.mwQuest);
			}
		}
	});

	sc.QuestDetailsView.inject({
		_setQuest(quest: sc.Quest) {
			this.parent(quest);

			let mwQuest = plugin.randoData.quests[quest.id]
			if (
				mwQuest === undefined ||
				sc.multiworld.locationInfo[mwQuest.mwids[0]] === undefined
			) {
				return;
			}

			this.removeChildGui(this.itemsGui);
			if (this.newItemsGui) {
				this.removeChildGui(this.newItemsGui);
			}
			this.atCurLevelGui.doStateTransition("HIDDEN", true);

			this.newItemsGui = new sc.MultiWorldQuestItemBox(
				150,
				110,
				quest,
				mwQuest,
				false,
				true
			);

			let y = 160;
			if (quest.rewards.exp) {
				y += 16;
			}
			if (quest.rewards.money) {
				y += 16;
			}
			if (quest.rewards.cp) {
				y += 16;
			}

			this.newItemsGui.setPos(21, y);
			this.addChildGui(this.newItemsGui);
		}
	});

	sc.MultiWorldQuestItemBox = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/menu.png"),
		init(
			width: number,
			height: number,
			quest: sc.Quest,
			mwQuest: RawQuest,
			showRewardAnyway: boolean,
			includeAllRewards: boolean,
		) {
			this.parent();

			if (sc.multiworld.client.status != ap.CONNECTION_STATUS.CONNECTED) {
				return;
			}
			this.setSize(width, height);

			const hiddenQuestRewardMode = sc.multiworld.options.hiddenQuestRewardMode;
			let hideRewards = quest.hideRewards;
			if (hiddenQuestRewardMode == "show_all") {
				hideRewards = false;
			} else if (hiddenQuestRewardMode == "hide_all") {
				hideRewards = true;
			}

			this.hideRewards = hideRewards && !showRewardAnyway;
			this.includeAllRewards = includeAllRewards;

			this.setQuest(mwQuest);
		},

		setQuest(mwQuest: RawQuest) {
			if (sc.multiworld.options.questDialogHints && !this.hideRewards) {
				// @ts-ignore
				sc.multiworld.client.locations.scout(ap.CREATE_AS_HINT_MODE.HINT_ONLY_NEW, ...mwQuest.mwids);
			}

			this.removeAllChildren();

			const marqueeGroup = new sc.MarqueeGroup(true);

			let accum = 0;

			for (let i = 0; i < mwQuest.mwids.length; i++) {
				const mwid: number = mwQuest.mwids[i]
				const item: ap.NetworkItem = sc.multiworld.locationInfo[mwid];

				const itemInfo = plugin.getItemInfo(item);

				if (this.hideRewards) {
					itemInfo.label = "?????????????";
					if (sc.multiworld.questSettings.hidePlayer) {
						itemInfo.player = "?????????????";
					}

					if (sc.multiworld.questSettings.hideIcon) {
						itemInfo.icon = "ap-logo";
					}
				}

				const marqueeGui = new sc.MultiWorldItemMarqueeGui(itemInfo, this.hook.size.x);

				if (itemInfo.level > 0) {
					marqueeGui.iconGui.setDrawCallback((width: number, height: number) => {
						sc.MenuHelper.drawLevel(
							itemInfo.level,
							width,
							height,
							this.gfx,
							itemInfo.isScalable
						);
					});
				}

				marqueeGui.addToGroup(marqueeGroup);

				marqueeGui.setPos(0, accum);
				accum += marqueeGui.hook.size.y;

				this.addChildGui(marqueeGui);
			}
		}
	});
}
