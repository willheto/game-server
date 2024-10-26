import { Weapon } from "../object/Weapon";
import { ExperienceUtils } from "./ExperienceUtils";

export class CombatUtils {
  static getAttackHitChance(attackValue: number, defenceValue: number): number {
    let hitChance: number = 50 + (attackValue - defenceValue) * 5;
    if (hitChance < 5) {
      hitChance = 5;
    } else if (hitChance > 95) {
      hitChance = 95;
    }

    return hitChance;
  }

  static getAttackDamage(
    strengthExperience: number,
    wieldedWeapon: Weapon | null
  ): number {
    const strengthLevel: number =
      ExperienceUtils.getLevelFromExperience(strengthExperience);

    let damage: number;
    if (wieldedWeapon === null) {
      damage = 1 + Math.floor(strengthLevel / 4);
    } else {
      damage = Math.floor(strengthLevel / 4) + wieldedWeapon.attackValue;
    }

    return damage;
  }
}
