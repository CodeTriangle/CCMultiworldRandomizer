import type MwRandomizer from "../plugin";
import "ultimate-crosscode-typedefs";

declare global {
	namespace sc {
		interface NewGameModeSelectDialog {
			apGfx: ig.Image;
			apGui: sc.NewGameModeDialogButton;
			oldCallback: this["callback"];
		}
	}
}

export function patch(plugin: MwRandomizer) {
	sc.NewGameModeSelectDialog.inject({
		init(...args) {
			this.parent(...args);

			this.content.hook.size.x += 110;
			this.msgBox.hook.size.x += 110;
			this.msgBox.centerBox.hook.size.x += 110;

			this.apGfx = new ig.Image("media/gui/archipelago-start.png");

			this.apGui = new sc.NewGameModeDialogButton(
				"Archipelago",
				2
			);

			this.apGui.hook.pos.y = 27;
			this.apGui.hook.align.x = ig.GUI_ALIGN.X_CENTER;
			this.apGui.image.setImage(this.apGfx, 0, 0, 110, 90);
			this.content.addChildGui(this.apGui);

			this.buttongroup.removeFocusGui(1, 0);
			this.buttongroup.addFocusGui(this.apGui, 1, 0);
			this.buttongroup.addFocusGui(this.plus, 2, 0);

			this.buttongroup.addSelectionCallback((gui) => {
				if ((gui as sc.ButtonGui)?.data == 2) {
					this.info.doStateTransition("DEFAULT", true);
					this.info.setText("Connect to a multiworld and play with friends!");
				}
			});

			this.oldCallback = this.callback
			this.callback = (gui) => {
				this.oldCallback(gui, this);
				if (gui.data == 2) { // gui.data == 2 means Archipelago Start
					// First, open the AP connection screen
					sc.menu.setDirectMode(true, sc.MENU_SUBMENU.AP_CONNECTION);
					// Set a callback for when we exit that screen.
					sc.menu.exitCallback = () => {
						if (sc.multiworld.connectionInfo && sc.newgame.active) {
							// Because the exit callback is created in the scope of an instance of sc.TitleScreenButtonGui, and because
							// that instance is not given an identifier anywhere, we have to search for it!
							// The way we do this is by looping through the nameless GUIs and checking if any of them have a child named
							// buttons and then whether that has a child named changelogGui. This is unique enough to single it down to one
							// instance.
							const titleScreenButtons = (ig.gui.guiHooks.filter(
								x => (x.gui as sc.TitleScreenGui).buttons?.changelogGui
							)[0].gui as sc.TitleScreenGui).buttons;

							titleScreenButtons.changelogGui.clearLogs();
							ig.bgm.clear("MEDIUM_OUT");
							// c && c.stop();
							// c = null;
							ig.interact.removeEntry(titleScreenButtons.buttonInteract);
							ig.game.start(sc.START_MODE.NEW_GAME_PLUS, 1);
						} else {
							sc.newgame.onReset?.();
						}
					}
					sc.model.enterMenu(true);
				}
			}
		}
	});
}
