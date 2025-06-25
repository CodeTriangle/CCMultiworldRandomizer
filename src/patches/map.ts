import MwRandomizer from "../plugin";
import { MarkerInfo, MarkerTypeSpecificSettings } from "../item-data.model"; 

declare global {
	namespace sc {
		var MULTIWORLD_MARKER_ICON_COORDS: Record<string, [x: number, y: number]>

		interface MultiworldMapMarker extends ig.FocusGui {
			gfx: ig.Image;
			markerInfo: MarkerInfo<any>;

			addMarkerIcon(this: this, coords: [x: number, y: number]): void;
		}

		interface MultiworldMapMarkerConstructor extends ImpactClass<MultiworldMapMarker> {
			new(info: MarkerInfo<keyof MarkerTypeSpecificSettings>): MultiworldMapMarker;
		}

		var MultiworldChestMarker: MultiworldMapMarkerConstructor;
	}
}

export function patch(plugin: MwRandomizer) {
	sc.MULTIWORLD_MARKER_ICON_COORDS = {
		"filler": [0, 0],
		"useful": [1, 0],
		"progression": [2, 0],
		"unknown": [3, 0],
		"rim-bronze": [0, 2],
		"rim-silver": [1, 2],
		"rim-gold": [2, 2],
		"event": [0, 3],
		"checked": [1, 3],
	}

	sc.MultiworldChestMarker = ig.FocusGui.extend({
		gfx: new ig.Image("media/gui/markers.png"),
		init(info) {
			this.parent();
			this.markerInfo = info;

			this.setPos(info.x.round(0) - 6, info.y.round(0) - 6);
			this.setSize(12, 12);

			if (sc.multiworld.localCheckedLocations.has(info.mwid)) {
				this.addMarkerIcon(sc.MULTIWORLD_MARKER_ICON_COORDS.checked);
				return;
			}

			if (info.type == "Chest") {
				let loc = sc.multiworld.locationInfo[info.mwid];

				let isSeen = sc.multiworld.seenChests.has(info.mwid);

				if (!isSeen) {
					this.addMarkerIcon(sc.MULTIWORLD_MARKER_ICON_COORDS.unknown);
				} else {
					if (loc.progression) {
						this.addMarkerIcon(sc.MULTIWORLD_MARKER_ICON_COORDS.progression);
					} else if (loc.useful || loc.trap) {
						this.addMarkerIcon(sc.MULTIWORLD_MARKER_ICON_COORDS.useful);
					} else {
						this.addMarkerIcon(sc.MULTIWORLD_MARKER_ICON_COORDS.filler);
					}

					let clearance = (info as MarkerInfo<"Chest">).settings.defaultClearance;

					clearance = sc.multiworld.options.chestClearanceLevels?.[info.mwid] ?? clearance;

					if (clearance != "Default") {
						this.addMarkerIcon(
							sc.MULTIWORLD_MARKER_ICON_COORDS["rim-" + clearance.toLowerCase()]
						);
					}
				}
			}
		},

		addMarkerIcon(coords) {
			this.addChildGui(new ig.ImageGui(this.gfx, 12 * coords[0], 12 * coords[1], 12, 12));
		},
	});

	sc.MapAreaContainer.inject({
		createLandmarks(doAnything, floor) {
			this.parent(doAnything, floor);

			// i don't know what the first argument does
			// in the parent function the entire block is wrapped in an if statement
			// so its purpose i guess is to tell you whether to do anything at all.
			if (doAnything) {
				let markers = sc.randoData.markers[sc.map.currentArea.path];
				if (!markers) {
					return;
				}

				for (const marker of markers) {
					if (sc.multiworld.locationInfo.hasOwnProperty(marker.mwid)) {
						if (marker.level == floor.floor.level) {
							floor.addChildGui(new sc.MultiworldChestMarker(marker));
						}
					}
				}
			}
		}
	});
}
