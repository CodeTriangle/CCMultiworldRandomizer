import MwRandomizer from "../plugin";

declare global {
	namespace sc {
		interface MultiworldLoginListenerGui extends ig.GuiElementBase, sc.MultiWorldModel.LoginListener {
			msgBox: sc.CenterBoxGui;
			content: ig.GuiElementBase;
			textChild: sc.TextGui; 

			buttonGroup: sc.ButtonGroup;
			buttonInteract: ig.ButtonInteractEntry;

			backButton: sc.ButtonGui;
			editButton: sc.ButtonGui;

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

			onBackButtonPress(this: this): void;
			onEditButtonPress(this: this): void;
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
			this.hook.zIndex = 99999999;
			this.hook.localAlpha = 0.8;
			this.hook.temporary = true;
			this.hook.pauseGui = true;

			this.buttonGroup = new sc.ButtonGroup();
			this.buttonInteract = new ig.ButtonInteractEntry();
			this.buttonInteract.pushButtonGroup(this.buttonGroup);

			this.content = new ig.GuiElementBase();
			this.content.setSize(259, 80);

			let hideEditOptions = sc.model.isGame() || sc.multiworld.postEditCallback;

			this.backButton = new sc.ButtonGui("\\i[back]Back", 128)
			this.backButton.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
			this.backButton.setPos(hideEditOptions ? 0 : 67, -27);
			this.backButton.onButtonPress = this.onBackButtonPress.bind(this);
			this.backButton.submitSound = sc.BUTTON_SOUND.back;
			this.buttonGroup.addFocusGui(this.backButton, hideEditOptions ? 0 : 1, 0);
			this.buttonInteract.addGlobalButton(this.backButton, sc.control.menuBack);

			if (!hideEditOptions) {
				this.editButton = new sc.ButtonGui("Edit Options", 128);
				this.editButton.setPos(-67, -27);
				this.editButton.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
				this.editButton.onButtonPress = this.onEditButtonPress.bind(this);
				this.buttonGroup.addFocusGui(this.editButton, 0, 0);
			}

			this.textChild = new sc.TextGui("Logging in.", { maxWidth: 240 });
			this.content.addChildGui(this.textChild);

			this.msgBox = new sc.CenterBoxGui(this.content);
			this.msgBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
			this.msgBox.hook.pos.y = -14;

			this.msgBox.addChildGui(this.backButton);
			if (this.editButton) {
				this.msgBox.addChildGui(this.editButton);
			}

			this.addChildGui(this.msgBox);

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
				sc.multiworld.client.socket.disconnect();
			}
			ig.interact.removeEntry(this.buttonInteract);
			ig.interact.setBlockDelay(0.2);
			this.doStateTransition("HIDDEN", false, true);
		},

		startLogin(connectionInfo, mw) {
			this.mw = mw;
			sc.multiworld.login(connectionInfo, mw, this);
			this.connectionInfo = connectionInfo;
			this.editButton?.setActive(false);
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

		onLoginProgress(message) {
			this.textChild.setText(message);
		},

		onLoginError(message) {
			this.textChild.setText(`\\c[1]${message}`);
			this.editButton?.setActive(true);
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
					if (sc.multiworld.client.authenticated) {
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
