import { ExperienceUtils } from "../utils/ExperienceUtils";
import Entity from "./Entity";
import { Skill } from "./Skills";

export default class CombatCalculator {
  private entity: Entity;

  constructor(entity: Entity) {
    this.entity = entity;
  }

  private getLevel(skillName: Skill): number {
    this.entity.getSkillExperience(skillName);
    return ExperienceUtils.getLevelFromExperience(
      this.entity[`${skillName}Experience`] || 1
    );
  }

  public getCombatLevel(): number {
    const prayerLevel = this.getLevel("prayer");
    const hitpointsLevel = this.getLevel("hitpoints");
    const defenceLevel = this.getLevel("defence");
    const attackLevel = this.getLevel("attack");
    const strengthLevel = this.getLevel("strength");
    const magicLevel = this.getLevel("magic");
    const rangedLevel = this.getLevel("ranged");

    // Step 1: Calculate base combat level
    const prayerContribution = Math.floor(prayerLevel / 2);
    const baseCombat = (hitpointsLevel + defenceLevel + prayerContribution) / 4;

    // Step 2: Calculate melee combat level
    const meleeCombat = baseCombat + (attackLevel + strengthLevel) * 0.325;

    // Step 3: Calculate magic or ranged combat level
    const magicContribution = Math.floor(magicLevel / 2) + magicLevel;
    const rangedContribution = Math.floor(rangedLevel / 2) + rangedLevel;

    const magicCombat = baseCombat + magicContribution * 0.325;
    const rangedCombat = baseCombat + rangedContribution * 0.325;

    // Determine the highest combat level
    const highestCombatLevel = Math.max(meleeCombat, magicCombat, rangedCombat);
    
    // Round it down to the nearest whole number
    return Math.floor(highestCombatLevel);
  }
}
