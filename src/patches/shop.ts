import * as ap from "archipelago.js";
import type MwRandomizer from "../plugin";

declare global {
	namespace sc {
		interface ShopMenu {
			shopList: sc.ShopListMenu;

			onQuantitySubmit(this: this, button: sc.ShopItemButton, quantity: number): void;
		}

		interface ShopListMenu {
			menuGfx: ig.Image;
			shopData: Record<number, number> | undefined;
		}

		interface ShopItemButton {
			apItem: ap.Item | undefined;
			itemId: number | undefined;
			worldGui: sc.TextGui | undefined;
			slot: string | undefined;
			lockedGui: sc.TextGui;
			unlockItem?: number | null;

			showLockedMessage(this: this): void;
		}
	}
}

export function patch(plugin: MwRandomizer) {
	sc.ShopMenu.inject({
		onQuantitySubmit(button: sc.ShopItemButton, quantity: number) {
			if (button.apItem == undefined) {
				return this.parent(button, quantity);
			}

			if (quantity == 0) {
				return this.parent(button, quantity);
			}

			button.setCountNumber(1);
			sc.menu.updateCart(button.itemId!, 1, button.price);
			this.onQuantityBack(button);
			this.cart.setCheckout(true);
			this.shopList.updateListEntries();
		},

		buyItems() {
			this.parent();

			if (this.shopList.shopData == undefined) {
				return false;
			}

			for (const entry of sc.menu.shopCart) {
				let mwid = this.shopList.shopData[entry.id as number];
				if (
					mwid == undefined ||
					sc.multiworld.locationInfo[mwid] == undefined || 
					sc.multiworld.localCheckedLocations.has(mwid)
				) {
					continue;
				}

				sc.model.player.removeItem(entry.id, entry.amount, true);
				sc.multiworld.reallyCheckLocation(mwid);
			}
			return false;
		},
	});

	sc.ShopListMenu.inject({
		menuGfx: new ig.Image("media/gui/menu.png"),

		init() {
			this.parent();
			this.buttongroup?.addPressCallback((rawButton) => {
				let button = rawButton as unknown as sc.ShopItemButton;
				if (!button.active) {
					button.showLockedMessage();
				}
			});
		},

		scrapBuyList(shopItems) {
			this.parent(shopItems);
			const shopID = sc.menu.shopID;
			if (shopID == undefined || sc.randoData.shops == undefined) {
				return;
			}

			this.shopData = sc.multiworld.options.shopSendMode == "itemType" ?
				sc.randoData.shops.locations.perItemType :
				sc.randoData.shops.locations.perShop[shopID];

			if (this.shopData == undefined) {
				return;
			}

			const toHint = [];

			let accum = 0;
			for (const entry of this.list.getChildren()) {
				const gui = entry.gui as unknown as sc.ShopItemButton;
				gui.hook.pos.y += accum;

				const itemId: number = gui.data.id as number;
				const mwid: number = this.shopData[itemId];

				if (sc.multiworld.localCheckedLocations.has(mwid)) {
					continue;
				}

				const button: sc.ButtonGui = gui.button;

				const item = sc.multiworld.locationInfo[mwid];
				if (item == undefined) {
					continue;
				}

				button.removeChildGui(button.textChild);

				const itemInfo = sc.multiworld.getItemInfo(item);

				gui.apItem = item;
				gui.slot = itemInfo.player;
				gui.itemId = itemId;

				const marqueeGui = new sc.ItemMarqueeGui(
					itemInfo.icon,
					itemInfo.label,
					button.hook.size.x - 10,
					{ autoScroll: false, holdOnReset: false }
				);

				if (item.progression) {
					toHint.push(mwid);
				}

				if (itemInfo.level > 0) {
					marqueeGui.iconGui.setDrawCallback((width: number, height: number) => {
						sc.MenuHelper.drawLevel(
							itemInfo.level,
							width,
							height,
							this.menuGfx,
							itemInfo.isScalable
						);
					});
				}

				button.textChild = marqueeGui;
				button.text = itemInfo.label;
				button.textChild.hook.pos.x = 5;
				button.addChildGui(button.textChild);

				gui.lockedGui = new sc.TextGui("\\i[ap-locked]");
				gui.lockedGui.hook.align.x = ig.GUI_ALIGN.X_RIGHT;
				gui.lockedGui.setPos(28, 1);
				gui.addChildGui(gui.lockedGui);

				const worldGui = new sc.TextGui(itemInfo.player, { "font": sc.fontsystem.tinyFont });
				worldGui.hook.pos.x = 22;
				worldGui.hook.pos.y = button.hook.size.y;
				accum += worldGui.hook.size.y;

				gui.hook.size.y += 8;

				gui.worldGui = worldGui;
				button.addChildGui(worldGui);
			}

			if (
				sc.multiworld.options.questDialogHints &&
				sc.multiworld.options.shopDialogHints &&
				toHint.length > 0 &&
				sc.multiworld.client.authenticated
			) {
				// @ts-ignore
				sc.multiworld.client.scout(toHint, 2);
			}

			this.list.list.contentPane.hook.size.y += accum;
			this.list.list.recalculateScrollBars();

			this.updateListEntries();
		},

		updateListEntries(resetCounters: boolean | undefined | null) {
			this.parent(resetCounters);

			let coinBalance = sc.menu.shopCoinMode ? sc.arena.getTotalArenaCoins() : sc.model.player.credit;

			const shopID = sc.menu.shopID!;

			if (this.shopData == undefined) {
				return;
			}

			for (const entry of this.list.getChildren()) {
				const gui = entry.gui as unknown as sc.ShopItemButton;

				if (gui.apItem) { 
					const owned = sc.multiworld.localCheckedLocations.has(this.shopData[gui.itemId!]);
					gui.data = sc.multiworld.getShopLabelsFromItemData(gui.apItem!);
					gui.owned.setNumber(
						owned ? 1 : 0,
						true
					);

					if (owned) {
						gui.setActive(false);
						continue;
					} else {
						gui.setActive(coinBalance - sc.menu.getTotalCost() >= gui.price);
					}
				}

				if (gui.itemId != undefined) {
					let unlockItem: number | null = null;
					if (sc.multiworld.options.shopReceiveMode == "itemType") {
						unlockItem = sc.randoData.shops.unlocks.byId[gui.itemId];
					} else if (sc.multiworld.options.shopReceiveMode == "shop") {
						unlockItem = sc.randoData.shops.unlocks.byShop[shopID];
					} else if (sc.multiworld.options.shopReceiveMode == "slot") {
						unlockItem = sc.randoData.shops.unlocks.byShopAndId[shopID][gui.itemId];
					}

					gui.unlockItem = unlockItem;

					if (unlockItem != null) {
						let hasUnlockItem = sc.multiworld.receivedItemMap[unlockItem] != undefined;
						if (hasUnlockItem) {
							gui.lockedGui.setText("");
						}
						gui.setActive(gui.active && hasUnlockItem);
					}
				}
			}
		},

		changeCount(direction: 1 | -1) {
			const gui = this.getActiveElement();

			if (!gui) {
				return this.parent(direction);
			}

			if (gui.itemId == undefined) {
				return this.parent(direction);
			}

			if (!gui.active) {
				gui.showLockedMessage();
				return;
			}

			const quantity = sc.menu.getItemQuantity(gui.itemId, gui.price);
			if ((quantity == 0 && direction == 1) || (quantity == 1 && direction == -1)) {
				this.playSound(direction, true);
				sc.menu.updateCart(gui.itemId, quantity + direction, gui.price);
				gui.setCountNumber(quantity + direction, quantity == 0);
				this.updateListEntries();
			}
		}
	});

	sc.ShopItemButton.inject({
		focusGained() {
			this.parent();
			this.button.textChild.labelGui?.activate();

			if (this.worldGui != undefined && this.slot != undefined) {
				this.worldGui.setText(`\\C[orange]${this.slot}`);
			}
		},

		focusLost() {
			this.parent();
			this.button.textChild.labelGui?.deactivate();
			this.button.textChild.labelGui?.reset();

			if (this.worldGui != undefined && this.slot != undefined) {
				this.worldGui.setText(this.slot);
			}
		},

		showLockedMessage() {
			if (this.unlockItem != null && sc.multiworld.receivedItemMap[this.unlockItem] == undefined) {
				let itemName = sc.multiworld.client.package.lookupItemName(sc.multiworld.client.game, this.unlockItem, true);
				sc.menu.setInfoText(`Collect \\c[3]${itemName}\\c[0] to unlock this slot.`);
				sc.menu.setBuffText("");
			}
		}
	});
}
