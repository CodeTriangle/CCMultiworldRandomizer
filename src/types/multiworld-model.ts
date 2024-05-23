import type {WorldData} from "../item-data.model";
import type * as ap from "archipelago.js";

declare global {
	namespace ig {
		namespace EVENT_STEP {
			interface SEND_ITEM extends ig.EventStepBase {
				mwids: number[];
				oldItem: {item: string; amount: number};
			}

			interface MW_GOAL_COMPLETED extends ig.EventStepBase {
				goal: string;
			}

			interface SendItemConstructor extends ImpactClass<SEND_ITEM> {
				new (settings: {mwids: number[]; item: string; amount: number}): SEND_ITEM;
			}

			interface MwGoalCompletedConstructor extends ImpactClass<MW_GOAL_COMPLETED> {
				new (settings: {goal: string}): MW_GOAL_COMPLETED;
			}

			var SEND_ITEM: SendItemConstructor;
			var MW_GOAL_COMPLETED: MwGoalCompletedConstructor;
		}
	}

	namespace sc {
		enum MULTIWORLD_MSG {
			CONNECTION_STATUS_CHANGED,
			ITEM_SENT,
			ITEM_RECEIVED,
			OPTIONS_PRESENT,
		}

		interface MultiWorldModel extends ig.GameAddon, sc.Model, ig.Storage.Listener {
			client: ap.Client;
			previousConnectionStatus: ap.ConnectionStatus;

			baseId: number;
			baseNormalItemId: number;
			numItems: number;
			gamepackage: ap.GamePackage;
			randoData: WorldData;

			questSettings: {
				hidePlayer: boolean;
				hideIcon: boolean;
			};

			lastIndexSeen: number;
			locationInfo: {[idx: number]: ap.NetworkItem};
			connectionInfo: ap.ConnectionInformation;
			localCheckedLocations: number[];
			mode: string;
			options: any;

			getElementConstantFromComboId(this: this, comboId: number): number | null;
			getItemDataFromComboId(this: this, comboId: number): [itemId: number, quantity: number];

			notifyItemsSent(this: this, items: ap.NetworkItem[]): void;
			onLevelLoaded(this: this): void;
			updateConnectionStatus(this: this): void;
			addMultiworldItem(this: this, itemInfo: ap.NetworkItem, index: number): void;
			getLocationInfo(
				this: this,
				mode: ap.CreateAsHintMode,
				locations: number[],
				callback: (info: ap.NetworkItem[]) => void
			): void;
			storeAllLocationInfo(this: this): Promise<void>;
			reallyCheckLocation(this: this, mwid: number): Promise<void>;
			reallyCheckLocations(this: this, mwids: number[]): Promise<void>;
			login(this: this, connectionInfo: ap.ConnectionInformation): Promise<void>;
		}

		interface MultiWorldModelConstructor extends ImpactClass<MultiWorldModel> {
			new (): MultiWorldModel;
		}

		var MultiWorldModel: sc.MultiWorldModelConstructor;

		var multiworld: sc.MultiWorldModel;
	}
}
