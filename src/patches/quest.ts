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
	interface Window {
		qdv: sc.QuestDetailsView;
	}
	var qdv: sc.QuestDetailsView;
}

export function patch(plugin: MwRandomizer) {
	let quests = plugin.randoData?.quests;
	sc.QuestModel.inject({
		_collectRewards(quest: sc.Quest) {
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
			this.questBox.hook.pos.y = -14;
			this.buttons.hook.pos.y -= 1;

			if (this.overlay) {
				this.questBox.removeChildGui(this.overlay);
				this.overlay = new ig.BoxGui(281, 246, false, this.questBox.ninepatch);
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

			this.hook.align.x = ig.GUI_ALIGN.Y_TOP;
			this.hook.size.y = 246;
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

			this.newItemsGui = new sc.MultiWorldQuestItemBox(
				146,
				finished ? 65 : 88,
				quest,
				mwQuest,
				finished,
				false
			);

			this.newItemsGui.setPos(124, finished ? 180 : 157);
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
			this.expGui.setText("");
			this.moneyGui.setText("");
			this.cpGui.setText("");
			this.atCurLevelGui.doStateTransition("HIDDEN", true);

			window.qdv = this;

			this.newItemsGui = new sc.MultiWorldQuestItemBox(
				150,
				110,
				quest,
				mwQuest,
				false,
				true
			);

			this.newItemsGui.setPos(25, 154);
			this.addChildGui(this.newItemsGui);
		}
	});

	// Move the quest decline button to the right of the quest accept button.
	// This is needed so that we can increase the height of the quest dialog.
	sc.QuestStartDialogButtonBox.inject({
		init(
			buttonGroup: sc.ButtonGroup,
			finished: boolean,
			mandatory: boolean,
			parentQuest: boolean,
		) {
			this.parent(buttonGroup, finished, mandatory, parentQuest);
			this.setSize(
				(finished || mandatory) ? 142 : 281,
				25
			);
			this.declineButton.setPos(142, 3);

			buttonGroup.removeFocusGui(0, 1);
			buttonGroup.addFocusGui(this.declineButton, 1, 0);
		},

		setAcceptMode(buttonGroup: sc.ButtonGroup) {
			this.parent(buttonGroup);

			this.hook.size.x = 142;
		}
	});

	sc.MultiWorldQuestItemBox = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/menu.png"),
		scrollBox: null,
		content: null,
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

			this.scrollBox = new sc.ScrollPane(sc.ScrollType.Y_ONLY);
			this.scrollBox.showTopBar = false;
			this.scrollBox.showBottomBar = false;
			this.scrollBox.setSize(width, height);
			this.addChildGui(this.scrollBox);
			this.content = new ig.GuiElementBase();
			this.scrollBox.setContent(this.content);

			const hiddenQuestRewardMode = sc.multiworld.options.hiddenQuestRewardMode;
			let hideRewards = quest.hideRewards;
			if (hiddenQuestRewardMode == "show_all") {
				hideRewards = false;
			} else if (hiddenQuestRewardMode == "hide_all") {
				hideRewards = true;
			}

			this.hideRewards = hideRewards && !showRewardAnyway;
			this.includeAllRewards = includeAllRewards;

			this.setQuest(mwQuest, quest);
		},

		update() {
			if (!ig.interact.isBlocked()) {
				if (sc.control.menuScrollUp()) {
					this.scrollBox.scrollY(-20, false, 0.05);
				} else if (sc.control.menuScrollDown()) {
					this.scrollBox.scrollY(20, false, 0.05);
				}

				if (sc.control.downDown()) {
					this.scrollBox.scrollY(200 * ig.system.tick)
				} else if (sc.control.upDown()) {
					this.scrollBox.scrollY(-200 * ig.system.tick);
				}
			}
		},

		setQuest(mwQuest: RawQuest, quest: sc.Quest) {
			if (sc.multiworld.options.questDialogHints && !this.hideRewards) {
				sc.multiworld.client.locations.scout(ap.CREATE_AS_HINT_MODE.HINT_ONLY_NEW, ...mwQuest.mwids);
			}

			this.content.removeAllChildren();

			let accum = 0;

			if (this.includeAllRewards) {
				if (quest.rewards.exp) {
					let label = this.hideRewards ? "????" : quest.rewards.exp.exp;
					let expGui = new sc.TextGui(`\\i[exp]${label}`);
					expGui.setPos(0, accum);
					this.content.addChildGui(expGui);
					accum += 16;
				}

				if (quest.rewards.money) {
					let label = this.hideRewards ? "????????" : quest.rewards.money;
					let creditGui = new sc.TextGui(`\\i[credit]${label}`);
					creditGui.setPos(0, accum);
					this.content.addChildGui(creditGui);
					accum += 16;
				}

				if (quest.rewards.cp) {
					let label = this.hideRewards
						? "????????" 
						: getElementIconString(quest.rewards.cp.element) + " x" + quest.rewards.cp.amount;
					let cpGui = new sc.TextGui(`\\i[cp]${label}`);
					cpGui.setPos(0, accum);
					this.content.addChildGui(cpGui);
					accum += 16;
				}
			}

			for (let i = 0; i < mwQuest.mwids.length; i++) {
				const mwid: number = mwQuest.mwids[i]
				const item: ap.NetworkItem = sc.multiworld.locationInfo[mwid];

				const itemInfo = plugin.getItemInfo(item);

				if (this.hideRewards) {
					itemInfo.label = "?????????????";
					if (sc.multiworld.questSettings.hidePlayer) {
						itemInfo.player =  "?????????????";
					}

					if (sc.multiworld.questSettings.hideIcon) {
						itemInfo.icon = "ap-logo";
					}
				}

				const labelGui = new sc.TextGui(`\\i[${itemInfo.icon}]`);
				const itemGui = new sc.TextGui(itemInfo.label, {
					maxWidth: this.hook.size.x - 20,
					linePadding: -4,
				});
				const worldGui = new sc.TextGui(itemInfo.player, { "font": sc.fontsystem.tinyFont });

				if (itemInfo.level > 0) {
					itemGui.setDrawCallback((width: number, height: number) => {
						sc.MenuHelper.drawLevel(
							itemInfo.level,
							width,
							height,
							this.gfx,
							itemInfo.isScalable
						);
					});
				}

				itemGui.setPos(15, accum);
				accum += itemGui.hook.size.y + 3;
				labelGui.setPos(-15, 0);
				itemGui.addChildGui(labelGui);

				worldGui.setPos(2, itemGui.hook.size.y - 2);
				this.content.addChildGui(itemGui);
				itemGui.addChildGui(worldGui);
			}

			this.content.setSize(this.hook.size.x, accum + 3);
			this.scrollBox.recalculateScrollBars();
		}
	});
}
