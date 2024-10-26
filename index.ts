import { startGameServer } from "./gameServer";
import "dotenv/config";
import LoginServer from "./loginServer/LoginServer";

function spinUpLoginServer() {
  const loginServer = new LoginServer();
  loginServer.start();
}

function spinUpGameServer() {
  startGameServer();
}

spinUpLoginServer();
spinUpGameServer();
