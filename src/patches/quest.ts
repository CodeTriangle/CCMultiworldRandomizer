import type MwRandomizer from "../plugin";
import "../types/multiworld-model.d";

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
			callback: CallableFunction,
			finished: bool,
			characterName: string,
			mapName: string,
		) {
			this.parent(quest, callback, finished, characterName, mapName);

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

			this.setSize(this.hook.size.x, this.hook.size.y + 6);
			
			plugin.makeApItemsGui(quest, !hideRewards, mwQuest, this.itemsGui, this.gfx);
		},

		modelChanged(model: sc.Model, msg: number, data: any) {
			if (
				model == sc.multiworld &&
				msg == sc.MULTIWORLD_MSG.CONNECTION_STATUS_CHANGED &&
				this.mwQuest &&
				sc.multiworld.locationInfo[this.mwQuest.mwids[0]] === undefined
			) {
				plugin.makeApItemsGui(this.quest, this.finished, this.mwQuest, this.itemsGui, this.gfx);
			}
		}
	});

	sc.QuestDetailsView.inject({
		_setQuest(quest: sc.Quest) {
			this.parent(quest);
			let mwQuest = randoData.quests[quest.id]
			if (
				mwQuest === undefined ||
				sc.multiworld.locationInfo[mwQuest.mwids[0]] === undefined
			) {
				return;
			}
			
			plugin.makeApItemsGui(quest, false, mwQuest, this.itemsGui, this.gfx);
		}
	});
}
