import type MwRandomizer from "../plugin";

declare global {
	namespace sc {
		interface MenuModel {
		}
	}
}

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
		}
	});
}
