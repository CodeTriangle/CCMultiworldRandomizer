import type MwRandomizer from '../plugin';

export function patch(plugin: MwRandomizer) {
	sc.MenuModel.inject({
		incrementDropCount(drop, anim) {
			const completedBefore = sc.menu.dropCounts[drop]?.completed ?? false;
			this.parent(drop, anim);
			const completedAfter = sc.menu.dropCounts[drop]?.completed ?? false;
			if (!completedBefore && completedAfter) {
				const mwid = sc.randoData.botanics[drop];
				sc.multiworld.reallyCheckLocation(mwid);
			}
		},
	});
}
