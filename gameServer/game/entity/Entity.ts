import { aStar, PathNode } from "../pathfinding/aStar";
import { CombatUtils } from "../utils/CombatUtils";
import { ExperienceUtils } from "../utils/ExperienceUtils";
import { v4 as uuidv4 } from "uuid";
import World from "../World";
import CombatCalculator from "./CombatCalculator";
import { Skill } from "./Skills";
import { printDebug } from "../../../util/Logger";

type AttackStyle = "melee" | "ranged" | "magic";

export default class Entity {
  public combatCalculator = new CombatCalculator(this);
  public world: World;
  public originalWorldX: number;
  public originalWorldY: number;

  public entityID: string;
  public worldX: number;
  public worldY: number;
  public targetTile: {
    x: number;
    y: number;
  } | null = null;

  public targetedEntityID: string | null = null;

  public currentHitpoints: number;
  public type: number; // 0 = player, 1 = npc, 2 = monster

  public attackExperience: number;
  public strengthExperience: number;
  public defenceExperience: number;
  public hitpointsExperience: number;
  public rangedExperience: number;
  public magicExperience: number;
  public prayerExperience: number;

  public name: string;
  public direction: string;

  public dialogues: string[] = [];
  public dialogueIndex: number = 0;

  public dying: boolean = false;
  public isHpBarShown: boolean = false;
  public hpBarCounter: number = 0;

  public attackStyle: AttackStyle = "melee";
  public attackSpeed: number = 4; // 4 ticks per attack (2.4 seconds)
  public attackTickCounter: number = 0;

  public examineText: string = "";

  protected tickCounter: number = 0;

  public isDead: boolean = false;
  public respawnTime: number = 20; // Ticks === 12 seconds
  public respawnTickCounter: number = 0;

  public lastDamageDealt: number | null = 0;
  public lastDamageDealtCounter: number = 0;

  public spriteCounter: number = 0;
  public spriteNum: number = 1;

  public followTickCounter: number = 0; // Counter for follow ticks
  public shouldFollow: boolean = true; // Flag to indicate if the entity should follow

  public newTargetTile: { x: number; y: number } | null = null;

  public nextTileDirection:
    | "upLeft"
    | "upRight"
    | "downLeft"
    | "downRight"
    | null = null;

  constructor(
    world: World,
    worldX: number,
    worldY: number,
    name: string,
    type: number
  ) {
    this.world = world;
    this.entityID = uuidv4();

    this.originalWorldX = worldX;
    this.originalWorldY = worldY;

    this.worldX = worldX;
    this.worldY = worldY;
    this.name = name;
    this.type = type;
    this.currentHitpoints = 10;

    this.attackExperience = 0;
    this.strengthExperience = 0;
    this.defenceExperience = 0;
    this.hitpointsExperience = 0;
    this.rangedExperience = 0;
    this.magicExperience = 0;
    this.prayerExperience = 0;

    this.direction = "down";
  }

  public getCombatLevel(): number {
    return this.combatCalculator.getCombatLevel();
  }

  public getSkillExperience(skillName: Skill): number {
    return this[`${skillName}Experience`];
  }

  public resetEntity() {
    this.currentHitpoints = ExperienceUtils.getLevelFromExperience(
      this.hitpointsExperience
    );
    this.targetTile = null;
    this.targetedEntityID = null;
    this.isHpBarShown = false;
    this.dying = false;
    this.worldX = this.originalWorldX;
    this.worldY = this.originalWorldY;
  }

  public speak() {
    if (this.dialogues[this.dialogueIndex] == null) {
      this.dialogueIndex = 0;
    }

    this.dialogueIndex++;
  }

  public getHitpointsLevel(): number {
    return ExperienceUtils.getLevelFromExperience(this.hitpointsExperience);
  }

  public getAttackLevel(): number {
    return ExperienceUtils.getLevelFromExperience(this.attackExperience);
  }

  public getStrengthLevel(): number {
    return ExperienceUtils.getLevelFromExperience(this.strengthExperience);
  }

