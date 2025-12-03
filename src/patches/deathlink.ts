import * as ap from 'archipelago.js';
import type MwRandomizer from '../plugin';


declare global {
	namespace sc {
		interface APDeathLink extends ig.GameAddon {
			deathLinkProcessed: boolean;

			receiveDeath(this: this): void;
			onCombatDeath(attacker: any, victim: any): void;
			onNormalDeath(): void;
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
			//sc.multiworld.client.deathLink.enableDeathLink();
			sc.multiworld.client.deathLink.on("deathReceived", () => this.receiveDeath());
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

		receiveDeath() {
			if (ig.game.playerEntity) ig.game.playerEntity.selfDestruct();
		},

		onCombatDeath(attacker, victim) {
			if (!(victim instanceof ig.ENTITY.Player)) {
				return;
			}
			const victimName = sc.multiworld.client.name;
			let enemyName = "an enemy";
			if (attacker instanceof ig.ENTITY.Enemy) {
				enemyName = this.enemyDataList[attacker.enemyName].name.en_US;
			}
			if (victim == ig.game.playerEntity) {
				sc.multiworld.client.deathLink.sendDeathLink(victimName, `${victimName} was killed by ${enemyName}`);
				this.deathLinkProcessed = true;
			}
		},

		onNormalDeath() {
			if (this.deathLinkProcessed) {
				this.deathLinkProcessed = false;
				return;
			}
			const victimName = sc.multiworld.client.name;
			sc.multiworld.client.deathLink.sendDeathLink(victimName, `${victimName} died of natural causes`);
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
