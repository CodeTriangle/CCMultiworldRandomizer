
import type MwRandomizer from "../plugin";

export function patch(plugin: MwRandomizer) {
	sc.OPTIONS_DEFINITION["openworld-visitedMaps"] = {
		type: "CHECKBOX",
		init: false,
		cat: sc.OPTION_CATEGORY.GENERAL,
		hasDivider: true,
		header: "cc-open-world",
	};
	sc.OPTIONS_DEFINITION["openworld-disabledTips"] = {
		type: "CHECKBOX",
		init: false,
		cat: sc.OPTION_CATEGORY.GENERAL,
		hasDivider: false,
		header: "cc-open-world",
	};
	sc.OPTIONS_DEFINITION["openworld-fullQuestHub"] = {
		type: "CHECKBOX",
		init: false,
		cat: sc.OPTION_CATEGORY.GENERAL,
		hasDivider: false,
		header: "cc-open-world",
	};
}
