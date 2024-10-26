import { BaseObject } from "./BaseObject";

export class Weapon extends BaseObject {
  static AttackStyle = {
    PUNCH: "PUNCH",
    KICK: "KICK",
    STAB: "STAB",
    SLASH: "SLASH",
    BLOCK: "BLOCK",
  } as const;

  attackStyles: Array<keyof typeof Weapon.AttackStyle>;
  attackValue: number;
  isWieldable: boolean;

  constructor() {
    super();
    this.isWieldable = true;
    this.attackStyles = []; // Initialize to an empty array
    this.attackValue = 0; // Default value
  }
}
