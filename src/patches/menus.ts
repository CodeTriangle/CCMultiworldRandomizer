import MwRandomizer from "../plugin";

declare global {
	namespace sc {
		interface APGameInfoMenu extends sc.BaseMenu {
			fields: {
				label: string,
				callback: (options: sc.MultiWorldModel.MultiworldOptions) => string,
				textSpeed?: number,
			}[];
			textUis: { label: sc.TextGui, content: sc.TextGui }[];
			textBoxContainer: ig.GuiElementBase;
			msgBox: sc.BlackWhiteBox;
			buttonGroup: sc.ButtonGroup;
			onBackButtonPress(this: this): void;
		}

		interface APGameInfoMenuConstructor extends ImpactClass<sc.APGameInfoMenu> {
			new (): sc.APGameInfoMenu;
		}

		var APGameInfoMenu: APGameInfoMenuConstructor;

		enum MENU_SUBMENU {
			AP_GAME_INFO,
		}
	}
}

export function patch(plugin: MwRandomizer) {
	function getRandomizedLabel(value: boolean) {
		return ig.lang.get(`sc.gui.mw.game-info-menu.randomized.${value}`);
	}

	sc.APGameInfoMenu = sc.BaseMenu.extend({
		fields: [
			{
				label: "Goal",
				callback(options) {
					return ig.lang.get(`sc.gui.mw.game-info-menu.goals.${options.goal}`);
				},
				textSpeed: ig.TextBlock.SPEED.FASTER,
			},
			{
				label: "Keyrings",
				callback(options) {
					return ig.lang.get(`sc.gui.mw.game-info-menu.enabled.${options.keyrings.length !== 0}`);
				},
			},
			{
				label: "Quests",
				callback(options) {
					return getRandomizedLabel(options.questRando);
				},
			},
			{
				label: "Shops",
				callback() {
					// hacky solution: check if locationInfo has known shop slot values
					let perSlotSend = sc.multiworld.locationInfo[3235824524] !== undefined;
					let perTypeSend = sc.multiworld.locationInfo[3235824525] !== undefined;

					if (!perSlotSend && !perTypeSend) {
						return getRandomizedLabel(false);
					}

					return (
						getRandomizedLabel(true) + ", " +
						ig.lang.get(`sc.gui.mw.game-info-menu.shop-send.${perSlotSend ? "slot" : "type"}`)
					);
				},
				textSpeed: ig.TextBlock.SPEED.NORMAL,
			},
			{
				label: "Chest Locks",
				callback(options) {
					if (options.chestClearanceLevels === undefined) {
						return getRandomizedLabel(false);
					}

					return getRandomizedLabel(
						Object.keys(options.chestClearanceLevels).length !== 0
					);
				},
			},
			{
				label: "Overworld Areas",
				callback(options) {
					let label = "nonprog";
					if (options.progressiveChains[3235824050]?.length > 0) {
						label = "combined";
					} else if (options.progressiveChains[3235824051]?.length > 0) {
						if (options.progressiveChains[3235824052]?.length > 0) {
							label = "split";
						} else {
							label = "progressive";
						}
					}

					return ig.lang.get(`sc.gui.mw.game-info-menu.progressive.${label}`);
				},
			},
			{
				label: "Dungeons",
				callback(options) {
					let label = "nonprog";
					if (options.progressiveChains[3235824050]?.length > 0) {
						label = "combined";
					} else if (options.progressiveChains[3235824052]?.length > 0) {
						if (options.progressiveChains[3235824051]?.length > 0) {
							label = "split";
						} else {
							label = "progressive";
						}
					}

					return ig.lang.get(`sc.gui.mw.game-info-menu.progressive.${label}`);
				},
			},
		],

		transitions: {
			DEFAULT: { state: {}, time: 0.25, timeFunction: KEY_SPLINES.LINEAR },
			HIDDEN: { state: { alpha: 0 }, time: 0.25, timeFunction: KEY_SPLINES.LINEAR },
		},

		init() {
			this.parent();

			this.hook.size.x = ig.system.width;
			this.hook.size.y = ig.system.height;

			this.buttonGroup = new sc.ButtonGroup();

			const boxWidth = 350;
			const margin = 5;

			this.textBoxContainer = new ig.GuiElementBase();
			this.textBoxContainer.hook.size.x = boxWidth;

			const labels = this.fields.map(field => {
				let result = new sc.TextGui(field.label + ":")
				this.textBoxContainer.addChildGui(result);

				return result;
			});

			const firstColumnWidth = Math.max(...labels.map(label => label.hook.size.x));
			const secondColumnWidth = boxWidth - firstColumnWidth - margin;

			const contents = this.fields.map(field => {
				let result = new sc.TextGui(
					field.callback(sc.multiworld.options),
					{ maxWidth: secondColumnWidth, speed: field.textSpeed ?? ig.TextBlock.SPEED.SLOW }
				);
				this.textBoxContainer.addChildGui(result);

				return result;
			});

			let yPos = 0;

			this.textUis = labels
				.map((l, i) => [l, contents[i]])
				.map(([label, content]) => {
					label.hook.pos.x = firstColumnWidth - label.hook.size.x;
					label.hook.pos.y = yPos;
					content.hook.pos.x = firstColumnWidth + margin;
					content.hook.pos.y = yPos;

					yPos += content.hook.size.y;

					return { label, content };
				});

			this.textBoxContainer.hook.size.x = boxWidth;
			this.textBoxContainer.hook.size.y = yPos;

			this.textBoxContainer.hook.align.x = ig.GUI_ALIGN.X_CENTER;
			this.textBoxContainer.hook.align.y = ig.GUI_ALIGN.Y_CENTER;

			this.msgBox = new sc.BlackWhiteBox(
				this.textBoxContainer.hook.size.x,
				this.textBoxContainer.hook.size.y
			);

			this.msgBox.setSize(
				this.textBoxContainer.hook.size.x + 22,
				this.textBoxContainer.hook.size.y + 10
			);

			this.msgBox.hook.align.x = ig.GUI_ALIGN.X_CENTER;
			this.msgBox.hook.align.y = ig.GUI_ALIGN.Y_CENTER;

			this.msgBox.hook.transitions = {
				DEFAULT: { state: {}, time: 0.25, timeFunction: KEY_SPLINES.LINEAR },
				HIDDEN: { state: { scaleY: 0 }, time: 0.25, timeFunction: KEY_SPLINES.LINEAR },
			},

			this.msgBox.addChildGui(this.textBoxContainer);

			this.addChildGui(this.msgBox);

			this.doStateTransition("HIDDEN", true);
			this.msgBox.doStateTransition("HIDDEN", true);
		},

		showMenu() {
			this.parent();

			ig.interact.setBlockDelay(0.1);

			sc.menu.buttonInteract.pushButtonGroup(this.buttonGroup);
			sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));

			this.doStateTransition("DEFAULT");
			this.msgBox.doStateTransition("DEFAULT");
			this.textUis.forEach(({label, content}) => {
				label.reset();
				content.reset();
			});
		},

		hideMenu() {
			this.exitMenu();
		},

		exitMenu() {
			this.parent();
			ig.interact.setBlockDelay(0.2);

			sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup);

			this.doStateTransition("HIDDEN");
			this.msgBox.doStateTransition("HIDDEN");
		},

		onBackButtonPress() {
			sc.menu.popBackCallback();
			sc.menu.popMenu();
		},
	});

	// @ts-expect-error
	sc.MENU_SUBMENU.AP_GAME_INFO = 300002;
	sc.SUB_MENU_INFO[sc.MENU_SUBMENU.AP_GAME_INFO] = {
		Clazz: sc.APGameInfoMenu,
		name: "apGameInfoMenu",
	};
}
