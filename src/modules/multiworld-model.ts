import { defineVarProperty } from "../utils";
import * as ap from "archipelago.js";
import {ig, sc} from "ultimate-crosscode-typedefs";

ig.module("mw-rando.multiworld-model")
	.requires("impact.feature.storage.storage")
	.defines(() => {

		sc.MULTIWORLD_MSG = {
			CONNECTION_STATUS_CHANGED: 0,
			ITEM_SENT: 1,
			ITEM_RECEIVED: 2,
			OPTIONS_PRESENT: 3,
		};

		sc.MultiWorldModel = ig.GameAddon.extend({
			observers: [],
			client: null,
			previousConnectionStatus: ap.CONNECTION_STATUS.DISCONNECTED,

			baseId: 3235824000,
			baseNormalItemId: 3235824100,
			numItems: 0,

			init() {
				this.client = new ap.Client();
				ig.storage.register(this);
				this.numItems = 676;

				defineVarProperty(this, "connectionInfo", "mw.connectionInfo");
				defineVarProperty(this, "lastIndexSeen", "mw.lastIndexSeen");
				defineVarProperty(this, "locationInfo", "mw.locationInfo");
				defineVarProperty(this, "localCheckedLocations", "mw.checkedLocations");
				defineVarProperty(this, "mode", "mw.mode");
				defineVarProperty(this, "options", "mw.options");

				window.setInterval(this.updateConnectionStatus.bind(this), 300);
			},

			getElementConstantFromComboId(comboId: number): number | null {
				switch (comboId) {
					case this.baseId:
						return sc.PLAYER_CORE.ELEMENT_HEAT;
					case this.baseId + 1:
						return sc.PLAYER_CORE.ELEMENT_COLD;
					case this.baseId + 2:
						return sc.PLAYER_CORE.ELEMENT_SHOCK;
					case this.baseId + 3:
						return sc.PLAYER_CORE.ELEMENT_WAVE;
					default:
						return null;
				}
			},

			getItemDataFromComboId(comboId: number): [itemId: number, quantity: number] {
				if (this.numItems == 0) {
					throw "Can't fetch item data before item database is loaded";
				}

				comboId -= this.baseNormalItemId;
				return [comboId % this.numItems, (comboId / this.numItems + 1) | 0];
			},

			onStoragePostLoad() {
				if (this.client.status != "Connected") {
					if (this.connectionInfo) {
						console.log("Reading connection info from save file");
						this.login(this.connectionInfo);
					} else {
						sc.Dialogs.showInfoDialog(
							"This save file has no Archipelago connection associated with it. " +
								"To play online, open the pause menu and enter the details.",
							true,
						);
					}
				}
			},

			onLevelLoaded() {
				if (this.lastIndexSeen == null) {
					this.lastIndexSeen = -1;
				}

				if (!this.localCheckedLocations) {
					this.localCheckedLocations = [];
				}

				if (sc.model.isTitle() || ig.game.mapName == "newgame") {
					return;
				}

				if (this.client.status == ap.CONNECTION_STATUS.CONNECTED) {
					this.client.updateStatus(ap.CLIENT_STATUS.PLAYING);
				}

				for (let i = this.lastIndexSeen + 1; i < this.client.items.received.length; i++) {
					let item = this.client.items.received[i];
					this.addMultiworldItem(item, i);
				}

				let area = ig.game.mapName.split(".")[0];

				new ap.Client().send(
					{
						cmd: "Set",
						key: "area",
						default: "rookie-harbor",
						want_reply: false,
						operations: [
							{
								operation: "replace",
								value: area,
							}
						]
					}
				);
			},

			notifyItemsSent(items: ap.NetworkItem[]) {
				for (const item of items) {
					if (item.player == this.client.data.slot) {
						continue;
					}
					sc.Model.notifyObserver(this, sc.MULTIWORLD_MSG.ITEM_SENT, item);
				}
			},

			updateConnectionStatus() {
				if (this.previousConnectionStatus == this.client.status) {
					return;
				}

				this.previousConnectionStatus = this.client.status;

				sc.Model.notifyObserver(this, sc.MULTIWORLD_MSG.CONNECTION_STATUS_CHANGED, this.client.status);
			},

			addMultiworldItem(itemInfo: ap.NetworkItem, index: number): void {
				if (index <= this.lastIndexSeen) {
					return;
				}

				const foreign = itemInfo.player != this.client.data.slot;

				if (itemInfo.item < this.baseId + 4) {
					if (!sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_CHANGE)) {
						sc.model.player.setCore(sc.PLAYER_CORE.ELEMENT_CHANGE, true);
						sc.model.player.setCore(sc.PLAYER_CORE.ELEMENT_HEAT, false);
						sc.model.player.setCore(sc.PLAYER_CORE.ELEMENT_COLD, false);
						sc.model.player.setCore(sc.PLAYER_CORE.ELEMENT_WAVE, false);
						sc.model.player.setCore(sc.PLAYER_CORE.ELEMENT_SHOCK, false);
					}
					let elementConstant = this.getElementConstantFromComboId(itemInfo.item);
					if (elementConstant != null) {
						sc.model.player.setCore(elementConstant, true);
					}
				} else if (itemInfo.item < this.baseNormalItemId) {
					switch (this.gamepackage.item_id_to_name[itemInfo.item]) {
						case "SP Upgrade":
							sc.model.player.setSpLevel(Number(sc.model.player.spLevel) + 1);
							sc.party.currentParty.forEach((name: string) => {
								sc.party.getPartyMemberModel(name).setSpLevel(sc.model.player.spLevel);
							});

							break;
					}
				} else {
					let [itemId, quantity] = this.getItemDataFromComboId(itemInfo.item);
					if (this.options.keyrings && this.options.keyrings.includes(itemId)) {
						quantity = 99;
					}
					sc.model.player.addItem(Number(itemId), quantity, foreign);
				}

				if (foreign || itemInfo.item < this.baseNormalItemId) {
					sc.Model.notifyObserver(this, sc.MULTIWORLD_MSG.ITEM_RECEIVED, itemInfo);
				}

				this.lastIndexSeen = index;
			},

			getLocationInfo(mode: ap.CreateAsHintMode, locations: number[], callback: (info: ap.NetworkItem[]) => void) {
				let listener = (packet: ap.LocationInfoPacket) => {
					let matches = true;
					for (let i = 0; i < locations.length; i++) {
						if (packet.locations[i].location != locations[i]) {
							matches = false;
							break;
						}
					}

					if (!matches) {
						return;
					}

					this.client.removeListener("LocationInfo", listener);

					callback(packet.locations);
				};

				this.client.addListener('LocationInfo', listener);

				// The following function's definition is broken, so I ignore the error.
				// @ts-ignore
				this.client.locations.scout(mode, ...locations);
			},

			async storeAllLocationInfo() {
				let listener = (packet: ap.LocationInfoPacket) => {
					let locationInfoMap = ig.vars.get("mw.locationInfo");
					packet.locations.forEach((item: any) => {
						let mwid: number = item.location;
						
						// cut down on save file space by not storing unimportant parts
						// item.location is redundant because you'll have the key whenever that's relevant
						// item.class is a string which is the same for every instance
						// together this saves several kilobytes of space in the save data
						delete item.location;
						delete item.class;
						// @ts-ignore
						locationInfoMap[mwid] = item;
					});

					this.client.removeListener("LocationInfo", listener);
				};

				this.client.addListener('LocationInfo', listener);

				// In case the file was loaded on a previous version, we need to add the checked locations too.
				// This might be able to go away once there is version checking.
				let toScout: number[] = this.client.locations.missing
					.concat(this.client.locations.checked);

				if (!this.locationInfo) {
					this.locationInfo = {};
				} else {
					toScout = toScout.filter((mwid: number) => !this.locationInfo.hasOwnProperty(mwid));

					if (toScout.length >= 1) {
						console.warn(`Need to scout following locations:\n${toScout.join('\n')}`);
					}
				}

				this.client.locations.scout(
					ap.CREATE_AS_HINT_MODE.NO_HINT,
					...toScout
				);
			},

			async reallyCheckLocation(mwid: number) {
				this.client.locations.check(mwid);

				let loc = this.locationInfo[mwid];
				if (loc == undefined) {
					this.getLocationInfo(ap.CREATE_AS_HINT_MODE.NO_HINT, [mwid], sc.multiworld.notifyItemsSent.bind(sc.multiworld));
				} else {
					sc.multiworld.notifyItemsSent([loc]);
				}

				if (this.localCheckedLocations.indexOf(mwid) >= 0) {
					return;
				}

				this.localCheckedLocations.push(mwid);
			},

			async reallyCheckLocations(mwids: number[]) {
				for (const mwid of mwids) {
					this.reallyCheckLocation(mwid);
				}
			},

			async login(info: ap.ConnectionInformation) {
				try {
					await this.client.connect(info);
				} catch (e) {
					sc.Dialogs.showErrorDialog(
						"Could not connect to Archipelago server. " +
							"You may still be able to play if you have logged in to this server before, " + 
							"but your progress will not be uploaded until " +
							"you connect to the server.",
						true
					);
					console.error("Could not connect to Archipelago server: ", e);

					return;
				}

				this.gamepackage = this.client.data.package.get("CrossCode")!;

				this.client.addListener('ReceivedItems', (packet: ap.ReceivedItemsPacket) => {
					if (!ig.game.mapName || ig.game.mapName == "newgame") {
						return;
					}
					let index = packet.index;
					for (const [offset, itemInfo] of packet.items.entries()) {
						this.addMultiworldItem(itemInfo, index + offset);
					}
				});

				this.connectionInfo = info;

				// this is always going to be a string
				this.mode = this.client.data.slotData.mode as unknown as string;
				this.options = this.client.data.slotData.options;

				const obfuscationLevel: string = this.options.hiddenQuestObfuscationLevel;

				this.questSettings = {
					hidePlayer: obfuscationLevel == "hide_text" || obfuscationLevel == "hide_all",
					hideIcon: obfuscationLevel == "hide_all"
				};

				sc.multiworld.onLevelLoaded();

				sc.Model.notifyObserver(sc.multiworld, sc.MULTIWORLD_MSG.OPTIONS_PRESENT);

				this.storeAllLocationInfo();

				let checkedSet = new Set(this.client.locations.checked);

				for (const location of this.localCheckedLocations) {
					if (!checkedSet.has(location)) {
						this.reallyCheckLocation(location);
					}
				}
			},
		});

		ig.addGameAddon(() => {
			return (sc.multiworld = new sc.MultiWorldModel());
		});
	});
