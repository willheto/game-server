import { printDebug } from "../../../util/Logger";
import Entity from "../entity/Entity";
import { aStar } from "../pathfinding/aStar";
import { ExperienceUtils } from "../utils/ExperienceUtils";
import { ActionQueue } from "../World";
import World from "../World";

export default class Player extends Entity {
  constructor(
    world: World,
    playerID: string,
    worldX: number,
    worldY: number,
    name: string
  ) {
    super(world, worldX, worldY, name, 0);
    this.entityID = playerID;
    this.hitpointsExperience = 388;
    this.attackExperience = 0;
    this.strengthExperience = 500;
    this.defenceExperience = 0;
    this.respawnTime = 1;

    this.currentHitpoints = ExperienceUtils.getLevelFromExperience(
      this.hitpointsExperience
    );
  }

  updatePlayer(playerTickActions: ActionQueue[]) {
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

    if (this.attackTickCounter > 0) {
      this.attackTickCounter--;
    }

    if (this.lastDamageDealtCounter > 0) {
      this.lastDamageDealtCounter--;
    } else {
      this.lastDamageDealt = null;
    }

    if (this.hpBarCounter > 0) {
      this.hpBarCounter--;
    } else {
      this.isHpBarShown = false;
    }

    // Logic for movement, combat, interaction, etc.
    playerTickActions.forEach((action) => {
      switch (action.action) {
        case "move":
          const newTargetTile = {
            x: action.data.targetX,
            y: action.data.targetY,
          };

          const currentTile = {
            x: this.worldX,
            y: this.worldY,
          };

          if (
            newTargetTile === this.targetTile ||
            newTargetTile === currentTile
          ) {
            return;
          }

          this.newTargetTile = newTargetTile;

          // Reset the targeted entity
          this.targetedEntityID = null;

          break;

        case "playerAttackMove":
          const entityToAttack = this.world.getEntityByID(action.data.entityID);

          if (entityToAttack) {
            this.newTargetTile = {
              x: entityToAttack.worldX,
              y: entityToAttack.worldY,
            };
            this.targetedEntityID = action.data.entityID;
          }

          break;

        default:
          printDebug("Unknown action: " + action.action);
      }
    });

    this.moveTowardsTarget();

    // Additional logic for combat, interacting with items, etc.
  }
}
