import type MwRandomizer from '../plugin';

import type {} from 'nax-ccuilib/src/headers/nax/input-field.d.ts'
import type {} from 'nax-ccuilib/src/headers/nax/input-field-type.d.ts'

declare global {
	namespace sc {
		interface APConnectionStatusGui extends sc.TextGui, sc.Model.Observer {
			updateText(this: this, status: string): void;
		}
		interface APConnectionStatusGuiConstructor extends ImpactClass<APConnectionStatusGui> {
			new (): APConnectionStatusGui;
		}
		var APConnectionStatusGui: APConnectionStatusGuiConstructor;

		interface PauseScreenGui {
			apConnectionStatusGui: sc.APConnectionStatusGui;
			apSettingsButton: sc.ButtonGui;
		}
		enum MENU_SUBMENU {
			AP_CONNECTION,
		}

		interface APConnectionBox extends sc.BaseMenu, sc.Model.Observer {
			fields: {key: string; label: string, obscure?: boolean}[];
			textGuis: sc.TextGui[];
			inputGuis: nax.ccuilib.InputField[];
			boundExitCallback: () => void;
			buttongroup: sc.ButtonGroup;
			inputList: ig.GuiElementBase;
			textColumnWidth: number;
			vSpacer: number;
			hSpacer: number;
			content: ig.GuiElementBase;
			msgBox: sc.BlackWhiteBox;
			apConnectionStatusGui: sc.APConnectionStatusGui;
			msgBoxBox: ig.GuiElementBase;
			connect: sc.ButtonGui;
			disconnect: sc.ButtonGui;
			buttonHolder: ig.GuiElementBase;
			back: null;
			keepOpen: boolean;

			getOptions(this: this): sc.MultiWorldModel.AnyConnectionInformation;
			onBackButtonPress(this: this): void;
			connectFromInput(this: this): void;
		}
		interface APConnectionBoxConstructor extends ImpactClass<APConnectionBox> {
			new (): APConnectionBox;
		}
		var APConnectionBox: APConnectionBoxConstructor;
	}
}


