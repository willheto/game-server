import { TICK_RATE } from "./config";
import World from "./game/World";

export function startGameServer() {
  const world = new World(TICK_RATE);
  world.start();
}
