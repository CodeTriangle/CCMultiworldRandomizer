import * as ap from 'archipelago.js';
import type MwRandomizer from '../plugin';
import "../types/multiworld-model.d";

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
			this.buttonGroup.addFocusGui(this.apSettingsButton);
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
			let result = {};
			for (let i = 0; i < this.fields.length; i++) {
				result[this.fields[i].key] = this.inputGuis[i].value.join("");
			}

			return result;
		},

		connectFromInput() {
			let options = this.getOptions();
			if (isNaN(options.port)) {
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

		hideMenu: function () {
			this.parent();
			ig.interact.setBlockDelay(0.1);
			this.removeObservers();
			this.msgBox.doStateTransition("HIDDEN");
			this.doStateTransition("HIDDEN", false);
		},

		onBackButtonPress: function () {
			sc.menu.popBackCallback();
			sc.menu.popMenu();
		},

		addObservers: function () {
			sc.Model.addObserver(sc.model, this);
		},

		removeObservers: function () {
			sc.Model.removeObserver(sc.model, this);
		},

		modelChanged: function(model: any, msg: number, data: any) {
			if (model == sc.multiworld && msg == sc.MULTIWORLD_MSG.CONNECTION_STATUS_CHANGED) {
			}
		},

		onDetach: function () {},
	});

	sc.MENU_SUBMENU.AP_CONNECTION = 300000;
	sc.SUB_MENU_INFO[sc.MENU_SUBMENU.AP_CONNECTION] = {
		Clazz: sc.APConnectionBox,
		name: "apConnection",
	};
}