export function patch(plugin: MwRandomizer) {
	sc.QuickMenuAnalysis.inject({
		limitCursorPos() {
			sc.quickmodel.cursor.x = sc.quickmodel.cursor.x.limit(0, ig.system.width);
			sc.quickmodel.cursor.y = sc.quickmodel.cursor.y.limit(0, ig.system.height);
		}
	});

	sc.APConnectionStatusGui = sc.TextGui.extend({
		init: function () {
			this.parent("", {font: sc.fontsystem.tinyFont});
			this.updateText(sc.multiworld.status);

			sc.Model.addObserver(sc.multiworld, this);
		},

		updateText: function (status: string) {
			this.setText(`AP: ${plugin.getColoredStatus(status)}`);
		},

		modelChanged(model: any, msg: number, data: any) {
			if (model == sc.multiworld && msg == sc.MULTIWORLD_MSG.CONNECTION_STATUS_CHANGED) {
				this.updateText(data);
			}
		},
	});

	sc.PauseScreenGui.inject({
		init(...args) {
			this.parent(...args);

			this.apConnectionStatusGui = new sc.APConnectionStatusGui();
			this.apConnectionStatusGui.setPos(3, 3);

			this.apConnectionStatusGui.setAlign(this.versionGui.hook.align.x, this.versionGui.hook.align.y);
			this.apConnectionStatusGui.setPos(0, this.versionGui.hook.size.y * 2);

			this.versionGui.addChildGui(this.apConnectionStatusGui);

			this.apSettingsButton = new sc.ButtonGui(ig.lang.get("sc.gui.pause-screen.archipelago"), sc.BUTTON_DEFAULT_WIDTH);
			this.apSettingsButton.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
			this.apSettingsButton.setPos(3, 3);
			this.buttonGroup.addFocusGui(this.apSettingsButton, 1000, 1000 /* makes it unfocusable by gamepad */);
			this.apSettingsButton.onButtonPress = function () {
				sc.menu.setDirectMode(true, sc.MENU_SUBMENU.AP_TEXT_CLIENT);
				sc.model.enterMenu(true);
			}.bind(this);

			this.addChildGui(this.apSettingsButton);
		},

		updateButtons(refocus) {
			this.parent(refocus);

			this.resumeButton.hook.pos.y += 27;
			this.skipButton.hook.pos.y += 27;
			this.cancelButton.hook.pos.y += 27;
			this.toTitleButton.hook.pos.y += 27;
			this.saveGameButton.hook.pos.y += 27;
			this.optionsButton.hook.pos.y += 27;

			this.buttonGroup.addFocusGui(this.apSettingsButton, 0, this.buttonGroup.largestIndex.y + 1);
		},
	});

	sc.APConnectionBox = sc.BaseMenu.extend({
		gfx: new ig.Image("media/gui/menu.png"),

		fields: [
			{
				key: "url",
				label: "URL",
			},
			{
				key: "name",
				label: "Slot Name",
			},
			{
				key: "password",
				label: "Password",
				obscure: true,
			}
		],

		transitions: {
			DEFAULT: { state: {}, time: 0.25, timeFunction: KEY_SPLINES.LINEAR },
			HIDDEN: { state: { alpha: 0 }, time: 0.25, timeFunction: KEY_SPLINES.LINEAR },
		},

		textGuis: [],
		inputGuis: [],

		textColumnWidth: 0,
		hSpacer: 5,
		vSpacer: 3,

		msgBox: null,
		msgBoxBox: null,
		inputList: null,
		content: null,
		connect: null,
		disconnect: null,
		buttonHolder: null,

		buttongroup: null,
		back: null,
		keepOpen: false,

		init: function () {
			this.parent();

			this.boundExitCallback = () => {}

			this.hook.zIndex = 9999999;
			this.hook.localAlpha = 0.0;
			this.hook.pauseGui = true;
			this.hook.size.x = ig.system.width;
			this.hook.size.y = ig.system.height;

			this.buttongroup = new sc.ButtonGroup();

			this.buttongroup.addPressCallback(() => {});

			this.inputList = new ig.GuiElementBase();

			for (let i = 0; i < this.fields.length; i++) {
				let textGui = new sc.TextGui(this.fields[i].label);
				this.textColumnWidth = Math.max(this.textColumnWidth, textGui.hook.size.x);
				textGui.hook.pos.y = (textGui.hook.size.y + this.vSpacer) * i;
				this.inputList.addChildGui(textGui);
				this.textGuis.push(textGui);

				let inputGui = new nax.ccuilib.InputField(
					200,
					textGui.hook.size.y,
					nax.ccuilib.INPUT_FIELD_TYPE.DEFAULT,
					this.fields[i].obscure ?? false
				);

				// @ts-expect-error
				inputGui.data = ig.lang.get("sc.gui.mw.connection-menu." + this.fields[i].key);

				this.buttongroup.addFocusGui(inputGui, 0, i);
				inputGui.hook.pos.y = (textGui.hook.size.y + this.vSpacer) * i;
				
				if (sc.multiworld.connectionInfo) {
					//@ts-ignore
					let prefill = "" + sc.multiworld.connectionInfo[this.fields[i].key];
					inputGui.value = prefill.split("");
					inputGui.setObscure(this.fields[i].obscure ?? false);
					inputGui.cursorPos = prefill.length;
					inputGui.cursor.hook.pos.x = inputGui.calculateCursorPos();
				}

				this.inputList.addChildGui(inputGui);
				this.inputGuis.push(inputGui);
			}

			for (const gui of this.inputGuis) {
				gui.hook.pos.x = this.textColumnWidth + this.hSpacer;
			}

			this.inputList.setSize(
				this.textColumnWidth + this.hSpacer + 200, 
				this.textGuis[0].hook.size.y * this.textGuis.length + this.vSpacer * (this.textGuis.length - 1)
			);

			this.content = new ig.GuiElementBase();

			this.msgBox = new sc.BlackWhiteBox(this.inputList.hook.size.x, this.inputList.hook.size.y);
			this.msgBox.setSize(this.inputList.hook.size.x + 22, this.inputList.hook.size.y + 10);
			this.msgBox.addChildGui(this.inputList);

			this.inputList.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);

			this.apConnectionStatusGui = new sc.APConnectionStatusGui();
			this.apConnectionStatusGui.setPos(7, 0);

			this.msgBoxBox = new ig.GuiElementBase();
			this.msgBoxBox.setSize(
				this.msgBox.hook.size.x,
				this.msgBox.hook.size.y + this.apConnectionStatusGui.hook.size.y
			);

			this.msgBox.setPos(0, this.apConnectionStatusGui.hook.size.y);

			this.msgBoxBox.addChildGui(this.apConnectionStatusGui);
			this.msgBoxBox.addChildGui(this.msgBox);
			this.msgBoxBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);

			this.connect = new sc.ButtonGui("Connect", sc.BUTTON_MENU_WIDTH);
			this.connect.onButtonPress = this.connectFromInput.bind(this);
			this.connect.data = ig.lang.get("sc.gui.mw.connection-menu.connect");
			this.buttongroup.addFocusGui(this.connect, 0, this.fields.length);

			this.disconnect = new sc.ButtonGui("Disconnect", sc.BUTTON_MENU_WIDTH);
			this.disconnect.onButtonPress = () => { sc.multiworld.disconnect() };
			this.disconnect.setPos(sc.BUTTON_MENU_WIDTH + this.hSpacer);
			this.disconnect.data = ig.lang.get("sc.gui.mw.connection-menu.disconnect");
			this.buttongroup.addFocusGui(this.disconnect, 1, this.fields.length);

			this.buttongroup.addSelectionCallback(button => {
				if (button == undefined) {
					sc.menu.setInfoText("", true);
					return;
				}
				sc.menu.setInfoText((button as sc.ButtonGui).data as string);
			});

			this.buttongroup.setMouseFocusLostCallback(() => {
				sc.menu.setInfoText("", true);
			});

			this.buttonHolder = new ig.GuiElementBase();

			this.buttonHolder.addChildGui(this.connect);
			this.buttonHolder.addChildGui(this.disconnect);
			this.buttonHolder.setSize(sc.BUTTON_MENU_WIDTH * 2 + this.hSpacer, sc.BUTTON_TYPE.DEFAULT.height);
			this.buttonHolder.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);

			this.content.addChildGui(this.msgBoxBox);
			this.content.addChildGui(this.buttonHolder);
			this.content.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);

			if (sc.multiworld.status != sc.MULTIWORLD_CONNECTION_STATUS.DISCONNECTED) {
				this.connect.setActive(false);
			}

			this.content.setSize(
				Math.max(
					this.msgBoxBox.hook.size.x,
					this.buttonHolder.hook.size.x
				),
				this.msgBoxBox.hook.size.y + this.buttonHolder.hook.size.y + this.vSpacer,
			);
			this.addChildGui(this.content);

			this.doStateTransition("HIDDEN", true);
		},

		getOptions() {
			let result: Record<string, string> = {};
			for (let i = 0; i < this.fields.length; i++) {
				result[this.fields[i].key] = this.inputGuis[i].value.join("");
			}

			return result as unknown as sc.MultiWorldModel.AnyConnectionInformation;
		},

		connectFromInput() {
			let options = this.getOptions();

			let mw = sc.multiworld.loginMenuMultiworldVars;
			if (!mw) {
				mw = ig.vars.get("mw");
			}

			sc.multiworld.spawnLoginGui(options, mw, () => {});
		},

		showMenu: function () {
			this.parent();

			sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.HIDDEN);

			ig.interact.setBlockDelay(0.1);
			this.addObservers();

			sc.menu.buttonInteract.pushButtonGroup(this.buttongroup);
			sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));

			this.msgBox.doStateTransition("DEFAULT");
			this.doStateTransition("DEFAULT");
		},

		hideMenu() {
			this.removeObservers();
			this.exitMenu();
		},

		exitMenu: function () {
			this.parent();

			if (sc.multiworld.postEditCallback) {
				sc.multiworld.postEditCallback = null;

				if (!sc.multiworld.client.socket.connected) {
					// @ts-ignore
					sc.multiworld.connectionInfo = null;
				}
			}

			ig.interact.setBlockDelay(0.1);
			this.doStateTransition("HIDDEN", false);

			sc.menu.buttonInteract.removeButtonGroup(this.buttongroup);

			sc.multiworld.loginMenuMultiworldVars = undefined;
		},

		onBackButtonPress: function () {
			sc.menu.popBackCallback();
			sc.menu.popMenu();
		},

		addObservers: function () {
			sc.Model.addObserver(sc.model, this);
			sc.Model.addObserver(sc.multiworld, this);
		},

		removeObservers: function () {
			sc.Model.removeObserver(sc.model, this);
			sc.Model.removeObserver(sc.multiworld, this);
		},

		modelChanged: function(model: any, msg: number, data: any) {
			if (model == sc.multiworld && msg == sc.MULTIWORLD_MSG.CONNECTION_STATUS_CHANGED) {
				this.connect.setActive(data == sc.MULTIWORLD_CONNECTION_STATUS.DISCONNECTED);
			}
		},

		onDetach: function () {},
	});

	// @ts-expect-error
	sc.MENU_SUBMENU.AP_CONNECTION = 300000;
	sc.SUB_MENU_INFO[sc.MENU_SUBMENU.AP_CONNECTION] = {
		Clazz: sc.APConnectionBox,
		name: "apConnection",
	};
}
