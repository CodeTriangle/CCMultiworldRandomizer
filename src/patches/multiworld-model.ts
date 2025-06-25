import { defineVarProperty } from "../utils";
import { saveDataPackage, loadDataPackage } from "../package-utils";
import * as ap from "archipelago.js";
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
			CONNECTED: "CONNECTED" as sc.MULTIWORLD_CONNECTION_STATUS.CONNECTED,
			CONNECTING: "CONNECTING" as sc.MULTIWORLD_CONNECTION_STATUS.CONNECTING,
			DISCONNECTED: "DISCONNECTED" as sc.MULTIWORLD_CONNECTION_STATUS.DISCONNECTED,
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
				this.client = new ap.Client({autoFetchDataPackage: false, debugLogVersions: true});
				ig.storage.register(this);
				this.numItems = 676;

				this.disconnectPlanned = false;

				this.status = sc.MULTIWORLD_CONNECTION_STATUS.DISCONNECTED;

				sc.Model.addObserver(sc.model, this);

				// defineVarProperty(this, "connectionInfo", "mw.connectionInfo");
				defineVarProperty(this, "lastIndexSeen", "mw.lastIndexSeen");
				// defineVarProperty(this, "slimLocationInfo", "mw.locationInfo");
				// defineVarProperty(this, "localCheckedLocations", "mw.checkedLocations");
				// defineVarProperty(this, "mode", "mw.mode");
				// defineVarProperty(this, "options", "mw.options");
				defineVarProperty(this, "progressiveChainProgress", "mw.progressiveChainProgress");
				defineVarProperty(this, "receivedItemMap", "mw.received");
				defineVarProperty(this, "offlineCheckBuffer", "mw.offlineCheckBuffer");

				this.client.items.on("itemsReceived", (items: ap.Item[], index: number) => {
					if (!ig.game.mapName || ig.game.mapName == "newgame" || !this.receivedItemMap) {
						return;
					}

					for (const [offset, item] of items.entries()) {
						this.addMultiworldItem(item, index + offset);
					}
				});

				this.client.messages.on("message", (text, nodes) => {
					sc.Model.notifyObserver(this, sc.MULTIWORLD_MSG.PRINT_JSON, nodes);
				});

				this.client.socket.on("disconnected", () => {
					this.updateConnectionStatus(sc.MULTIWORLD_CONNECTION_STATUS.DISCONNECTED);

					if (!this.disconnectPlanned) {
						sc.Dialogs.showYesNoDialog(
							ig.lang.get("sc.gui.mw.warnings.unplanned-disconnect"),
							sc.DIALOG_INFO_ICON.WARNING,
							(button) => {
								if (button.data == 0) {
									this.spawnLoginGui(this.connectionInfo, ig.vars.get("mw"), () => {});
								}
							}
						);
					}

					this.disconnectPlanned = false;
				});

				this.client.room.on("locationsChecked", locations => {
					if (this.client.authenticated) {
						for (const location of locations) {
							this.localCheckedLocations.add(location);
						}
					}
				});
			},

			modelChanged(model, message, data) {
				if (
					model == sc.model &&
					message == sc.GAME_MODEL_MSG.STATE_CHANGED &&
					sc.model.currentState == sc.GAME_MODEL_STATE.TITLE
				) {
					this.disconnect();
					this.unsetVars();
				}
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

			getItemInfo(item, nameIsSender): ItemInfo {
				let gameName: string = item.receiver.name;
				let label = item.name;
				let player = nameIsSender ? item.sender.alias : item.receiver.alias;

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

			getShopLabelsFromItemData(item: ap.Item, forSender?: boolean): sc.ListBoxButton.Data {
				forSender = forSender ?? false;

				let rarityString = "Looks like junk...";

				if (item.useful) {
					rarityString = "\\c[2]Looks helpful\\c[0].";
				} else if (item.progression) {
					rarityString = "\\c[3]Looks important\\c[0]!";
				} else if (item.trap) {
					rarityString = "\\c[1]Looks dangerous\\c[0].";
				}

				let game = (forSender ? item.sender : item.receiver).game;

				if (game == "CrossCode") {
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

			notifyItemsSent(items: ap.Item[]) {
				for (const item of items) {
					if (item.receiver.slot == this.client.players.self.slot) {
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

			async storeAllLocationInfo() {
				let toScout: number[] = this.client.room.allLocations;

				if (this.slimLocationInfo) {
					this.locationInfo = {};
					for (const [mwid, internalItem] of Object.entries(this.slimLocationInfo)) {
						this.locationInfo[Number(mwid)] = this.createAPItem(internalItem, Number(mwid));
					}
					return;
				} else {
					this.slimLocationInfo = {};
					this.locationInfo = {};
					return this.client.scout(toScout)
						.then((items: ap.Item[]) => {
							for (const item of items) {
								let mwid: number = item.locationId;
								this.locationInfo[mwid] = item;
								this.slimLocationInfo[mwid] = {
									item: item.id,
									player: item.receiver.slot,
									flags: item.flags,
								};
							};
						});
				}
			},

			setVars() {
				if (this.lastIndexSeen == null) {
					this.lastIndexSeen = -1;
				}

				if (!this.progressiveChainProgress) {
					this.progressiveChainProgress = {};
				}

				if (!this.receivedItemMap) {
					this.receivedItemMap = {};
				}

				if (!this.questSettings) {
					const obfuscationLevel = this.options.hiddenQuestObfuscationLevel;

					this.questSettings = {
						hidePlayer: obfuscationLevel == "hide_text" || obfuscationLevel == "hide_all",
						hideIcon: obfuscationLevel == "hide_all"
					};
				}

				if (!this.offlineCheckBuffer) {
					this.offlineCheckBuffer = [];
				}

				if (!this.seenChests) {
					this.seenChests = new Set();
				}

				if (ig.game.mapName == "newgame") {
					return;
				}

				ig.vars.setDefault("mw.mode", this.mode);
				ig.vars.setDefault("mw.options", this.options);
				ig.vars.setDefault("mw.dataPackageChecksums", this.dataPackageChecksums);
				ig.vars.set("mw.connectionInfo", this.connectionInfo);

				for (let i = this.lastIndexSeen + 1; i < this.client.items.received.length; i++) {
					let item = this.client.items.received[i];
					this.addMultiworldItem(item, i);
				}

				let area = ig.game.mapName.split(".")[0];

				if (this.client.authenticated) {
					if (this.offlineCheckBuffer.length > 0) {
						this.client.check(...this.offlineCheckBuffer);
						this.offlineCheckBuffer = [];
					}

					this.client.storage.prepare("area", "rookie-harbor")
						.replace(area)
						.commit(false);
				}
			},

			unsetVars() {
				// Lots of errors here, sorry

				// Unset all variables that aren't bound to properties already
				this.slimLocationInfo = null as any;
				this.locationInfo = null as any;
				this.connectionInfo = null as any;
				this.mode = null as any;
				this.options = null as any;

				this.dataPackageChecksums = null as any;

				this.questSettings = null as any;
				this.receivedItemMap = null as any;
				this.offlineCheckBuffer = null as any;
				this.seenChests = null as any;
			},

			onLevelLoadStart() {
				this.setVars();
			},

			onStorageSave(savefile) {
				savefile.vars.storage.mw.localCheckedLocations = Array.from(this.localCheckedLocations.values());
				savefile.vars.storage.mw.seenChests = Array.from(this.seenChests.values());
			},

			async reallyCheckLocation(mwid: number) {
				if (this.client.authenticated) {
					this.client.check(mwid);
				} else {
					this.offlineCheckBuffer.push(mwid);
				}

				let loc = this.locationInfo[mwid];
				sc.multiworld.notifyItemsSent([loc]);

				this.localCheckedLocations.add(mwid);
			},

			async reallyCheckLocations(mwids: number[]) {
				for (const mwid of mwids) {
					this.reallyCheckLocation(mwid);
				}
			},

			async login(info, mw, listener) {
				const fatalError = (message: string) => {
					listener.onLoginError(message);
					this.updateConnectionStatus(sc.MULTIWORLD_CONNECTION_STATUS.DISCONNECTED);
				}

				this.updateConnectionStatus(sc.MULTIWORLD_CONNECTION_STATUS.CONNECTING);
				// if no connectionInfo is specified, assume we need to deduce it from the save slot
				if (!info) {
					info = mw?.connectionInfo;
					if (!info) {
						// if info is not defined, assume that the data is malformed. report error and return
						fatalError("No connection information or slot provided.");
						return;
					}
				}

				if (info.hasOwnProperty("hostname")) {
					listener.onLoginProgress("Migrating save file.");

					// the "hostname" property is part of the deprecated format so we use it as an indicator
					let legacyInfo = info as sc.MultiWorldModel.LegacyConnectionInformation;

					info = {
						url: `${legacyInfo.hostname}:${legacyInfo.port}`,
						name: legacyInfo.name,
						password: legacyInfo.password ?? "",
					};
				}

				info = info as sc.MultiWorldModel.ConnectionInformation;

				// start loading known data packages in the background
				// this may constitute wasted effort if connection fails for other reasons
				let dataPackagePromise = loadDataPackage(mw?.dataPackageChecksums ?? {});

				// listen for room info for data package fetching purposes
				let roomInfoPromise = this.client.socket.wait("roomInfo");

				let slotData: sc.MultiWorldModel.SlotData;

				// actually try the connection
				try {
					listener.onLoginProgress(`Connecting to ${info.url}.`);
					slotData = await this.client.login<sc.MultiWorldModel.SlotData>(
						info.url,
						info.name,
						"CrossCode",
						{
							items: ap.API.itemsHandlingFlags.all,
							password: info.password,
						}
					);

					listener.onLoginProgress("Checking local game package cache.");

					// okay, if we actually successfully connected, we should have the roomInfo packet
					// also, if we had any data packages cached, those should be available now
					// in either case, we'll need all of that information for the next phase
					// possibly the room info promise idles forever but there's no way that happens, right?
					let [gamePackages, roomInfo] = await Promise.all([dataPackagePromise, roomInfoPromise]);
					let remoteChecksums = roomInfo[0].datapackage_checksums;
					this.dataPackageChecksums = remoteChecksums;

					// list of expected checksums, loaded from save file
					// return empty object instead of undefined if slot is null or dataPackage doesn't exist
					let checksums: Optional<Record<string, string>> = mw?.dataPackageChecksums;

					if (checksums != undefined && !ig.equal(checksums, remoteChecksums)) {
						fatalError("Some game checksums do not match.");
						return;
					}

					listener.onLoginProgress("Downloading remaining game packages.");

					// filter out nulls, but tsserver doesn't understand what i'm doing
					// @ts-ignore
					this.client.package.importPackage({ games: gamePackages })

					// now, get the rest of the game packages from the server
					// no effort is wasted because ap.js filters out redundant work
					await this.client.package.fetchPackage();

					saveDataPackage(this.client.package.exportPackage());
				} catch (e: any) {
					fatalError(e.message);
					return;
				}

				// if we got through all of that, then we are officially connected

				this.mode = slotData.mode;
				this.options = slotData.options;
				this.connectionInfo = info;

				// workaround for cc-open-world to use
				ig.vars.setDefault("mw.mode", this.mode);
				ig.vars.setDefault("mw.options", this.options);

				if (mw?.locationInfo) {
					this.slimLocationInfo = mw?.locationInfo;
				}

				await this.storeAllLocationInfo();

				sc.Model.notifyObserver(this, sc.MULTIWORLD_MSG.OPTIONS_PRESENT, this.options);

				this.localCheckedLocations = new Set(mw?.checkedLocations);

				for (const location of this.client.room.checkedLocations) {
					this.localCheckedLocations.add(location);
				}

				this.seenChests = new Set(mw?.seenChests);

				// if we're in game, then run the level loading code
				// these functions are intended to complement each other but when login() is called from the title screen,
				// it needs to wait to be in game before everything can initialize.
				// but we can also work with this.
				if (sc.model.isGame()) {
					this.setVars();
				}

				this.updateConnectionStatus(sc.MULTIWORLD_CONNECTION_STATUS.CONNECTED);
				listener.onLoginSuccess(`Connected to ${info.url}.`);
			},

			spawnLoginGui(connectionInfo, mw, successCallback, postEditCallback) {
				let listenerGui = new sc.MultiworldLoginListenerGui(successCallback, postEditCallback);
				ig.gui.addGuiElement(listenerGui);
				listenerGui.show();
				listenerGui.startLogin(connectionInfo, mw);
			},

			disconnect(planned) {
				this.disconnectPlanned = planned ?? true;
				this.client.socket.disconnect();
			}
		});

		ig.addGameAddon(() => {
			return (sc.multiworld = new sc.MultiWorldModel());
		});
}
