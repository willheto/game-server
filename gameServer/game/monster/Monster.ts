import Entity from "../entity/Entity";
import { ExperienceUtils } from "../utils/ExperienceUtils";
import World from "../World";

export default class Monster extends Entity {
  constructor(
    world: World,
    worldX: number,
    worldY: number,
    name: string,
    respawnTime: number
  ) {
    super(world, worldX, worldY, name, 2);
    this.respawnTime = respawnTime;
  }

  public update(): void {
    if (this.isDead) {
      if (this.respawnTickCounter < this.respawnTime) {
        this.respawnTickCounter++;
        this.resetEntity();
      } else {
        this.isDead = false;
        this.respawnTickCounter = 0;
        this.currentHitpoints = ExperienceUtils.getLevelFromExperience(
          this.hitpointsExperience
        );
      }
    }

    super.update();
  }
}
