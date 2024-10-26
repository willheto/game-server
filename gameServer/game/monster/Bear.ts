import Monster from "./Monster";
import { ExperienceUtils } from "../utils/ExperienceUtils";
import World from "../World";

export default class Bear extends Monster {
  constructor(world: World) {
    super(world, 0, 0, "Bear", 20);

    this.hitpointsExperience = 388;
    this.attackExperience = 0;
    this.strengthExperience = 0;
    this.defenceExperience = 0;
    this.examineText = "A big bear.";

    this.currentHitpoints = ExperienceUtils.getLevelFromExperience(
      this.hitpointsExperience
    );
  }
}