  public getDefenceLevel(): number {
    return ExperienceUtils.getLevelFromExperience(this.defenceExperience);
  }

  public getAttackHitChance(enemydefenceExperience: number): number {
    return CombatUtils.getAttackHitChance(
      ExperienceUtils.getLevelFromExperience(this.attackExperience),
      ExperienceUtils.getLevelFromExperience(enemydefenceExperience)
    );
  }

  public getAttackDamage() {
    return CombatUtils.getAttackDamage(
      this.strengthExperience,
      //this.equipment.weapon
      null
    );
  }

  public update() {
    if (!this.targetedEntityID) {
      // Set random target tile
      this.tickCounter++;
      if (this.tickCounter > 7) {
        this.tickCounter = 0;

        if (!this.targetTile) {
          // 50% chance to move to a random tile
          if (Math.random() > 0.5) {
            const newTargetTile = {
              x: Math.floor(Math.random() * 10),
              y: Math.floor(Math.random() * 10),
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
          }
        }
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

    if (this.targetedEntityID) {
      if (this.followTickCounter > 0) {
        this.followTickCounter--;
      } else {
        this.moveTowardsTarget();
      }
    } else {
      this.moveTowardsTarget(); // Normal movement logic
    }
  }

  attackEntity(entity: Entity): void {
    if (this.entityID === entity.entityID) {
      printDebug("Cannot attack self");
      return;
    }

    if (!this.targetedEntityID) return;

    if (this.attackTickCounter !== 0) {
      return;
    }

    // set sprite to face the target
    const deltaX = entity.worldX - this.worldX;
    const deltaY = entity.worldY - this.worldY;
    const enemyDirection = this.getDirection(deltaX, deltaY);
    this.spriteNum =
      enemyDirection === "upLeft"
        ? 1
        : enemyDirection === "upRight"
        ? 4
        : enemyDirection === "downRight"
        ? 7
        : 10;

    this.attackTickCounter = this.attackSpeed;

    const attackChance = CombatUtils.getAttackHitChance(
      this.attackExperience,
      entity.defenceExperience
    );

    const attackDamage = CombatUtils.getAttackDamage(
      this.strengthExperience,
      null
    );

    const isDamageDealt = Math.random() * 100 < attackChance;

    entity.currentHitpoints -= isDamageDealt ? attackDamage : 0;
    entity.lastDamageDealt = isDamageDealt ? attackDamage : 0;
    entity.lastDamageDealtCounter = 3;
    entity.hpBarCounter = 10;

    entity.isHpBarShown = true;

    if (entity.currentHitpoints <= 0) {
      this.targetedEntityID = null;
      this.targetTile = null;

      entity.isDead = true;
    }

    if (entity.targetedEntityID === null) {
      entity.targetedEntityID = this.entityID;
    }

    // If the entity moves away, set the follow flag
    if (this.shouldFollow) {
      this.followTickCounter = 2; // Set to 1 tick before following
    }
  }

  protected moveTowardsTarget() {
    let target = this.getTarget();

    if (!target) return;

    const path = aStar(
      { x: this.worldX, y: this.worldY },
      target,
      World.getWorldMap(),
      World.getTileInfo()
    );

    if (path && path.length === 2 && this.targetedEntityID) {
      const entity = this.world.getEntityByID(this.targetedEntityID);
      if (!entity) {
        console.error("Entity not found");
        return;
      }
      this.attackEntity(entity);
      this.nextTileDirection = null;
      this.targetTile = null;
      return;
    }

    let pathToNewTarget: PathNode[] | null = null;
    if (
      this.newTargetTile !== null &&
      this.targetTile !== null &&
      this.targetTile !== this.newTargetTile
    ) {
      const nextStep = path ? path[1] : { x: this.worldX, y: this.worldY };
      pathToNewTarget = aStar(
        { x: nextStep.x, y: nextStep.y },
        this.newTargetTile,
        World.getWorldMap(),
        World.getTileInfo()
      );
    }

    if (path && path.length > 1) {
      const isLastStep = path.length === 2;
      this.moveAlongPath(
        path[1],
        path[2],
        pathToNewTarget ? pathToNewTarget[1] : null,
        isLastStep
      );
    }
  }

  protected getTarget() {
    if (this.targetTile && this.newTargetTile && this.targetedEntityID) {
      return this.targetTile;
    }

    if (this.targetedEntityID) {
      const entity = this.world.getEntityByID(this.targetedEntityID);
      if (!entity) {
        console.error("Entity not found");
        return null;
      }
      return { x: entity.worldX, y: entity.worldY };
    }
    return this.targetTile || this.newTargetTile;
  }

  protected moveAlongPath(
    nextStep: { x: number; y: number },
    nextNextStep: { x: number; y: number },
    pathToNewTarget: { x: number; y: number } | null,
    isLastStep: boolean
  ) {
    const deltaX = pathToNewTarget
      ? pathToNewTarget.x - nextStep.x
      : nextStep.x - this.worldX;

    const deltaY = pathToNewTarget
      ? pathToNewTarget.y - nextStep.y
      : nextStep.y - this.worldY;

    const stepSize = 1; // Adjust this for movement speed
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (pathToNewTarget) {
      this.worldX = nextStep.x;
      this.worldY = nextStep.y;

      this.nextTileDirection = this.getDirection(deltaX, deltaY);
      this.updateDirectionAndSprite(deltaX, deltaY);
    } else {
      if (this.newTargetTile === null) {
        if (distance > stepSize) {
          this.worldX += (deltaX / distance) * stepSize;
          this.worldY += (deltaY / distance) * stepSize;
        } else {
          this.worldX = nextStep.x;
          this.worldY = nextStep.y;
        }
      } else {
        this.nextTileDirection = this.getDirection(deltaX, deltaY);
        this.updateDirectionAndSprite(deltaX, deltaY);
      }

      if (isLastStep && this.newTargetTile === null) {
        this.targetTile = null;
        this.nextTileDirection = null;
      } else if (!this.newTargetTile) {
        const nextDeltaX = nextNextStep.x - nextStep.x;
        const nextDeltaY = nextNextStep.y - nextStep.y;
        this.nextTileDirection = this.getDirection(nextDeltaX, nextDeltaY);
        this.updateDirectionAndSprite(nextDeltaX, nextDeltaY);
      }
    }

    this.targetTile = this.newTargetTile || this.targetTile;

    this.newTargetTile = null;
  }

  private updateDirectionAndSprite(deltaX: number, deltaY: number) {
    this.nextTileDirection = this.getDirection(deltaX, deltaY);

    if (this.nextTileDirection) {
      this.updateSprite();
    }
  }

  private getDirection(
    deltaX: number,
    deltaY: number
  ): "downRight" | "upRight" | "downLeft" | "upLeft" | null {
    if (deltaX > 0 && deltaY < 0) return "upRight"; // Moving diagonally up-right
    if (deltaX > 0 && deltaY > 0) return "downRight"; // Moving diagonally down-right
    if (deltaX < 0 && deltaY < 0) return "upLeft"; // Moving diagonally up-left
    if (deltaX < 0 && deltaY > 0) return "downLeft"; // Moving diagonally down-left
    if (deltaX > 0) return "downRight"; // Moving right
    if (deltaX < 0) return "upLeft"; // Moving left
    if (deltaY > 0) return "downLeft"; // Moving down
    if (deltaY < 0) return "upRight"; // Moving up
    return null; // No movement
  }

  private updateSprite() {
    const spriteMap: { [key: string]: number[] } = {
      upLeft: [1, 2, 3],
      upRight: [4, 5, 6],
      downRight: [7, 8, 9],
      downLeft: [10, 11, 12],
    };

    if (this.nextTileDirection === null) return;

    const sprites = spriteMap[this.nextTileDirection];
    if (sprites) {
      this.spriteNum =
        sprites[(sprites.indexOf(this.spriteNum) + 1) % sprites.length];
    }
  }
}
