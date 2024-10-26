<div align="center">

<h1>Game Engine 1</h1>

**early development**
</div>
## About the project

> I am a beginner in game development, thus everything might not be as efficient as they could.

Game Engine 1, (yet to be names), is a hobby project, to create a 2D game engine from scracth, without using any major external tools. Currently is serves as the server/game engine for my unnamed MMORPG. The engine operates on a tick-based system, updating game state and processing events every 600 milliseconds (0.6 seconds). This approach ensures smooth gameplay and synchronized interactions between players, making it ideal for online games, simulations, or any application requiring consistent time-based processing.

Other than the game engine, this repository also include Login Server

## Getting Started

1. Install virtualbox and vagrant
2. Run `vagrant up` on root folder
3. After vagrant is done setupping the vm, run `vagrant ssh`
4. Then you can start the server with `npm start`

> If you need to reinitialize the db, you can run `sudo bash initialize_local_db.sh` on vagrant root.

