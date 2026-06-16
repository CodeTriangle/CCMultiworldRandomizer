import type MwRandomizer from "../plugin";

declare global {
	namespace sc {
		enum MENU_OW_CUSTOM {
		  QUEST_HUB,
		}

		interface QuestHubList {
		}

		interface QuestHubListFull extends sc.QuestHubList {
		}

		interface QuestHubListFullConstructor extends ImpactClass<QuestHubListFull> {
			new(): QuestHubListFull;
		}

		var QuestHubListFull: QuestHubListFullConstructor;

		interface QuestHubMenu extends sc.ListInfoMenu {
		}
		interface QuestHubMenuConstructor extends ImpactClass<QuestHubMenu> {
			new(): QuestHubMenu;
		}

		var QuestHubMenu: QuestHubMenuConstructor;

		interface QuestHubMenuFull extends sc.QuestHubMenu {
		}

		interface QuestHubMenuFullConstructor extends ImpactClass<QuestHubMenuFull> {
			new(): QuestHubMenuFull;
		}

		var QuestHubMenuFull: QuestHubMenuFullConstructor;
	}
}

export function patch(plugin: MwRandomizer) {
	sc.MENU_OW_CUSTOM = {
		QUEST_HUB: 700,
	};

	sc.QuestHubListFull = sc.QuestHubList.extend({
		init: function () {
			this.parent();

			this.addTab("locked", 3, { type: 3 });
		},

		collectQuests: function (tab, order) {
			if (order != 3) {
				return this.parent();
			}

			var d = (ig.database.get("questHubs") as any)[sc.menu.questHubID];
			if (!d) throw Error("Quest HUB ID not found: " + sc.menu.questHubID);
			var d = d.areas,
				c = sc.quests.staticQuests,
				e = [],
				f = new ig.VarCondition(),
				g;
			for (g in c) {
				var h = c[g];
				if (h.hubSettings && !h.noTrack && (!h.extension || ig.extensions.hasExtension(h.extension))) {
					for (var i = 0; i < d.length; i++) {
						// Exception to add Quests condition locked
						if (!sc.quests.isQuestActive(g) && !sc.quests.isQuestSolved(g)) {
							if (h.hubSettings.condition) {
								f.setCondition(h.hubSettings.condition);
								!f.evaluate() && e.push(g);
							}
						}
					}
				}
			}
			order != void 0 && this.sortList(e, order);
			return e;
		},
	});

	sc.QuestHubMenuFull = sc.QuestHubMenu.extend({
		init() {
			this.parent();
			this.removeChildGui(this.list);
			let list = new sc.QuestHubListFull();
			this.list = list;
			this.list.setPos(8, 29);
			this.addChildGui(this.list);
			this.list.doStateTransition("HIDDEN", true);
		}
	});

	sc.SUB_MENU_INFO[sc.MENU_OW_CUSTOM.QUEST_HUB] = {
		Clazz: sc.QuestHubMenuFull,
		name: "questHub",
	};

}
