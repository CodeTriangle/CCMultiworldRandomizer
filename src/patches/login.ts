import MwRandomizer from "../plugin";

declare global {
	namespace sc {
		interface MultiworldLoginListenerGui extends ig.GuiElementBase, sc.MultiWorldModel.LoginListener {
			msgBox: sc.CenterBoxGui;
			content: ig.GuiElementBase;
			textChild: sc.TextGui; 

			automaticMode: boolean;

			buttonGroup: sc.ButtonGroup;
			buttonInteract: ig.ButtonInteractEntry;

			backButton: sc.ButtonGui;
			loginButton?: sc.ButtonGui;
			editButton?: sc.ButtonGui;
			offlineButton?: sc.ButtonGui;

			connectionInfo: Optional<sc.MultiWorldModel.AnyConnectionInformation>;

			mw: Optional<sc.MultiWorldModel.MultiworldVars>;

			successCallback: () => void;
			postEditCallback: (() => void) | undefined;

			show(this: this): void;
			hide(this: this, success: boolean): void;

			startLogin(
				this: this,
				info: Optional<sc.MultiWorldModel.AnyConnectionInformation>,
				mw: Optional<sc.MultiWorldModel.MultiworldVars>
			): void;

			doLogin(this: this): void;

			onBackButtonPress(this: this): void;
			onEditButtonPress(this: this): void;
			onLoginButtonPress(this: this): void;
			onOfflineButtonPress(this: this): void;
			onConfirmOfflinePlay(this: this): void;
		}

		interface MultiworldLoginListenerGuiConstructor extends ImpactClass<MultiworldLoginListenerGui> {
			new(
				successCallback: () => void,
				postEditCallback?: () => void,
			): MultiworldLoginListenerGui;
		}

		var MultiworldLoginListenerGui: MultiworldLoginListenerGuiConstructor;
	}
}

