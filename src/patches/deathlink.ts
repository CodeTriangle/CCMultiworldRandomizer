import type MwRandomizer from "../plugin";

export function patch(plugin: MwRandomizer) {
	sc.Combat.inject({
		onCombatantDeathHit(attacker, victim) {
			this.parent(attacker, victim);
			if (victim instanceof ig.ENTITY.Player) {
			} else {
				return;
			}
			const victimName = sc.multiworld.playerData.alias;
			let enemyName = "an enemy";
			if (attacker instanceof ig.ENTITY.Enemy) {
				enemyName = this.enemyDataList[attacker.enemyName].name.en_US;
			}
			if (victim == ig.game.playerEntity) {
				sc.multiworld.sendDeathLinkPacket({
					source: victimName,
					cause: `${victimName} was killed by ${enemyName}`,
					time: Date.now() / 1000,
				});
			}
		},
	});

	ig.ENTITY.Player.inject({
		onDefeat(a: any) {
			this.parent(a);
			if (sc.multiworld.deathLinkMessage) {
				return;
			}
			const victimName = sc.multiworld.playerData.alias;
			sc.multiworld.sendDeathLinkPacket({
				source: victimName,
				cause: `${victimName} died of natural causes`,
				time: Date.now() / 1000,
			});

			sc.multiworld.deathLinkMessage = undefined;
		}
	});
}
