import * as ap from "archipelago.js";
import type MwRandomizer from "../plugin";
import { RawQuest, RawQuests } from "../item-data.model";
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
	let mwQuests: RawQuests = plugin.randoData?.quests;

	function getRawQuestFromQuestId(questId: string) {
		let mwQuest = mwQuests[questId];
		if (
			mwQuest === undefined ||
			mwQuest.mwids === undefined ||
			mwQuest.mwids.length === 0 ||
			sc.multiworld.locationInfo[mwQuest.mwids[0]] === undefined
		) {
			return undefined;
		}
		return mwQuest;
	}

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

			const check = getRawQuestFromQuestId(quest.id);
			if (check == undefined) return this.parent(quest);

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
			let mwQuest = getRawQuestFromQuestId(quest.id);
			if (mwQuest == undefined) return;

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

			let mwQuest = getRawQuestFromQuestId(quest.id);
			if (mwQuest == undefined) return;

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

	sc.QuestHubListEntry.inject({
		init(questId: string, tabIndex: number) {
			this.parent(questId, tabIndex);

			// Remove vanilla text icons from the rewards hook, and
			// offset AP icons' X position with the image icons we're keeping
			let rewardIcons = this.rewards.hook.children;
			let apIconX = 10;
			for (let i = rewardIcons.length - 1; i >= 1; i--) {
				let currentIcon = rewardIcons[i].gui;
				if ('font' in currentIcon) {
					this.rewards.hook.removeChildHookByIndex(i);
				// @ts-ignore
				} else if (currentIcon.offsetX) {
					// @ts-ignore
					switch (currentIcon.offsetX) {
						case 472: // Experience
							apIconX += 17;
							break;
						case 593: // Circuit Points
							apIconX += 13;
							break;
						case 488: // Credits
							apIconX += 15;
							break;
					}
				}
			}

			// @ts-ignore
			let quest = sc.quests.getStaticQuest(questId);
			let mwQuest = getRawQuestFromQuestId(questId);
			if (mwQuest == undefined) return;

			for (let i = 0; i < mwQuest.mwids.length; i++) {
				const mwid: number = mwQuest.mwids[i];
				const item: ap.NetworkItem = sc.multiworld.locationInfo[mwid];

				const itemInfo = plugin.getItemInfo(item);

				let icon = "ap-logo";
				let useGenericIcon = true;
				const hiddenQuestRewardMode = sc.multiworld.options.hiddenQuestRewardMode;
				if (hiddenQuestRewardMode == "show_all") {
					useGenericIcon = false;
				} else if (
					hiddenQuestRewardMode == "hide_all" ||
					(hiddenQuestRewardMode == "vanilla" && quest.hideRewards)
				) {
					useGenericIcon = sc.multiworld.options.hiddenQuestObfuscationLevel == "hide_all";
				} else {
					useGenericIcon = false;
				}

				if (!useGenericIcon) {
					icon = itemInfo.icon;
				}

				if (icon.startsWith("ap-")) {
					apIconX -= 1;
				}

				const apIcon = new sc.TextGui(`\\i[${icon}]`);

				if (itemInfo.level > 0) {
					apIcon.setDrawCallback((width: number, height: number) => {
						sc.MenuHelper.drawLevel(
							itemInfo.level,
							width,
							height,
							this.gfx,
							itemInfo.isScalable
						);
					});
				}
				apIcon.setPos(apIconX, 10);
				this.rewards.addChildGui(apIcon);
				apIconX += 16;
			}
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

			this.quest = quest;

			this.setQuest(mwQuest);
		},

		setQuest(mwQuest: RawQuest) {
			if (sc.multiworld.options.questDialogHints && !this.hideRewards) {
				const toHint = mwQuest.mwids.filter(mwid =>
					sc.multiworld.locationInfo[mwid] != undefined &&
					sc.multiworld.locationInfo[mwid].flags & ap.ITEM_FLAGS.PROGRESSION
				);

				if (toHint.length > 0) {
					sc.multiworld.client.locations.scout(ap.CREATE_AS_HINT_MODE.HINT_ONLY_NEW, ...toHint);
				}
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
						itemInfo.level = 0;
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
