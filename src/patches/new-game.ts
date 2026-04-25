import type MwRandomizer from "../plugin";
import "ultimate-crosscode-typedefs";

declare global {
	namespace sc {
		interface NewGameModeSelectDialog {
			apGfx: ig.Image;
			apGui: sc.NewGameModeDialogButton;
			oldCallback: this["callback"];
		}

		interface NewGameToggleSet {
			setName: string;
		}
	}
}

export function patch(plugin: MwRandomizer) {
	sc.TrophyManager.inject({
		getTotalPoints() {
			return 1e9;
		}
	});

	sc.NewGamePlusModel.inject({
		options: { "rhombus-start": true },
		onReset() {
			this.parent();
			this.options['rhombus-start'] = true;
		}
	});

	sc.NewGamePlusMenu.inject({
		init() {
			this.parent();
			if (!sc.menu.newGameViewMode && sc.model.isGame()) {
				// this.button.setActive(sc.newgame.hasAnyOptions());
				const oldWidth = this.button.hook.size.x;
				this.button.setText(
					"\\i[help2]" + ig.lang.get("sc.gui.menu.new-game.modifyOptions")
				)
				const newWidth = this.button.hook.size.x;
				this.button.hook.pos.x -= (newWidth - oldWidth) / 2;
				this.button.setActive(true);
			}
		},

		onBeginButtonPressed() {
			if (!sc.menu.newGameViewMode && sc.model.isGame()) {
				sc.menu.popBackCallback();
				sc.menu.popMenu();
			} else {
				this.parent();
			}
		},
	});

	sc.NewGameToggleSet.inject({
		init(set, list, yOffset, listIndex, counter) {
			this.parent(set, list, yOffset, listIndex, counter);
			this.setName = set;
		},

		updateActiveState(
			totalPoints: number,
			newGameCost: number,
			remainingCredits: number,
		) {
			this.parent(totalPoints, newGameCost, remainingCredits);

			for (const button of this.buttons) {
				if (
					button.data.id == "rhombus-start" ||
					this.setName == "carry-over" && !sc.menu.newGameViewMode && sc.model.isGame()
				) {
					button.setActive(false);
				}
			}
		}
	});
}
