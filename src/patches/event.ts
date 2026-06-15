import type MwRandomizer from "../plugin";
import {RawElement} from '../item-data.model';

export function patch(plugin: MwRandomizer) {
	let maps = plugin.randoData?.items;

	ig.EVENT_STEP.SET_PLAYER_CORE.inject({
		start() {
			if (
				this.core != sc.PLAYER_CORE.ELEMENT_HEAT &&
				this.core != sc.PLAYER_CORE.ELEMENT_COLD &&
				this.core != sc.PLAYER_CORE.ELEMENT_SHOCK &&
				this.core != sc.PLAYER_CORE.ELEMENT_WAVE
			) {
				return this.parent();
			}

			const map = maps?.[ig.game.mapName];
			if (!map || !map.elements) {
				return this.parent();
			}

			if (!ig.vars.get('tmp.elementGiven')) {
				ig.vars.set('tmp.elementGiven', true);

				const check = Object.values(map.elements)[0] as RawElement;
				sc.multiworld.reallyCheckLocations(check.mwids);
			}
		}
	});

	ig.EVENT_STEP.RESET_SKILL_TREE.inject({
		start() {
			if (maps?.[ig.game.mapName]) {
				return; // do not reset the skilltree if there is a check in the room
			}
			return this.parent();
		}
	});

	ig.EVENT_STEP.SEND_ITEM = ig.EventStepBase.extend({
		mwids: [],
		oldItem: undefined,
		init(settings) {
			this.mwids = settings.mwids.filter(x => sc.multiworld.locationInfo[x] != undefined);
			this.oldItem = {
				"item": settings.item,
				"amount": settings.amount,
			}
		},
		start() {
			if (this.mwids.length == 0) {
				let amount = ig.Event.getExpressionValue(this.oldItem.amount);
				sc.model.player.addItem(this.oldItem.item, amount, false);
			}

			sc.multiworld.reallyCheckLocations(this.mwids);
		}
	});

	ig.EVENT_STEP.MW_GOAL_COMPLETED = ig.EventStepBase.extend({
		init(settings) {
			this.goal = settings.goal;
		},
		start() {
			if (
				sc.multiworld.options.goal === undefined && this.goal === "creator" ||
				sc.multiworld.options.goal === this.goal
			) {
				try {
					sc.multiworld.client.goal();
				} catch {
					console.error("Failed to send goal because you are disconnected. Please reconnect ASAP.");
				}
			}
		}
	});

	/* ********** *
	 * OPEN WORLD *
	 * ********** */

	ig.EVENT_STEP.EQUIP_ITEM = ig.EventStepBase.extend({
		part: null,
		item: null,
		init: function (settings) {
			this.part = Number(settings.part);
			this.item = Number(settings.item);
		},
		start: function () {
			sc.model.player.setEquipment(this.part, this.item)
		},
	});

	ig.EVENT_STEP.UPDATE_VISITED_AREA = ig.EventStepBase.extend({
		init: function (settings) {
			this.area = settings.area;
		},

		start: function() {
			sc.map.updateVisitedArea(this.area);
		}
	});

	ig.EVENT_STEP.MAP_AND_STAMP = ig.EventStepBase.extend({
		init: function (settings) {
			this.area = settings.area;
			this.stamp = settings.stamp;
		},

		start: function() {
			sc.menu.addMapStamp(this.area, this.stamp.key, this.stamp.x, this.stamp.y, this.stamp.level);
			sc.menu.setDirectMode(true, sc.MENU_SUBMENU.MAP);
			sc.model.enterMenu(true);
			sc.model.prevSubState = sc.GAME_MODEL_SUBSTATE.RUNNING;
		},
	});

	ig.EVENT_STEP.SYNC_PARTY_MEMBER_SP_LEVEL = ig.EventStepBase.extend({
		init: function (settings) {
			this.member = settings.member;
		},
		start: function () {
			sc.party.getPartyMemberModel(this.member).setSpLevel(sc.model.player.spLevel);
		},
	});

	sc.AR_COLOR.BLUE = { rgb: "#17446a", yOff: 16 };
	ig.GUI.OW_ARBox = ig.GUI.ARBox.extend({
		yOffset: null,
		init: function (b, a, d, c, e, f) {
			this.parent();
			this.setPivot(0, 4);
			this.hook.zIndex = -50;
			this.target = b;
			this.text = a;
			this.yOffset = f;
			this.maxTime = this.timer = d || 0;
			this.mode = c || false;
			this.color = e || sc.AR_COLOR.GREEN;
			this.hook.invisibleUpdate = true;
			b = new sc.TextGui(this.text, { speed: ig.TextBlock.SPEED.NORMAL, font: sc.fontsystem.smallFont, });
			b.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
			this.addChildGui(b);
			this.setSize( b.hook.size.x + 8, b.hook.size.y + 4 + (this.mode ? 2 : 0) );
			this.hook.pivot.y = b.hook.size.y / 2 + 2;
			this.doStateTransition("HIDDEN", true);
			this.target
				? this._updatePos(false)
				: this.doStateTransition("DEFAULT");
		},
		_updatePos: function (b) {
			var a = this.hook,
				d = this.target.getCenter(),
				c = Math.round(d.x) - ig.game.screen.x,
				d = Math.round( d.y - this.target.coll.pos.z - this.target.coll.size.z / 2 - this.yOffset) - ig.game.screen.y,
				e = this.target.coll.size.x / 2,
				f = (this.target.coll.size.y + this.target.coll.size.z) / 2 - 4,
				g = Math.max(e, f),
				h = c - ig.system.width / 2,
				i = h > 0 ? 1 : -1;
			if (b) {
				if (i != this.prevMove.x && Math.abs(h) > 16) this.prevMove.x = i; this.delta.x = this.delta.x * 0.9 + this.prevMove.x * 0.1; this.delta.y = this.delta.y * 0.9 + this.prevMove.y * 0.1;
			} else { this.prevMove.x = this.delta.x = i; this.prevMove.y = this.delta.y = -1; }
			a.pos.x = c + this.delta.x * (e + a.size.x / 2) - a.size.x / 2;
			a.pos.y = d + this.delta.y * (f + a.size.y / 2) - a.size.y / 2;
			if (!this.hideOutsideOfScreen) {
				a.pos.x = a.pos.x.limit(0, ig.system.width - a.size.x);
				b = sc.gui.statusHud.getFreeScreenMinY(a.pos.x);
				a.pos.y = a.pos.y.limit(b, ig.system.height - a.size.y);
				a.removeAfterTransition || this.doStateTransition("DEFAULT");
			}
			this.arrowX = c - a.pos.x;
			this.hideOutsideOfScreen && !a.removeAfterTransition && (this.arrowX < -8 - g || this.arrowX > a.size.x + g + 8 || a.pos.y > d || a.pos.y < d - g - a.size.y - 8
					? this.doStateTransition("HIDDEN")
					: this.doStateTransition("DEFAULT"));
		},
	});
 
	ig.EVENT_STEP.SHOW_OW_AR_MSG = ig.EVENT_STEP.SHOW_AR_MSG.extend({
		init: function (a) {
			this.entity = a.entity;
			this.text = new ig.LangLabel(a.text);
			this.time = a.time;
			this.mode = sc.AR_BOX_MODE[a.mode];
			this.color = sc.AR_COLOR[a.color];
			this.partName = a.partName;
			this.varFill = a.varFill;
			this.varFillMax = a.varFillMax;
			this.yOffset = a.yOffset
		},
		start: function (a, b) {
			var c = ig.Event.getEntity(this.entity, b),
				e = c,
				f = ig.Event.getExpressionValue(this.time);
			if (this.partName)
				for (var g = c.coll.subColls, h = g.length; h--; )
					if (g[h].entity.partName == this.partName) {
						e = g[h].entity;
						break;
					}
			e = new ig.GUI.OW_ARBox(e, this.text.toString(), f, this.mode, this.color, this.yOffset);
			ig.gui.addGuiElement(e);
			if (this.hideOutsideOfScreen) e.hideOutsideOfScreen = true;
			this.varFill &&
				e.setVarFill(
					this.varFill,
					ig.Event.getExpressionValue(this.varFillMax),
					c
				);
			e.setAttachedEntity(c);
		},
	});

	// "fix" for increase_player_sp_level
	ig.EVENT_STEP.INCREASE_PLAYER_SP_LEVEL.inject({
		start() {
			sc.model.player.setSpLevel("" + (Number(sc.model.player.spLevel) + 1));
		},
	});

	// fix for to not show landmarks on enhanced skip beginning
	sc.TopMsgHudGui.inject({
		modelChanged: function(model, event, data) {
			if (model == sc.map && event == sc.MAP_EVENT.LANDMARK_ADDED) {
				if (ig.game.mapName == "newgame") { return; }
			}
			return this.parent(model, event, data);
		}
	});
}
