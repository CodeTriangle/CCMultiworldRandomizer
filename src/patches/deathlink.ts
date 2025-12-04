import * as ap from 'archipelago.js';
import type MwRandomizer from '../plugin';


declare global {
	namespace sc {
		interface APDeathLink extends ig.GameAddon {
			deathLinkProcessed: boolean;

			receiveDeath(this: this, source: string, time: number, cause?: string): void;
			onCombatDeath(this: this, attacker: any, victim: any): void;
			onNormalDeath(this: this): void;
			sendDeathLink(this: this, victim: string, cause?: string): void;

			modelChanged(this: this, model: any, msg: number, data: any): void;
		}

		interface APDeathLinkConstructor extends ImpactClass<sc.APDeathLink> {
			new (): sc.APDeathLink;
		}

		var APDeathLink: APDeathLinkConstructor;
	}
}

export function patch(plugin: MwRandomizer) {
	sc.APDeathLink = ig.GameAddon.extend({
		init() {
			this.deathLinkProcessed = false;
			sc.Model.addObserver(sc.multiworld, this);
			sc.multiworld.client.deathLink.on("deathReceived", (source, time, cause) => this.receiveDeath(source, time, cause));
			const onCombatDeath = (a, v) => this.onCombatDeath(a, v);
			const onNormalDeath = () => this.onNormalDeath();
			sc.Combat.inject({
				onCombatantDeathHit(a, v) {
					this.parent(a, v);
					onCombatDeath(a, v);
				}
			});
			ig.ENTITY.Player.inject({
				onDefeat(a: any) {
					this.parent(a);
					onNormalDeath();
				}
			});
		},

		modelChanged(model, msg, data) {
			if (
				model === sc.multiworld &&
				msg === sc.MULTIWORLD_MSG.CONNECTION_STATUS_CHANGED &&
				data === sc.MULTIWORLD_CONNECTION_STATUS.CONNECTED &&
				sc.multiworld.connectionInfo.deathLink
			) {
				sc.multiworld.client.deathLink.enableDeathLink();
			}
		},

		receiveDeath(source, time, cause) {
			this.deathLinkProcessed = true;
			if (ig.game.playerEntity) ig.game.playerEntity.selfDestruct();
			sc.Model.notifyObserver(sc.multiworld, sc.MULTIWORLD_MSG.DEATH_RECEIVED, {source, time, cause});
		},

		onCombatDeath(attacker, victim) {
			if (!(victim instanceof ig.ENTITY.Player)) {
				return;
			}
			const victimName = sc.multiworld.client.name;
			let enemyName = "an enemy";
			if (attacker instanceof ig.ENTITY.Enemy) {
				enemyName = sc.combat.enemyDataList[attacker.enemyName].name.en_US;
			}
			if (victim == ig.game.playerEntity) {
				this.sendDeathLink(victimName, `${victimName} was killed by ${enemyName}`);
				this.deathLinkProcessed = true;
			}
		},

		onNormalDeath() {
			if (this.deathLinkProcessed) {
				this.deathLinkProcessed = false;
				return;
			}
			const victimName = sc.multiworld.client.name;
			this.sendDeathLink(victimName, `${victimName} died of natural causes`);
		},

		sendDeathLink(victim, cause) {
			if (!sc.multiworld.connectionInfo.deathLink) return;

			sc.multiworld.client.deathLink.sendDeathLink(victim, cause);
			sc.Model.notifyObserver(sc.multiworld, sc.MULTIWORLD_MSG.DEATH_SENT, cause);
		}
	});

	sc.Combat.inject({
		onCombatantDeathHit(attacker, victim) {
			this.parent(attacker, victim);
		},
	});

	ig.ENTITY.Player.inject({
		onDefeat(a: any) {
			this.parent(a);
		}
	});

	ig.addGameAddon(() => {
		return (sc.model.deathLink = new sc.APDeathLink());
	});
}
