import type * as ap from "archipelago.js";
import { ItemInfo } from "../item-data.model";

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
			PRINT_JSON,
		}

		enum MULTIWORLD_CONNECTION_STATUS {
			CONNECTED = "CONNECTED",
			CONNECTING = "CONNECTING",
			DISCONNECTED = "DISCONNECTED",
		}

		namespace MultiWorldModel {
			interface ConnectionInformation {
				url: string;
				name: string;
				password: string;
			}

			interface LegacyConnectionInformation {
				hostname: string;
				port: number;
				name: string;
				password?: string;
			}

			type AnyConnectionInformation = ConnectionInformation | LegacyConnectionInformation;

			interface LocalInternalItem {
				item: number;
				player: number;
				flags: number;
			}

			interface LoginListener {
				onLoginProgress(this: this, message: string): void;
				onLoginError(this: this, message: string): void;
				onLoginSuccess(this: this, message: string): void;
			}

			export type MultiworldOptions = {
				vtShadeLock: boolean | number,
				meteorPassage: boolean,
				vtSkip: boolean,
				keyrings: number[],
				questRando: boolean,
				hiddenQuestRewardMode: string,
				hiddenQuestObfuscationLevel: string,
				questDialogHints: boolean,
				progressiveChains: Record<string, number[]>
				shopSendMode?: string,
				shopReceiveMode?: string,
				shopDialogHints?: boolean,
				chestClearanceLevels?: Record<number, keyof typeof sc.CHEST_TYPE>
			};

			export type MultiworldVars = {
				connectionInfo: AnyConnectionInformation;
				mode: "open" | "linear";
				options: MultiworldOptions;
				lastIndexSeen: number;
				checkedLocations: number[];
				progressiveChainProgress: Record<number, number>;
				locationInfo: Record<number, LocalInternalItem>;
				offlineCheckBuffer: number[];
				dataPackageChecksums: Record<string, string>;
				seenChests: number[];
			};

			export type SlotData = {
				mode: "open" | "linear";
				options: MultiworldOptions;
			};
		}

		interface MultiWorldModel extends ig.GameAddon, sc.Model, ig.Storage.Listener, sc.Model.Observer {
			client: ap.Client;

			baseId: number;
			baseNormalItemId: number;
			dynamicItemAreaOffset: number;
			baseDynamicItemId: number;
			numItems: number;
			// gamepackage: ap.GamePackage;

			questSettings: {
				hidePlayer: boolean;
				hideIcon: boolean;
			};

			status: string;

			disconnectPlanned: boolean;

			lastIndexSeen: number;
			slimLocationInfo: {[idx: number]: sc.MultiWorldModel.LocalInternalItem};
			locationInfo: {[idx: number]: ap.Item};
			connectionInfo: sc.MultiWorldModel.ConnectionInformation;
			localCheckedLocations: Set<number>;
			offlineCheckBuffer: number[];
			mode: string;
			options: sc.MultiWorldModel.MultiworldOptions;
			progressiveChainProgress: Record<number, number>;
			seenChests: Set<number>;

			dataPackageChecksums: Record<string, string>;
			receivedItemMap: Record<number, number>;

			loginMenuMultiworldVars?: sc.MultiWorldModel.MultiworldVars;

			postEditCallback?: Nullable<() => void>;

			createAPItem(this: this, item: sc.MultiWorldModel.LocalInternalItem, locationId: number): ap.Item;
			getItemInfo(this: this, item: ap.Item, nameIsSender?: boolean): ItemInfo;

			getShopLabelsFromItemData(item: ap.Item, forSender?: boolean): sc.ListBoxButton.Data;

			getElementConstantFromComboId(this: this, comboId: number): number | null;
			getItemDataFromComboId(this: this, comboId: number): [itemId: number, quantity: number];

			notifyItemsSent(this: this, items: ap.Item[]): void;
			updateConnectionStatus(this: this, status: sc.MULTIWORLD_CONNECTION_STATUS): void;
			addMultiworldItem(this: this, itemInfo: ap.Item, index: number): void;
			// getLocationInfo(
			// 	this: this,
			// 	mode: ap.CreateAsHintMode,
			// 	locations: number[],
			// 	callback: (info: ap.NetworkItem[]) => void
			// ): void;
			storeAllLocationInfo(this: this): Promise<void>;
			setVars(this: this): void;
			unsetVars(this: this): void;
			reallyCheckLocation(this: this, mwid: number): Promise<void>;
			reallyCheckLocations(this: this, mwids: number[]): Promise<void>;
			login(
				this: this,
				connectionInfo: Optional<sc.MultiWorldModel.AnyConnectionInformation>,
				mw: Optional<sc.MultiWorldModel.MultiworldVars>,
				listener: sc.MultiWorldModel.LoginListener,
			): Promise<void>;
			spawnLoginGui(
				this: this,
				connectionInfo: Optional<sc.MultiWorldModel.AnyConnectionInformation>,
				mw: Optional<sc.MultiWorldModel.MultiworldVars>,
				successCallback: () => void,
				postEditCallback?: () => void,
			): void;
			disconnect(this: this, planned?: boolean): void;
		}

		interface MultiWorldModelConstructor extends ImpactClass<MultiWorldModel> {
			new (): MultiWorldModel;
		}

		var MultiWorldModel: sc.MultiWorldModelConstructor;

		var multiworld: sc.MultiWorldModel;
	}
}
