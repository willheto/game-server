import WebSocketServer from "../network/WebSocketEvents";
import Entity from "./entity/Entity";
import Bear from "./monster/Bear";
import Skeleton from "./monster/Skeleton";
import Player from "./player/Player";

const worldMap: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 4, 4],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 4, 4],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 4, 4],
  [1, 1, 1, 1, 4, 4, 1, 1, 1, 1, 1, 1, 2, 1, 4, 4],
  [1, 1, 1, 1, 4, 4, 1, 1, 1, 1, 1, 1, 2, 1, 4, 4],
  [1, 1, 1, 1, 4, 4, 1, 1, 1, 1, 1, 1, 2, 1, 4, 4],
  [1, 1, 1, 1, 4, 4, 5, 1, 1, 1, 1, 1, 2, 1, 4, 4],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 4, 4],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 4, 4],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 4, 4],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 4, 4],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 4, 4],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 4, 4],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 4, 4],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 4, 4],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 4, 4],
];

const tileInfo = {
  1: { walkable: true },
  2: { walkable: false },
  3: { walkable: false },
  4: { walkable: false },
  5: { walkable: false },
};

export interface ActionQueue {
  playerID: string;
  action: "move" | "playerAttackMove";
  data: any;
}

class World {
  players: Player[] = [];
  entities: Entity[] = [];
  chatMessages: { playerID: string; timeSent: number; message: string }[] = [];
  worldMap: number[][] = worldMap;
  tileInfo: { [key: number]: { walkable: boolean } } = tileInfo;
  tickRate: number;
  currentTickActionQueue: ActionQueue[] = [];
  tickUpdateTime: number = Date.now();

  webSocketHandler = new WebSocketServer(3000, this);

  constructor(tickRate: number) {
    this.tickRate = tickRate;

    this.setInitialEntities();
  }

  public static getWorldMap(): number[][] {
    return worldMap;
  }

  public static getTileInfo(): { [key: number]: { walkable: boolean } } {
    return tileInfo;
  }

  enqueueAction(action: ActionQueue) {
    this.currentTickActionQueue.push(action);
  }

  // Adds a player to the world
  addPlayer(player: Player): Player {
    this.players.push(player);
    return player;
  }

  // Removes a player from the world
  removePlayer(playerID: string) {
    this.players = this.players.filter(
      (player) => player.entityID !== playerID
    );
  }

  removeEntity(entityID: string) {
    this.entities = this.entities.filter(
      (entity) => entity.entityID !== entityID
    );
  }

  // Tick system: Updates the world state
  private gameTick() {
    // Update players
    this.players.forEach((player) => {
      const playerTickActions = this.currentTickActionQueue.filter(
        (action) => action.playerID === player.entityID
      );
      player.updatePlayer(playerTickActions);

      // Clear the action queue for the next tick
      this.currentTickActionQueue = this.currentTickActionQueue.filter(
        (action) => action.playerID !== player.entityID
      );
    });

    this.entities.forEach((entity) => {
      entity.update();
    });

    this.tickUpdateTime = Date.now();
    this.webSocketHandler.broadcastGameState();
  }

  public getWorldData(): {
    players: Player[];
    entities: Entity[];
    chatMessages: { playerID: string; message: string }[];
    worldMap: number[][];
  } {
    return {
      tickUpdateTime: this.tickUpdateTime,
      // @ts-expect-error
      players: this.players.map((player) => {
        return {
          entityID: player.entityID,
          worldX: player.worldX,
          worldY: player.worldY,
          name: player.name,
          direction: player.direction,
          currentHitpoints: player.currentHitpoints,
          hitpointsExperience: player.hitpointsExperience,
          attackStyle: player.attackStyle,
          isHpBarShown: player.isHpBarShown,
          examineText: player.examineText,
          isDead: player.isDead,
          lastDamageDealt: player.lastDamageDealt,
          spriteNum: player.spriteNum,
          nextTileDirection: player.nextTileDirection,
          hpBarCounter: player.hpBarCounter,
          combatLevel: player.getCombatLevel(),
        };
      }),
      // @ts-expect-error
      entities: this.entities.map((entity) => {
        return {
          entityID: entity.entityID,
          worldX: entity.worldX,
          worldY: entity.worldY,
          name: entity.name,
          type: entity.type,
          currentHitpoints: entity.currentHitpoints,
          hitpointsExperience: entity.hitpointsExperience,
          direction: entity.direction,
          isHpBarShown: entity.isHpBarShown,
          examineText: entity.examineText,
          isDead: entity.isDead,
          lastDamageDealt: entity.lastDamageDealt,
          spriteNum: entity.spriteNum,
          nextTileDirection: entity.nextTileDirection,
          hpBarCounter: entity.hpBarCounter,
          combatLevel: entity.getCombatLevel(),
        };
      }),

      chatMessages:
        // only 7 newest
        this.chatMessages.slice(Math.max(this.chatMessages.length - 7, 0)),
      worldMap: [],
    };
  }

  start(): void {
    setInterval(() => {
      this.gameTick();
    }, this.tickRate);
  }

  addEntity(entity: Entity): void {
    this.entities.push(entity);
  }

  setInitialEntities(): void {
    for (let i = 0; i < 2; i++) {
      this.addEntity(new Bear(this));
    }

    for (let i = 0; i < 3; i++) {
      this.addEntity(new Skeleton(this));
    }
  }

  getEntityByID(entityID: string): Entity | undefined {
    return (
      this.entities.find((entity) => entity.entityID === entityID) ||
      this.players.find((player) => player.entityID === entityID)
    );
  }
}

export default World;
