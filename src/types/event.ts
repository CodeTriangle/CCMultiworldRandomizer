declare global {
	namespace ig {
		namespace EVENT_STEP {
			// EQUIP_ITEM

			namespace EQUIP_ITEM {
				interface Settings {
					part: sc.MENU_EQUIP_BODYPART;
					item: string | number;
				}
			}

			interface EQUIP_ITEM extends ig.EventStepBase {
				// Where does the equip go
				part: sc.MENU_EQUIP_BODYPART;
				// ID of item to equip
				item: string | number;
			}

			interface EQUIP_ITEM_CONSTRUCTOR extends ImpactClass<EQUIP_ITEM> {
				new(settings: EQUIP_ITEM.Settings): EQUIP_ITEM;
			}

			var EQUIP_ITEM: EQUIP_ITEM_CONSTRUCTOR;

			// UPDATE_VISITED_AREA

			namespace UPDATE_VISITED_AREA {
				interface Settings {
					area: string;
				}
			}

			interface UPDATE_VISITED_AREA extends ig.EventStepBase {
				// Area to mark as visited
				area: string;
			}

			interface UPDATE_VISITED_AREA_CONSTRUCTOR extends ImpactClass<UPDATE_VISITED_AREA> {
				new(settings: UPDATE_VISITED_AREA.Settings): UPDATE_VISITED_AREA;
			}

			var UPDATE_VISITED_AREA: UPDATE_VISITED_AREA_CONSTRUCTOR;

			// MAP_AND_STAMP

			namespace MAP_AND_STAMP {
				interface StampSpec {
					key: sc.MenuModel.StampTypes;
					x: number;
					y: number;
					level: number;
				}

				interface Settings {
					area: string;
					stamp: StampSpec;
				}
			}

			interface MAP_AND_STAMP extends ig.EventStepBase {
				// Area to add stamp to
				area: string;
				// Stamp to add
				stamp: MAP_AND_STAMP.StampSpec;
			}

			interface MAP_AND_STAMP_CONSTRUCTOR extends ImpactClass<MAP_AND_STAMP> {
				new(settings: MAP_AND_STAMP.Settings): MAP_AND_STAMP;
			}

			var MAP_AND_STAMP: MAP_AND_STAMP_CONSTRUCTOR;

			// SYNC_PARTY_MEMBER_SP_LEVEL

			namespace SYNC_PARTY_MEMBER_SP_LEVEL {
				interface Settings {
					member: string;
				}
			}

			interface SYNC_PARTY_MEMBER_SP_LEVEL extends ig.EventStepBase {
				// Party member to add
				member: string;
			}

			interface SYNC_PARTY_MEMBER_SP_LEVEL_CONSTRUCTOR extends ImpactClass<SYNC_PARTY_MEMBER_SP_LEVEL> {
				new(settings: SYNC_PARTY_MEMBER_SP_LEVEL.Settings): SYNC_PARTY_MEMBER_SP_LEVEL;
			}

			var SYNC_PARTY_MEMBER_SP_LEVEL: SYNC_PARTY_MEMBER_SP_LEVEL_CONSTRUCTOR;

			// SHOW_OW_AR_MSG

			namespace SHOW_OW_AR_MSG {
				interface Settings extends ig.EVENT_STEP.SHOW_AR_MSG.Settings {
					yOffset: number;
				}
			}

			interface SHOW_OW_AR_MSG extends ig.EVENT_STEP.SHOW_AR_MSG {
				yOffset: number;
			}

			interface SHOW_OW_AR_MSG_CONSTRUCTOR extends ImpactClass<SHOW_OW_AR_MSG> {
				new(settings: SHOW_OW_AR_MSG.Settings): SHOW_OW_AR_MSG;
			}

			var SHOW_OW_AR_MSG: SHOW_OW_AR_MSG_CONSTRUCTOR;
		}
	}

	namespace sc {
		interface AR_COLOR {
			BLUE: { rgb: string, yOff: number }
		}
	}
}

export {};