export function patch(plugin: MwRandomizer) {
	sc.MultiworldLoginListenerGui = ig.GuiElementBase.extend({
		transitions: {
			DEFAULT: {
				state: { alpha: 1 },
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_OUT,
			},
			HIDDEN: {
				state: { alpha: 0 },
				time: 0.3,
				timeFunction: KEY_SPLINES.EASE_IN,
			},
		},

		init(successCallback, postEditCallback) {
			this.parent();

			this.setSize(ig.system.width, ig.system.height);
			this.hook.zIndex = 9999998;
			this.hook.localAlpha = 0.8;
			this.hook.temporary = true;
			this.hook.pauseGui = true;

			this.buttonGroup = new sc.ButtonGroup();
			this.buttonInteract = new ig.ButtonInteractEntry();
			this.buttonInteract.pushButtonGroup(this.buttonGroup);

			this.content = new ig.GuiElementBase();
			this.content.setSize(259, 80);

			this.automaticMode = sc.model.isGame() || !!sc.multiworld.postEditCallback;

			this.msgBox = new sc.CenterBoxGui(this.content);
			this.msgBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
			this.msgBox.hook.pos.y = -14;
			this.addChildGui(this.msgBox);

			this.backButton = new sc.ButtonGui("\\i[back]Back", 128)
			this.backButton.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
			this.backButton.setPos(this.automaticMode ? 0 : 67, -27);
			this.backButton.onButtonPress = this.onBackButtonPress.bind(this);
			this.backButton.submitSound = sc.BUTTON_SOUND.back;
			this.buttonGroup.addFocusGui(this.backButton, this.automaticMode ? 0 : 1, 0);
			this.buttonInteract.addGlobalButton(this.backButton, sc.control.menuBack);
			this.msgBox.addChildGui(this.backButton);

			if (!this.automaticMode) {
				this.loginButton = new sc.ButtonGui("Login", 128);
				this.loginButton.setPos(-67, -27);
				this.loginButton.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
				this.loginButton.onButtonPress = this.onLoginButtonPress.bind(this);
				this.buttonGroup.addFocusGui(this.loginButton, 0, 0);
				this.msgBox.addChildGui(this.loginButton);

				this.editButton = new sc.ButtonGui("Edit Options", 128);
				this.editButton.setPos(-67, -55);
				this.editButton.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
				this.editButton.onButtonPress = this.onEditButtonPress.bind(this);
				this.buttonGroup.addFocusGui(this.editButton, 0, 1);
				this.msgBox.addChildGui(this.editButton);

				this.offlineButton = new sc.ButtonGui("Play Offline", 128);
				this.offlineButton.setPos(67, -55);
				this.offlineButton.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
				this.offlineButton.onButtonPress = this.onOfflineButtonPress.bind(this);
				this.buttonGroup.addFocusGui(this.offlineButton, 1, 1);
				this.msgBox.addChildGui(this.offlineButton);
			}

			this.textChild = new sc.TextGui("Logging in.", { maxWidth: 240 });
			this.content.addChildGui(this.textChild);

			this.successCallback = successCallback;
			this.postEditCallback = postEditCallback;

			this.doStateTransition("HIDDEN", true);
		},

		show() {
			ig.interact.addEntry(this.buttonInteract);
			ig.interact.setBlockDelay(0.2);
			this.doStateTransition("DEFAULT");
		},

		hide(success) {
			if (!success) {
				sc.multiworld.disconnect();
			}
			ig.interact.removeEntry(this.buttonInteract);
			ig.interact.setBlockDelay(0.2);
			this.doStateTransition("HIDDEN", false, true);
		},

		startLogin(connectionInfo, mw) {
			this.mw = mw;
			this.connectionInfo = connectionInfo;

			if (this.automaticMode) {
				this.doLogin();
			} else {
				this.textChild.setText(
					`Connect to the server?\n` +
					`\\c[3]URL:\\c[0] ${this.connectionInfo?.url}\n` +
					`\\c[3]Slot:\\c[0] ${this.connectionInfo.name}`
				);
			}
		},

		doLogin() {
			sc.multiworld.login(this.connectionInfo, this.mw, this);
			this.editButton?.setActive(false);
			this.loginButton?.setActive(false);
			this.offlineButton?.setActive(false);
		},

		updateDrawables(renderer) {
			renderer.addColor("#000", 0, 0, this.hook.size.x, this.hook.size.y);
		},

		onBackButtonPress() {
			this.hide(false);
		},

		onEditButtonPress() {
			if (!sc.model.isMenu()) {
				sc.menu.setDirectMode(true, sc.MENU_SUBMENU.AP_CONNECTION);
			}

			if (this.mw) {
				sc.multiworld.loginMenuMultiworldVars = this.mw;
			}

			if (this.postEditCallback) {
				// If we can intepret the login info directly, do so.
				// LSP doesn't like this trick, though
				// @ts-ignore
				if (this.connectionInfo && this.connectionInfo.url) {
					// @ts-ignore
					sc.multiworld.connectionInfo = this.connectionInfo;
				}
				sc.multiworld.postEditCallback = this.postEditCallback;
			}
			if (sc.model.isMenu()) {
				sc.menu.pushMenu(sc.MENU_SUBMENU.AP_CONNECTION);
			} else {
				sc.model.enterMenu(true);
			}
			this.hide(false);
		},

		onLoginButtonPress() {
			this.doLogin();
		},

		onOfflineButtonPress() {
			sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.mw.warnings.offline"), sc.DIALOG_INFO_ICON.INFO, (button) => {
				if (button.data == 0) {
					if (this.mw) {
						sc.multiworld.dummyLogin(this.mw, this);
					}
				}
			});
		},

		onLoginProgress(message) {
			this.textChild.setText(message);
		},

		onLoginError(message) {
			this.textChild.setText(`\\c[1]${message}`);
			this.editButton?.setActive(true);
			this.loginButton?.setActive(true);
			this.offlineButton?.setActive(true);
		},

		onLoginSuccess(message) {
			this.textChild.setText(`\\c[2]${message}`);
			this.hide(true);
			this.successCallback();
			sc.multiworld.postEditCallback?.();
		},
	});

	sc.TitleScreenButtonGui.inject({
		init() {
			this.parent();

			let continueButton: sc.ButtonGui = this.namedButtons["continue"];
			if (continueButton) {
				let oldContinueCallback = continueButton.onButtonPress;

				continueButton.onButtonPress = () => {
					let slot: ig.SaveSlot = ig.storage.getSlot(ig.storage.lastUsedSlot);
					let mw = slot.data.vars.storage.mw;
					sc.multiworld.spawnLoginGui(mw?.connectionInfo, mw, oldContinueCallback, () => {
						sc.menu.exitCallback = oldContinueCallback;
						sc.model.enterPrevSubState();
					});
				};
			}


			let newGameButton: sc.ButtonGui = this.namedButtons["start"];

			let oldNewGameCallback = newGameButton.onButtonPress.bind(newGameButton);

			newGameButton.onButtonPress = () => {
				sc.menu.setDirectMode(true, sc.MENU_SUBMENU.AP_TEXT_CLIENT);
				sc.menu.exitCallback = () => {
					if (sc.multiworld.client.authenticated && sc.newgame.active) {
						// unset New Game Plus to get the behavior I want from the callback.
						let oldNGP = this._newGamePlus;
						this._newGamePlus = false;
						oldNewGameCallback();
						this._newGamePlus = oldNGP;
					}
				};
				sc.model.enterMenu(true);
				if (!this._newGamePlus) {
					sc.Dialogs.showDialog(ig.lang.get("sc.gui.mw.warnings.no-new-game-plus"), sc.DIALOG_INFO_ICON.WARNING);
				}
			}
		},

		show() {
			this.parent();

			if (window.activeMods.map(x => x.name).includes("open-world")) {
				this.namedButtons["start"].setActive(false);
				this.namedButtons["continue"].setActive(false);
				this.namedButtons["loadGame"].setActive(false);
				simplify.options.reload();
				sc.Dialogs.showDialog(
					"You still have the Open World mod active. This mod is now incorporated into " +
					"CCMultiworldRandomizer. Please disable it and restart the game.",
					sc.DIALOG_INFO_ICON.ERROR,
				);
			}
		},
	});

	sc.SaveList.inject({
		onSlotLoadPressed(button) {
			let callback = this.parent;
			let slot: ig.SaveSlot = ig.storage.getSlot(button.slot == -2 ? -1 : button.slot);
			let mw = slot.data.vars.storage.mw;
			sc.multiworld.spawnLoginGui(mw?.connectionInfo, mw, () => { callback.call(this, button); }, () => { callback.call(this, button) });
		}
	});

	sc.NewGameModeSelectDialog.inject({
		init(callback) {
			this.parent(callback);
			let oldCallback = this.buttongroup.pressCallbacks[0];

			this.buttongroup.pressCallbacks[0] = (button) => {
				this.hide();
				sc.menu.setDirectMode(true, sc.MENU_SUBMENU.AP_TEXT_CLIENT);
				sc.menu.exitCallback = () => {
					if (sc.multiworld.client.authenticated) {
						(button as sc.ButtonGui).data = 0;
						oldCallback(button);
					}
				};
				sc.model.enterMenu(true);
			};
		}
	});

	sc.CrossCode.inject({
		start(startMode, transitionTime) {
			if (startMode == undefined || startMode == sc.START_MODE.STORY) {
				startMode = sc.START_MODE.NEW_GAME_PLUS;
			}
			this.parent(startMode, transitionTime);
		},
	});
}
