import bcrypt from "bcrypt";
import { printError, printInfo } from "../util/Logger";
import { db } from "../db/query";
import cors from "cors";
import { Server } from "socket.io";
import { createServer, Server as HTTPServer } from "http";

const express = require("express");
const app = express();
app.use(cors());
app.use(express.json());

const LOGIN_PORT = 8600;
const REGISTER_PORT = 8601;

const LOGIN_RESPONSE = {
  INVALID_CREDENTIALS: 3,
  LOGGED_INTO_THIS_WORLD: 4,
  LOGGED_INTO_ANOTHER_WORLD: 5,
  LOGIN_SUCCESS: 6,
};

const REGISTER_RESPONSE = {
  SUCCESS: 1,
  USERNAME_TAKEN: 2,
};

const LOGIN_REQUEST = {
  LOGIN: 1,
  LOGOUT: 2,
  RESET_WORLD: 3,
  COUNT_PLAYERS: 4,
  REGISTER: 5,
};

type Data = {
  type: number;
  world: number;
  username: string;
  password: string;
};

export default class LoginServer {
  private server: HTTPServer;
  private io: Server;

  private players: Map<number, Set<number>> = new Map();

  constructor() {
    this.server = createServer();
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.io.on("connection", (socket) => {
      socket.on("message", async (data: Data) => {
        if (!data.type || !data.world || !data.username || !data.password) {
          return;
        }

        if (data.type === LOGIN_REQUEST.LOGIN) {
          this.handleLoginRequest(socket, data);
        } else if (data.type === LOGIN_REQUEST.LOGOUT) {
          this.handleLogoutRequest(socket, data);
        } else if (data.type === LOGIN_REQUEST.RESET_WORLD) {
          this.handleResetWorldRequest(data);
        } else if (data.type === LOGIN_REQUEST.COUNT_PLAYERS) {
          this.handleCountPlayersRequest(socket, data);
        }
      });

      socket.on("disconnect", async () => {
        printInfo("Player disconnected");

        const account = await this.getAccountBySocketId(socket.id);
        if (!account) {
          return;
        }

        printInfo(`Player ${account.username} disconnected`);

        for (const [world, players] of this.players) {
          players.delete(account.account_id);
        }
      });
    });

    app.listen(REGISTER_PORT, () => {
      printInfo(`Register server listening on port ${REGISTER_PORT}`);
    });

    app.post("/create-account", async (req: any, res: any) => {
      try {
        const { username, password } = req.body;

        const account = await db
          .selectFrom("accounts")
          .where("username", "=", username)
          .selectAll()
          .executeTakeFirst();

        if (account) {
          res.json({ success: false, error: REGISTER_RESPONSE.USERNAME_TAKEN });
          return;
        }

        const hashedPassword = await bcrypt.hash(password.toLowerCase(), 10);
        const ip = req.ip.replace("::ffff:", "");
        await db
          .insertInto("accounts")
          .values({
            username,
            password: hashedPassword,
            registration_ip: ip,
            registration_date: new Date(),
          })
          .execute();

        res.json({ success: true });
      } catch (error: any) {
        printError(error);
        res.json({ success: false, error: "UNKNOWN" });
      }
    });
  }

  private async handleCountPlayersRequest(socket: any, data: Data) {
    const { world } = data;

    const playerCount = this.players.get(world)?.size || 0;

    socket.emit("message", {
      type: LOGIN_REQUEST.COUNT_PLAYERS,
      world,
      count: playerCount,
    });
  }

  private async handleResetWorldRequest(message: any) {
    const { world } = message;
    this.players.set(world, new Set());
  }

  private async handleLogoutRequest(socket: any, message: any) {
    const { world, loginToken } = message;

    const account = await db
      .selectFrom("accounts")
      .where("login_token", "=", loginToken)
      .selectAll()
      .executeTakeFirst();

    if (!account) {
      return;
    }

    const worldPlayers = this.players.get(world);
    const playerId = account.account_id;
    if (worldPlayers) {
      worldPlayers.delete(playerId);
    }

    socket.emit("message", {
      type: LOGIN_REQUEST.LOGOUT,
    });
  }

  private async areCredentialsValid(
    account: any,
    password: string
  ): Promise<boolean> {
    return (
      !account ||
      !(await bcrypt.compare(password.toLowerCase(), account.password))
    );
  }

  private async handleLoginRequest(socket: any, message: Data) {
    const { world, username, password } = message;

    const account = await db
      .selectFrom("accounts")
      .where("username", "=", username)
      .selectAll()
      .executeTakeFirst();

    if (!this.areCredentialsValid(account, password) || !account) {
      socket.emit("message", {
        type: LOGIN_REQUEST.LOGIN,
        response: LOGIN_RESPONSE.INVALID_CREDENTIALS,
      });
      return;
    }

    if (!this.players.has(world)) {
      this.players.set(world, new Set());
    }

    const worldPlayers = this.players.get(world);
    if (worldPlayers && worldPlayers.has(account.account_id)) {
      // logged into this world (reconnect logic)
      socket.emit("message", {
        type: LOGIN_REQUEST.LOGIN,
        response: LOGIN_RESPONSE.LOGGED_INTO_THIS_WORLD,
      });
      return;
    }

    // Check for existing login in other worlds
    for (const [otherWorld, players] of this.players) {
      if (players.has(account.account_id) && otherWorld !== world) {
        // logged into another world
        socket.emit("message", {
          type: LOGIN_REQUEST.LOGIN,
          response: LOGIN_RESPONSE.LOGGED_INTO_ANOTHER_WORLD,
        });
        return;
      }
    }

    worldPlayers?.add(account.account_id);

    const loginToken = socket.id;
    await db
      .updateTable("accounts")
      .set({
        login_token: loginToken,
      })
      .where("username", "=", username)
      .execute();

    socket.emit("message", {
      type: LOGIN_REQUEST.LOGIN,
      response: LOGIN_RESPONSE.LOGIN_SUCCESS,
      loginToken: loginToken,
    });
  }

  start() {
    this.server.listen(LOGIN_PORT, () => {
      printInfo(`Login server listening on port ${LOGIN_PORT}`);
    });
  }

  async getAccountBySocketId(socketId: string) {
    return await db
      .selectFrom("accounts")
      .where("login_token", "=", socketId)
      .selectAll()
      .executeTakeFirst();
  }
}
