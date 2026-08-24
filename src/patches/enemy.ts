import type MwRandomizer from "../plugin";

export function patch(plugin: MwRandomizer) {
	sc.Combat.inject({
		notifyCombatantDefeated(combatant, resolveDefeat, notifyArena) {
			this.parent(combatant, resolveDefeat, notifyArena);
			if (combatant instanceof ig.ENTITY.Enemy) {
				let enemy = sc.randoData.enemies[combatant.enemyName];
				if (enemy && !sc.multiworld.localCheckedLocations.has(enemy.kill)) {
					sc.multiworld.reallyCheckLocation(enemy.kill);
				}
			}
		}
	});
}
