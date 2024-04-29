import type MwRandomizer from "../plugin";

function set(root: Record<string, any>, value: any, path: string[], offset = 0) {
	if (path.length <= offset) {
		return;
	}
	while (offset < path.length - 1) {
		root = root[path[offset]];
		offset++;
	}

	if (path.length - 1 === offset) {
		root[path[offset]] = value;
	}
}

export function patch(plugin: MwRandomizer) {
	let maps = plugin.randoData?.items;

	ig.Game.inject({
		loadLevel(map, ...args) {
			const mapOverrides = maps?.[map.name.replace(/[\\\/]/g, '.')];
			if (mapOverrides) {
				for (const entity of map.entities) {
					if (
						entity
						&& entity.settings
						&& entity.settings.mapId
						&& mapOverrides.cutscenes
						&& mapOverrides.cutscenes[entity.settings.mapId]
					) {
							for (const check of mapOverrides.cutscenes[entity.settings.mapId]) {
								const path = check.path.slice(1).split(/\./g);

								set(entity, 'SEND_ITEM', [...path, 'type']);
								set(entity, check.mwids, [...path, 'mwids']);
							}
						}
				}
			}

			return this.parent(map, ...args);
		}
	});
}
