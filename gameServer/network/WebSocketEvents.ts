import { Server } from "socket.io";
import { createServer, Server as HTTPServer } from "http";
import World from "../game/World";
import Player from "../game/player/Player";
import { encodeGameState } from "./encoding";
import * as _ from "lodash";
import { printInfo } from "../../util/Logger";
import { db } from "../../db/query";

class WebSocketEventsHandler {
  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  public async handleConnection(socket: any): Promise<void> {
    const loginToken = socket.handshake.query.loginToken;
    if (!loginToken) {
      printInfo("Player connected without login token");
      socket.disconnect();
      return;
    }

    const account = await db
      .selectFrom("accounts")
      .where("login_token", "=", loginToken)
      .selectAll()
      .executeTakeFirst();

    if (!account) {
      printInfo("Player connected with invalid login token");
      socket.disconnect();
      return;
    }

    printInfo(account.username + " connected to the game server");

    const player = new Player(this.world, socket.id, 0, 0, account.username);

    this.world.addPlayer(player);

    const gameState = {
      tickUpdateTime: this.world.tickUpdateTime,
      players: this.world.getWorldData().players,
      entities: this.world.getWorldData().entities,
      worldMap: this.world.getWorldData().worldMap,
      playerID: socket.id,
    };

    const { encoded, codeTable } = encodeGameState(gameState);

    // Send the initial game state to the player
    socket.emit("gameState", {
      encoded,
      codeTable,
    });

    socket.on("playerMove", (data: { targetX: number; targetY: number }) => {
      this.world.enqueueAction({
        playerID: socket.id,
        action: "move",
        data,
      });
    });

    socket.on("playerAttackMove", (data: { entityID: string }) => {
      this.world.enqueueAction({
        playerID: socket.id,
        action: "playerAttackMove",
        data: {
          entityID: data.entityID,
        },
      });
    });

    socket.on("chatMessage", (data: { message: string }) => {
      this.world.chatMessages.push({
        playerID: socket.id,
        timeSent: new Date().getTime(),
        message: data.message,
      });
    });

    socket.on("disconnect", () => {
      printInfo("Player disconnected: " + socket.id);
      this.world.removePlayer(socket.id);
    });
  }
}

class WebSocketServer {
  private io: Server;
  private server: HTTPServer;
  private port: number;
  private webSocketHandler: WebSocketEventsHandler;
  private world: World;
  private previousGameState: any;

  constructor(port: number, world: any) {
    this.world = world;
    this.port = port;
    this.server = createServer();
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    this.webSocketHandler = new WebSocketEventsHandler(world);
    this.initializeSocketEvents();
    this.start();
  }

  private initializeSocketEvents(): void {
    this.io.on("connection", (socket) => {
      this.webSocketHandler.handleConnection(socket);
    });
  }

  public start(): void {
    this.server.listen(this.port, () => {
      printInfo(`Game server listening on port ${this.port}`);
    });
  }

  public broadcastGameState(): void {
    const gameState = this.world.getWorldData();

    // Check if the game state has changed
    if (this.previousGameState === gameState) {
      return;
    }

    let changedData = this.getChangedData(this.previousGameState, gameState);

    changedData = {
      ...changedData,
      tickUpdateTime: this.world.tickUpdateTime,
      onlinePlayers: this.world.players.map((player) => player.entityID),
    };

    const { encoded, codeTable } = encodeGameState(changedData);

    this.io.emit("gameState", {
      encoded,
      codeTable,
    });

    this.previousGameState = gameState;
  }

  private getChangedData(previousGameState: any, currentGameState: any): any {
    if (!previousGameState) {
      return currentGameState;
    }

    // Compare the two game states
    const changedData: any = {
      players: [],
      entities: [],
      chatMessages: [],
    };

    // Check if players have changed
    for (const playerId in currentGameState.players) {
      if (currentGameState.players.hasOwnProperty(playerId)) {
        const previousPlayer = previousGameState.players[playerId];
        const currentPlayer = currentGameState.players[playerId];

        // Check for changes in individual player properties
        if (!_.isEqual(previousPlayer, currentPlayer)) {
          changedData.players.push(currentPlayer); // Add updated player to the array
        }
      }
    }

    // Check if entities have changed
    for (const entityId in currentGameState.entities) {
      if (currentGameState.entities.hasOwnProperty(entityId)) {
        const previousEntity = previousGameState.entities[entityId];
        const currentEntity = currentGameState.entities[entityId];

        // Check for changes in individual entity properties
        if (!_.isEqual(previousEntity, currentEntity)) {
          changedData.entities.push(currentEntity); // Add updated entity to the array
        }
      }
    }

    // Check if chat messages have changed
    const previousMessages = previousGameState.chatMessages || [];
    const currentMessages = currentGameState.chatMessages || [];

    // Send only new chat messages
    for (const message of currentMessages) {
      if (!previousMessages.includes(message)) {
        changedData.chatMessages.push(message); // Only send new message
      }
    }

    // Check if world map has changed
    if (!_.isEqual(previousGameState.worldMap, currentGameState.worldMap)) {
      changedData.worldMap = currentGameState.worldMap; // Send the entire world map if changed
    }

    return changedData;
  }
}

export default WebSocketServer;
