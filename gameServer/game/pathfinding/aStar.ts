export class PathNode {
  x: number;
  y: number;
  g: number; // cost from start to current node
  h: number; // heuristic cost to target node
  f: number; // total cost
  parent: PathNode | null;

  constructor(x: number, y: number, parent: PathNode | null) {
    this.x = x;
    this.y = y;
    this.g = 0;
    this.h = 0;
    this.f = 0;
    this.parent = parent;
  }

  // Set the costs
  calculateCosts(target: PathNode) {
    this.h = Math.abs(this.x - target.x) + Math.abs(this.y - target.y); // Manhattan distance
    this.f = this.g + this.h;
  }
}

function adjustWorldMapToIsometric(worldMap: number[][]): number[][] {
  const adjustedWorldMap: number[][] = [];
  for (let y = 0; y < worldMap.length; y++) {
    adjustedWorldMap[y] = [];
    for (let x = 0; x < worldMap[y].length; x++) {
      adjustedWorldMap[y][x] = worldMap[x][y];
    }
  }
  return adjustedWorldMap;
}

export function aStar(
  start: { x: number; y: number },
  target: { x: number; y: number },
  worldMap: number[][],
  tileInfo: any
): PathNode[] | null {
  const adjustedWorldMap = adjustWorldMapToIsometric(worldMap);
  const openList: PathNode[] = [];
  const closedList: PathNode[] = [];
  const startPathNode = new PathNode(start.x, start.y, null);
  const targetPathNode = new PathNode(target.x, target.y, null);
  openList.push(startPathNode);

  while (openList.length > 0) {
    // Sort openList by total cost (f)
    openList.sort((a, b) => a.f - b.f);
    const currentPathNode = openList.shift()!; // Get the node with the lowest cost

    // If we've reached the target, reconstruct the path
    if (
      currentPathNode.x === targetPathNode.x &&
      currentPathNode.y === targetPathNode.y
    ) {
      const path: PathNode[] = [];
      let tempPathNode: PathNode | null = currentPathNode;
      while (tempPathNode) {
        path.push(tempPathNode);
        tempPathNode = tempPathNode.parent;
      }
      return path.reverse(); // Return the path from start to target
    }

    closedList.push(currentPathNode);

    // Get the neighbors (up, down, left, right)
    const neighbors = [
      { x: currentPathNode.x, y: currentPathNode.y - 1 }, // Up
      { x: currentPathNode.x, y: currentPathNode.y + 1 }, // Down
      { x: currentPathNode.x - 1, y: currentPathNode.y }, // Left
      { x: currentPathNode.x + 1, y: currentPathNode.y }, // Right
    ];

    for (const neighbor of neighbors) {
      // Check if it's within bounds and walkable
      if (
        neighbor.x < 0 ||
        neighbor.x >= adjustedWorldMap[0].length ||
        neighbor.y < 0 ||
        neighbor.y >= adjustedWorldMap.length
      ) {
        continue;
      }
      const tile = adjustedWorldMap[neighbor.y][neighbor.x];
      if (!tileInfo[tile]?.walkable) {
        continue;
      }

      // Create the neighbor node
      const neighborPathNode = new PathNode(
        neighbor.x,
        neighbor.y,
        currentPathNode
      );
      if (
        closedList.some(
          (node) =>
            node.x === neighborPathNode.x && node.y === neighborPathNode.y
        )
      ) {
        continue; // Already evaluated
      }

      // Calculate costs
      neighborPathNode.g = currentPathNode.g + 1; // Assume cost from current to neighbor is 1
      neighborPathNode.calculateCosts(targetPathNode);

      // Check if it's already in the open list
      const openPathNode = openList.find(
        (node) => node.x === neighborPathNode.x && node.y === neighborPathNode.y
      );
      if (!openPathNode || neighborPathNode.g < openPathNode.g) {
        if (!openPathNode) {
          openList.push(neighborPathNode); // Add to open list if not already there
        }

        if (!openPathNode) continue;
        // Update the node in the open list
        openPathNode.g = neighborPathNode.g;
        openPathNode.calculateCosts(targetPathNode);
        openPathNode.parent = currentPathNode;
      }
    }
  }

  return null; // No path found
}
