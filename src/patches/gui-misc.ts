import * as ap from 'archipelago.js';
import type MwRandomizer from '../plugin';

import type * as _ from 'nax-ccuilib/src/headers/nax/input-field.d.ts'

declare global {
	namespace sc {
		interface APConnectionStatusGui extends sc.TextGui, sc.Model.Observer {
			updateText(this: this): void;
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
			fields: {key: string; label: string}[];
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

			getOptions(this: this): Record<string, string>;
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

	sc.APConnectionStatusGui = sc.TextGui.extend({
		init: function () {
			this.parent("", {font: sc.fontsystem.tinyFont});
			this.updateText();

			sc.Model.addObserver(sc.multiworld, this);
		},

		updateText: function () {
			this.setText(`AP: ${plugin.getColoredStatus(sc.multiworld.client.status.toUpperCase())}`);
		},

		modelChanged(model: any, msg: number, data: any) {
			if (model == sc.multiworld && msg == sc.MULTIWORLD_MSG.CONNECTION_STATUS_CHANGED) {
				this.updateText();
			}
		},
	});

	sc.PauseScreenGui.inject({
		init(...args) {
			this.parent(...args);

			this.apConnectionStatusGui = new sc.APConnectionStatusGui();

			this.apConnectionStatusGui.setAlign(this.versionGui.hook.align.x, this.versionGui.hook.align.y);
			this.apConnectionStatusGui.setPos(0, this.versionGui.hook.size.y * 2);

			this.versionGui.addChildGui(this.apConnectionStatusGui);

			this.apSettingsButton = new sc.ButtonGui("\\i[ap-logo] Archipelago Settings");
			this.apSettingsButton.setPos(3, 3);
			this.buttonGroup.addFocusGui(this.apSettingsButton, 1000, 1000 /* makes it unfocusable by gamepad */);
			this.apSettingsButton.onButtonPress = function () {
				sc.menu.setDirectMode(true, sc.MENU_SUBMENU.AP_CONNECTION);
				sc.model.enterMenu(true);
			}.bind(this);

			this.addChildGui(this.apSettingsButton);
		},
	});

	sc.APConnectionBox = sc.BaseMenu.extend({
		gfx: new ig.Image("media/gui/menu.png"),

		fields: [
			{
				key: "hostname",
				label: "Hostname",
			},
			{
				key: "port",
				label: "Port",
			},
			{
				key: "name",
				label: "Slot Name",
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
			sc.menu.buttonInteract.pushButtonGroup(this.buttongroup);

			this.buttongroup.addPressCallback(() => {});

			sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));

			this.inputList = new ig.GuiElementBase();

			for (let i = 0; i < this.fields.length; i++) {
				let textGui = new sc.TextGui(this.fields[i].label);
				this.textColumnWidth = Math.max(this.textColumnWidth, textGui.hook.size.x);
				textGui.hook.pos.y = (textGui.hook.size.y + this.vSpacer) * i;
				this.inputList.addChildGui(textGui);
				this.textGuis.push(textGui);

				let inputGui = new nax.ccuilib.InputField(200, textGui.hook.size.y);
				this.buttongroup.addFocusGui(inputGui, 0, i);
				inputGui.hook.pos.y = (textGui.hook.size.y + this.vSpacer) * i;
				
				if (sc.multiworld.connectionInfo) {
					//@ts-ignore
					let prefill = "" + sc.multiworld.connectionInfo[this.fields[i].key];
					inputGui.value = prefill.split("");
					inputGui.textChild.setText(prefill);
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
			this.buttongroup.addFocusGui(this.connect, 0, this.fields.length);

			this.disconnect = new sc.ButtonGui("Disconnect", sc.BUTTON_MENU_WIDTH);
			this.disconnect.onButtonPress = () => { sc.multiworld.client.disconnect() };
			this.disconnect.setPos(sc.BUTTON_MENU_WIDTH + this.hSpacer);
			this.buttongroup.addFocusGui(this.disconnect, 1, this.fields.length);

			this.buttonHolder = new ig.GuiElementBase();

			this.buttonHolder.addChildGui(this.connect);
			this.buttonHolder.addChildGui(this.disconnect);
			this.buttonHolder.setSize(sc.BUTTON_MENU_WIDTH * 2 + this.hSpacer, sc.BUTTON_TYPE.DEFAULT.height);
			this.buttonHolder.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);

			this.content.addChildGui(this.msgBoxBox);
			this.content.addChildGui(this.buttonHolder);
			this.content.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);

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

			return result;
		},

		connectFromInput() {
			let options = this.getOptions();
			if (isNaN(options.port as unknown as number)) {
				sc.Dialogs.showErrorDialog(
					"Port is not a number",
					true,
				);
				return;
			}
			let portNumber = Number(options.port);

			if (portNumber > 65535 || portNumber < 1) {
				sc.Dialogs.showErrorDialog(
					"Port must be between 1 and 65535",
					true
				);
				return;
			}

			sc.multiworld.login({
				game: 'CrossCode',
				hostname: options.hostname,
				port: portNumber,
				items_handling: ap.ITEMS_HANDLING_FLAGS.REMOTE_ALL,
				name: options.name,
			});
		},

		showMenu: function () {
			this.parent();
			ig.interact.setBlockDelay(0.1);
			this.addObservers();
			this.msgBox.doStateTransition("DEFAULT");
			this.doStateTransition("DEFAULT");
		},

		exitMenu: function () {
			this.parent();
			ig.interact.setBlockDelay(0.1);
			this.removeObservers();
			this.doStateTransition("HIDDEN", false);

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
			if (model == sc.multiworld && msg == sc.MULTIWORLD_MSG.OPTIONS_PRESENT) {
				// if we launched from the title screen that means we are in a context
				// where we want to put in our login info and start the game.
				// so we wait for options to be present and when they are, we exit the menu.
				// exiting the menu automatically activates a bit of code
				// set by the new game mode select callback.
				// if connection details are available, it starts the game.
				if (sc.model.isTitle()) {
					this.doStateTransition("HIDDEN");
					sc.menu.pushMenu(sc.MENU_SUBMENU.NEW_GAME);
				}
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
