import type MwRandomizer from "../plugin";

export function patch(plugin: MwRandomizer) {
	sc.MenuModel.inject({
		getTotalDropsFoundAndCompleted(percentage) {
			const max = sc.multiworld.options.botanicsCompletionAmount;
			if (max === undefined) {
				return this.parent(percentage);
			}

			let numFound = 0;

			Object.entries(this.drops).forEach(([key, drop]) => {
				if (
					drop.track &&
					sc.stats.getMap("exploration", "dropFound-" + key) &&
					this.dropCounts[key] &&
					this.dropCounts[key].completed
				) {
					numFound++;
				}
			});

			return percentage ? numFound / max : numFound;
		},

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
