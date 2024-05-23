import * as ap from 'archipelago.js';
import type MwRandomizer from "../plugin";
import "../types/multiworld-model.d";

export function patch(plugin: MwRandomizer) {
	let maps = plugin.randoData?.items;

	ig.EVENT_STEP.SET_PLAYER_CORE.inject({
		start() {
			if (
				this.core != sc.PLAYER_CORE.ELEMENT_HEAT &&
				this.core != sc.PLAYER_CORE.ELEMENT_COLD &&
				this.core != sc.PLAYER_CORE.ELEMENT_SHOCK &&
				this.core != sc.PLAYER_CORE.ELEMENT_WAVE
			) {
				return this.parent();
			}

			const map = maps?.[ig.game.mapName];
			if (!map || !map.elements) {
				return this.parent();
			}

			const check = Object.values(map.elements)[0] as RawElement;
			sc.multiworld.reallyCheckLocations(check.mwids);
		}
	});

	ig.EVENT_STEP.RESET_SKILL_TREE.inject({
		start() {
			if (maps?.[ig.game.mapName]) {
				return; // do not reset the skilltree if there is a check in the room
			}
			return this.parent();
		}
	});

	ig.EVENT_STEP.SEND_ITEM = ig.EventStepBase.extend({
		mwids: [],
		oldItem: undefined,
		init(settings) {
			this.mwids = settings.mwids.filter(x => sc.multiworld.locationInfo[x] != undefined);
			this.oldItem = {
				"item": settings.item,
				"amount": settings.amount,
			}
		},
		start() {
			if (this.mwids.length == 0) {
				let amount = ig.Event.getExpressionValue(this.oldItem.amount);
				sc.model.player.addItem(this.oldItem.item, amount, false);
			}

			sc.multiworld.reallyCheckLocations(this.mwids);
		}
	});

	ig.EVENT_STEP.MW_GOAL_COMPLETED = ig.EventStepBase.extend({
		init(settings) {
			// In the future, goal will only update client status if it checks off
			// a specific goal specified by their yaml. For now, there's only one
			// goal.
			this.goal = settings.goal;
		},
		start() {
			sc.multiworld.client.updateStatus(ap.CLIENT_STATUS.GOAL);
		}
	});
}
