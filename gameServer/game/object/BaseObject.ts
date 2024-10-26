export class BaseObject {
  public worldX: number | null;
  public worldY: number | null;

  public isWieldable: boolean = false;
  public name: string;
  public examineText: string;

  constructor() {
    this.worldX = 0; // Default values
    this.worldY = 0;

    this.name = "";
    this.examineText = "";
  }
}
