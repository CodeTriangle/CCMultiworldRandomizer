import { defineVarProperty } from "../utils";
import { loadDataPackage } from "../package-utils";
import * as ap from "archipelago.js";
import { MultiworldOptions } from "../types/multiworld-model";
import MwRandomizer from "../plugin";
import { ItemInfo } from "../item-data.model";

export function patch(plugin: MwRandomizer) {
		sc.MULTIWORLD_MSG = {
			CONNECTION_STATUS_CHANGED: 0,
			ITEM_SENT: 1,
			ITEM_RECEIVED: 2,
			OPTIONS_PRESENT: 3,
			PRINT_JSON: 4,
		};

		sc.MULTIWORLD_CONNECTION_STATUS = {
			CONNECTED: "connected",
			CONNECTING: "connecting",
			DISCONNECTED: "disconnected",
		};

		sc.MultiWorldModel = ig.GameAddon.extend({
			observers: [],
			client: null,

			baseId: 3235824000,
			baseNormalItemId: 3235824100,
			dynamicItemAreaOffset: 100000,
			baseDynamicItemId: 3235924000,
			numItems: 0,

			init() {
				this.client = new ap.Client({autoFetchDataPackage: false});
				ig.storage.register(this);
				this.numItems = 676;

				this.status = sc.MULTIWORLD_CONNECTION_STATUS.DISCONNECTED;

				defineVarProperty(this, "connectionInfo", "mw.connectionInfo");
				defineVarProperty(this, "lastIndexSeen", "mw.lastIndexSeen");
				defineVarProperty(this, "slimLocationInfo", "mw.locationInfo");
				defineVarProperty(this, "localCheckedLocations", "mw.checkedLocations");
				defineVarProperty(this, "mode", "mw.mode");
				defineVarProperty(this, "options", "mw.options");
				defineVarProperty(this, "progressiveChainProgress", "mw.progressiveChainProgress");
				defineVarProperty(this, "receivedItemMap", "mw.received");

				this.client.items.on("itemsReceived", (items: ap.Item[], index: number) => {
					if (!ig.game.mapName || ig.game.mapName == "newgame") {
						return;
					}

					for (const [offset, item] of items.entries()) {
						this.addMultiworldItem(item, index + offset);
					}
				});

				this.client.messages.on("message", (text, nodes) => {
					sc.Model.notifyObserver(this, sc.MULTIWORLD_MSG.PRINT_JSON, nodes);
				});
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

			createAPItem(item: sc.MultiWorldModel.LocalInternalItem, locationId: number): ap.Item {
				let networkItem: ap.NetworkItem = {...item, location: locationId};

				return new ap.Item(
					this.client,
					networkItem,
					this.client.players.self,
					this.client.players.findPlayer(networkItem.player)!
				);
			},

			getItemInfo(item: ap.Item): ItemInfo {
				let gameName: string = item.receiver.name;
				let label = item.name;
				let player = item.receiver.alias;

				if (gameName == "CrossCode") {
					const comboId: number = item.id;
					let level = 0;
					let icon = "item-default";
					let isScalable = false;
					if (comboId >= sc.multiworld.baseNormalItemId && comboId < sc.multiworld.baseDynamicItemId) {
						const [itemId, _] = sc.multiworld.getItemDataFromComboId(item.id);
						const dbEntry = sc.inventory.getItem(itemId);
						if (dbEntry) {
							icon = dbEntry.icon + sc.inventory.getRaritySuffix(dbEntry.rarity);
							isScalable = dbEntry.isScalable || false;
							if (dbEntry.type == sc.ITEMS_TYPES.EQUIP) {
								level = dbEntry.level;
							}
						}
					}

					return {icon, label, player, level, isScalable};
				}

				let cls = "unknown";
				if (item.progression) {
					cls = "prog";
				} else if (item.useful) {
					cls = "useful";
				} else if (item.trap) {
					cls = "trap";
				} else if (item.filler) {
					cls = "filler";
				}

				let icon = `ap-item-${cls}`;
				return {icon, label, player, level: 0, isScalable: false};
			},

			getShopLabelsFromItemData(item: ap.Item): sc.ListBoxButton.Data {
				let rarityString = "Looks like junk...";

				if (item.useful) {
					rarityString = "\\c[2]Looks helpful\\c[0].";
				} else if (item.progression) {
					rarityString = "\\c[3]Looks important\\c[0]!";
				} else if (item.trap) {
					rarityString = "\\c[1]Looks dangerous\\c[0].";
				}

				if (item.sender.game == "CrossCode") {
					if (item.id >= sc.multiworld.baseNormalItemId && item.id < sc.multiworld.baseDynamicItemId) {
						const [internalItem, internalQty] =  sc.multiworld.getItemDataFromComboId(item.id);
						const internalData = sc.inventory.getItem(internalItem);
						if (internalData != undefined) {
							return {
								id: internalItem,
								description: ig.LangLabel.getText(internalData.description),
							};
						}
					}

					if (sc.randoData.descriptions[item.id] != undefined) {
						return {
							id: 0,
							description: ig.LangLabel.getText(sc.randoData.descriptions[item.id]),
						}
					}

					return {
						id: 0,
						description: "An unknown CrossCode item. " + rarityString,
					};
				} 

				return {
					id: 0,
					description: "An item for another world. " + rarityString,
				};
			},

			getItemDataFromComboId(comboId: number): [itemId: number, quantity: number] {
				if (this.numItems == 0) {
					throw "Can't fetch item data before item database is loaded";
				}

				comboId -= this.baseNormalItemId;
				return [comboId % this.numItems, (comboId / this.numItems + 1) | 0];
			},

			onStoragePostLoad() {
				if (this.client.authenticated) {
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

				if (!this.progressiveChainProgress) {
					this.progressiveChainProgress = {};
				}

				if (!this.receivedItemMap) {
					this.receivedItemMap = {};
				}

				if (sc.model.isTitle() || ig.game.mapName == "newgame") {
					return;
				}

				for (let i = this.lastIndexSeen + 1; i < this.client.items.received.length; i++) {
					let item = this.client.items.received[i];
					this.addMultiworldItem(item, i);
				}

				let area = ig.game.mapName.split(".")[0];

				if (this.client.authenticated) {
					this.client.storage.prepare("area", "rookie-harbor")
						.replace(area)
						.commit(false);
				}
			},

			notifyItemsSent(items: ap.Item[]) {
				for (const item of items) {
					if (item.sender.slot == this.client.players.self.slot) {
						continue;
					}
					sc.Model.notifyObserver(this, sc.MULTIWORLD_MSG.ITEM_SENT, item);
				}
			},

			updateConnectionStatus(status) {
				this.status = status;
				sc.Model.notifyObserver(this, sc.MULTIWORLD_MSG.CONNECTION_STATUS_CHANGED, status);
			},

			addMultiworldItem(item: ap.Item, index: number): void {
				if (index <= this.lastIndexSeen) {
					return;
				}

				const foreign = item.sender.slot != this.client.players.self.slot;

				let displayMessage = foreign || item.id < this.baseNormalItemId;

				if (this.receivedItemMap[item.id]) {
					this.receivedItemMap[item.id] += 1;
				} else {
					this.receivedItemMap[item.id] = 1;
				}

				if (item.id < this.baseId + 4) {
					if (!sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_CHANGE)) {
						sc.model.player.setCore(sc.PLAYER_CORE.ELEMENT_CHANGE, true);
						sc.model.player.setCore(sc.PLAYER_CORE.ELEMENT_HEAT, false);
						sc.model.player.setCore(sc.PLAYER_CORE.ELEMENT_COLD, false);
						sc.model.player.setCore(sc.PLAYER_CORE.ELEMENT_WAVE, false);
						sc.model.player.setCore(sc.PLAYER_CORE.ELEMENT_SHOCK, false);
					}
					let elementConstant = this.getElementConstantFromComboId(item.id);
					if (elementConstant != null) {
						sc.model.player.setCore(elementConstant, true);
					}
				} else if (this.options.progressiveChains[item.id]) {
					if (!this.progressiveChainProgress[item.id]) {
						this.progressiveChainProgress[item.id] = 0;
					}
					const chain = this.options.progressiveChains[item.id];
					const itemIdToGive = chain[this.progressiveChainProgress[item.id]++];
					if (itemIdToGive != undefined) {
						// clone the item, replacing the item field with the new id
						const copiedItem = new ap.Item(
							this.client,
							{
								flags: item.flags,
								item: itemIdToGive,
								location: item.locationId,
								player: item.sender.slot,
							},
							item.sender,
							item.receiver,
						);

						this.addMultiworldItem(copiedItem, index);
					}

					displayMessage = false;
				} else if (item.id < this.baseNormalItemId) {
					switch (item.name) {
						case "SP Upgrade":
							sc.model.player.setSpLevel(Number(sc.model.player.spLevel) + 1);
							sc.party.currentParty.forEach((name: string) => {
								sc.party.getPartyMemberModel(name).setSpLevel(sc.model.player.spLevel);
							});

							break;
					}
				} else if (item.id < this.baseDynamicItemId) {
					let [itemId, quantity] = this.getItemDataFromComboId(item.id);
					if (this.options.keyrings && this.options.keyrings.includes(itemId)) {
						quantity = 99;
					}
					sc.model.player.addItem(Number(itemId), quantity, foreign);
				} else {
					displayMessage = true;
				}

				if (displayMessage) {
					sc.Model.notifyObserver(this, sc.MULTIWORLD_MSG.ITEM_RECEIVED, item);
				}

				this.lastIndexSeen = index;
			},

			// getLocationInfo(mode: ap.CreateAsHintMode, locations: number[], callback: (info: ap.NetworkItem[]) => void) {
			// 	let listener = (packet: ap.LocationInfoPacket) => {
			// 		let matches = true;
			// 		for (let i = 0; i < locations.length; i++) {
			// 			if (packet.locations[i].location != locations[i]) {
			// 				matches = false;
			// 				break;
			// 			}
			// 		}

			// 		if (!matches) {
			// 			return;
			// 		}

			// 		this.client.removeListener("LocationInfo", listener);

			// 		callback(packet.locations);
			// 	};

			// 	this.client.addListener('LocationInfo', listener);

			// 	// The following function's definition is broken, so I ignore the error.
			// 	// @ts-ignore
			// 	this.client.locations.scout(mode, ...locations);
			// },

			async storeAllLocationInfo() {
				// In case the file was loaded on a previous version, we need to add the checked locations too.
				// This might be able to go away once there is version checking.
				let toScout: number[] = this.client.room.missingLocations
					.concat(this.client.room.checkedLocations);

				if (!this.locationInfo) {
					this.locationInfo = {};
				} else {
					toScout = toScout.filter((mwid: number) => !this.locationInfo.hasOwnProperty(mwid));

					if (toScout.length >= 1) {
						console.warn(`Need to scout following locations:\n${toScout.join('\n')}`);
					}
				}

				this.client.scout(toScout)
					.then((items: ap.Item[]) => {
						for (const item of items) {
							let mwid: number = item.locationId;
							this.slimLocationInfo[mwid] = {
								item: item.id,
								player: item.sender.slot,
								flags: item.flags,
							};
						};
					});
			},

			async reallyCheckLocation(mwid: number) {
				this.client.check(mwid);

				let loc = this.locationInfo[mwid];
				if (loc == undefined) {
					this.client.scout([mwid])
						.then(this.notifyItemsSent.bind(this));
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

			async login(info, slot, listener) {
				if (slot && slot.data.vars.storage.mw == undefined) {
					listener.onLoginError("Refusing to load slot with no previous Archipelago save data.");
					return;
				}

				// if no connectionInfo is specified, assume we need to deduce it from the save slot
				if (!info) {
					let tmpInfo = slot?.data.vars.storage.mw.connectionInfo;
					if (tmpInfo && tmpInfo.hasOwnProperty("hostname")) {
						listener.onLoginProgress("Migrating save file.");

						// the "hostname" property is part of the deprecated format so we use it as an indicator
						let legacyInfo: sc.MultiWorldModel.LegacyConnectionInformation = tmpInfo;
						info = {
							url: `${legacyInfo.hostname}:${legacyInfo.port}`,
							name: legacyInfo.name,
							options: {
								items: ap.itemsHandlingFlags.all,
							}
						};
					} else if (info) {
						// if info is defined but does not have "hostname" we assume that it is in the current format
						info = tmpInfo;
						listener.onLoginProgress("Using cached connection info.");
					} else {
						// if info is not defined, assume that the data is malformed. report error and return
						listener.onLoginError("No connection information or slot provided.");
						return;
					}
				}

				info = info!;

				// list of expected checksums, loaded from save file
				// return empty object instead of undefined if slot is null or dataPackage doesn't exist
				let checksums: Record<string, string> = slot?.data.vars.storage.mw.dataPackageChecksums ?? {};

				// start loading known data packages in the background
				// this may constitute wasted effort if connection fails for other reasons
				let dataPackagePromise = loadDataPackage(checksums);

				// listen for room info for data package fetching purposes
				let roomInfoPromise = this.client.socket.wait("roomInfo");

				// actually try the connection
				try {
					listener.onLoginProgress("Connecting to server.");
					let slotData = await this.client.login<MultiworldOptions>(info.url, info.name, "CrossCode", info.options);
					this.mode =  slotData.mode;
					this.options = slotData.options;

					listener.onLoginProgress("Checking local game package cache.");

					// okay, if we actually successfully connected, we should have the roomInfo packet
					// also, if we had any data packages cached, those should be available now
					// in either case, we'll need all of that information for the next phase
					// possibly the room info promise idles forever but there's no way that happens, right?
					let [gamePackages, roomInfo] = await Promise.all([dataPackagePromise, roomInfoPromise]);
					let remoteChecksums = roomInfo[0].datapackage_checksums;

					if (!ig.equal(checksums, remoteChecksums)) {
						listener.onLoginError("Some game checksums do not match.");
						return;
					}

					listener.onLoginProgress("Downloading remaining game packages.");

					// filter out nulls, but tsserver doesn't understand what i'm doing
					// @ts-ignore
					this.client.package.importPackage({ games: gamePackages.filter(pkg => pkg != null) })

					// now, get the rest of the game packages from the server
					// no effort is wasted because ap.js filters out redundant work
					this.client.package.fetchPackage();
				} catch (e: any) {
					console.error(e);
					listener.onLoginError(e.message);
					return;
				}

				// if we got through all of that, then we are officially connected

				this.connectionInfo = info;

				const obfuscationLevel = this.options.hiddenQuestObfuscationLevel;

				this.questSettings = {
					hidePlayer: obfuscationLevel == "hide_text" || obfuscationLevel == "hide_all",
					hideIcon: obfuscationLevel == "hide_all"
				};

				sc.multiworld.onLevelLoaded();

				sc.Model.notifyObserver(sc.multiworld, sc.MULTIWORLD_MSG.OPTIONS_PRESENT);

				this.storeAllLocationInfo();

				let checkedSet = new Set(this.client.room.checkedLocations);

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
}
