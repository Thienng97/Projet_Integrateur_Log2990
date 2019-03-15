import { inject, injectable } from "inversify";
import { GameMode } from "../../../../common/communication/iCard";
import { GameType, IGameRequest } from "../../../../common/communication/iGameRequest";
import { IArenaResponse, IOriginalPixelCluster, IPosition2D } from "../../../../common/communication/iGameplay";
import { IUser } from "../../../../common/communication/iUser";
import { Message } from "../../../../common/communication/message";
import { CCommon } from "../../../../common/constantes/cCommon";
import { Constants } from "../../constants";
import Types from "../../types";
import { AssetManagerService } from "../asset-manager.service";
import { UserManagerService } from "../user-manager.service";
import { Arena } from "./arena/arena";
import { Arena2D } from "./arena/arena2d";
import { Arena3D } from "./arena/arena3d";
import { I2DInfos, I3DInfos, IArenaInfos, IPlayerInput } from "./arena/interfaces";
import { Player } from "./arena/player";

const REQUEST_ERROR_MESSAGE:            string = "Game mode invalide";
const TEMP_ROUTINE_ERROR:               string = "error while copying to temp";
const ARENA_START_ID:                   number = 1000;
const ON_ERROR_ORIGINAL_PIXEL_CLUSTER:  IOriginalPixelCluster = { differenceKey: -1, cluster: [] };

// _TODO: Enlever les any après les avoir remplacés
// tslint:disable:no-any
@injectable()
export class GameManagerService {

    private arenaID:            number;
    private assetManager:       AssetManagerService;
    private playerList:         Map<string, SocketIO.Socket>;
    private arenas:             Map<number, Arena<any, any, any, any>>;
    private gameIdByArenaId:    Map<number, number>;
    private countByGameId:      Map<number, number>;
    private lobby:              Map<number, IUser[]>;

    public constructor(@inject(Types.UserManagerService) private userManagerService: UserManagerService) {
        this.arenaID            = ARENA_START_ID;
        this.assetManager       = new AssetManagerService();
        this.playerList         = new Map<string, SocketIO.Socket>();
        this.arenas             = new Map<number, Arena<any, any, any, any>>();
        this.countByGameId      = new Map<number, number>();
        this.gameIdByArenaId    = new Map<number, number>();
        this.lobby              = new Map<number, IUser[]>();
    }

    public async analyseRequest(request: IGameRequest): Promise<Message> {
        const user: IUser | string = this.userManagerService.getUserByUsername(request.username);

        if (typeof user === "string") {
            return this.returnError(Constants.USER_NOT_FOUND);
        } else {
            switch (request.mode) {
                case GameMode.simple:
                    if (request.type === GameType.multiPlayer) {
                        return this.verifyLobby(request, user);
                    }

                    return this.create2DArena([user], request.gameId);
                case GameMode.free:
                    if (request.type === GameType.multiPlayer) {
                        return this.verifyLobby(request, user);
                    }

                    return this.create3DArena([user], request.gameId);
                default:
                    return this.returnError(REQUEST_ERROR_MESSAGE);
            }
        }
    }

    private returnError(errorMessage: string): Message {
        return {
            title:  CCommon.ON_ERROR,
            body:   errorMessage,
        };
    }

    public cancelRequest(gameID: number): Message {
        if (this.lobby.delete(gameID)) {
            return this.generateMessage(CCommon.ON_SUCCESS, gameID.toString());
        }

        return this.generateMessage(CCommon.ON_ERROR, gameID.toString());
    }

    private async verifyLobby(request: IGameRequest, user: IUser): Promise<Message> {
        const lobby: IUser[] | undefined = this.lobby.get(request.gameId);

        if (lobby === undefined) {
            this.lobby.set(request.gameId.valueOf(), [user]);

            return this.generateMessage(CCommon.ON_WAITING, CCommon.ON_WAITING);
        } else {
            let message: Message;
            lobby.push(user);
            switch (request.mode) {
                case GameMode.simple:
                    message = await this.create2DArena(lobby, request.gameId);
                    break;
                case GameMode.free:
                    message = await this.create3DArena(lobby, request.gameId);
                    break;
                default:
                    return this.generateMessage(CCommon.ON_MODE_INVALID, CCommon.ON_MODE_INVALID);
            }
            this.sendMessage(lobby[0].socketID, CCommon.ON_ARENA_CONNECT, Number(message.body));
            this.lobby.delete(request.gameId);

            return message;
        }
    }

    private generateMessage(title: string, body: string): Message {
        return {
            title: title,
            body: body,
        };
    }

    private async create2DArena(users: IUser[], gameId: number): Promise<Message> {
        const arenaInfo: IArenaInfos<I2DInfos> = this.buildArena2DInfos(users, gameId);
        const arena: Arena2D = new Arena2D(arenaInfo, this);
        this.tempRoutine2d(gameId);
        this.manageCounter(gameId);
        this.gameIdByArenaId.set(arenaInfo.arenaId, gameId);
        this.initArena(arena).catch(() => Constants.INIT_ARENA_ERROR);
        this.arenas.set(arenaInfo.arenaId, arena);

        return {
            title:  CCommon.ON_SUCCESS,
            body:   arenaInfo.arenaId.toString(),
        };
    }

    private async initArena(arena: Arena<any, any, any, any>): Promise<void> {
        await arena.prepareArenaForGameplay();
    }

    public getDifferencesIndex(arenaId: number): number[] {
        const arena: Arena<any, any, any, any> | undefined = this.arenas.get(arenaId);

        return arena ? arena.getDifferencesIds() : [];
    }

    private tempRoutine2d(gameId: number): void {
        const pathOriginal:  string = Constants.IMAGES_PATH + "/" + gameId + CCommon.ORIGINAL_FILE;
        const pathGenerated: string = Constants.IMAGES_PATH + "/" + gameId + Constants.GENERATED_FILE;
        try {
            this.assetManager.copyFileToTemp(pathGenerated, gameId, Constants.GENERATED_FILE);
            this.assetManager.copyFileToTemp(pathOriginal, gameId, CCommon.ORIGINAL_FILE);
        } catch (error) {
            throw new TypeError(TEMP_ROUTINE_ERROR);
        }
    }

    private tempRoutine3d(gameId: number): void {
        const path: string = Constants.SCENE_PATH + "/" + gameId + CCommon.SCENE_FILE;
        try {
            this.assetManager.copyFileToTemp(path, gameId, CCommon.SCENE_FILE);
        } catch (error) {
            throw new TypeError(TEMP_ROUTINE_ERROR);
        }
    }
    private manageCounter(gameId: number): void {
        const aliveArenaCount: number | undefined =  this.countByGameId.get(gameId);
        if (aliveArenaCount !== undefined) {
            this.countByGameId.set(gameId, aliveArenaCount + 1);
        } else {
            this.countByGameId.set(gameId, 1);
        }
    }

    private buildArena2DInfos(users: IUser[], gameId: number): IArenaInfos<I2DInfos> {
        return {
            arenaId:            this.generateArenaID(),
            users:              users,
            dataUrl: {
                original:   Constants.PATH_SERVER_TEMP + gameId + CCommon.ORIGINAL_FILE,
                difference: Constants.PATH_SERVER_TEMP + gameId + Constants.GENERATED_FILE,
            },
        };
    }

    private buildArena3DInfos(users: IUser[], gameId: number): IArenaInfos<I3DInfos> {
        return {
            arenaId:            this.generateArenaID(),
            users:              users,
            dataUrl:  {
                sceneData:  Constants.PATH_SERVER_TEMP + gameId + CCommon.SCENE_FILE,
            },
        };
    }

    private async create3DArena(users: IUser[], gameId: number): Promise<Message> {
        const arenaInfo: IArenaInfos<I3DInfos> = this.buildArena3DInfos(users, gameId);
        const arena: Arena3D = new Arena3D(arenaInfo, this);
        this.tempRoutine3d(gameId);
        this.manageCounter(gameId);
        this.gameIdByArenaId.set(arenaInfo.arenaId, gameId);
        this.initArena(arena).catch(() => Constants.INIT_ARENA_ERROR);
        this.arenas.set(arenaInfo.arenaId, arena);

        return {
            title:  CCommon.ON_SUCCESS,
            body:   arenaInfo.arenaId.toString(),
        };
    }

    private generateArenaID(): number {
        return this.arenaID++;
    }

    public subscribeSocketID(socketID: string, socket: SocketIO.Socket): void {
        this.playerList.set(socketID, socket);
    }

    public unsubscribeSocketID(socketID: string, username: string): void {
        this.playerList.delete(socketID);
        this.removePlayerFromArena(username);
    }

    private removePlayerFromArena(username: string): void {
        this.arenas.forEach((arena: Arena<any, any, any, any>) => {
            arena.getPlayers().forEach((player: Player) => {
                if (player.username === username) {
                    arena.removePlayer(username);
                }
            });
        });
    }

    public deleteArena(arena: IArenaInfos<I2DInfos | I3DInfos>): void {
        const arenaId:  number              = arena.arenaId;
        const gameId:   number | undefined  = this.gameIdByArenaId.get(arenaId);
        if (gameId === undefined) {
            return;
        }
        const aliveArenaCount: number | undefined = this.countByGameId.get(gameId);

        if (aliveArenaCount === undefined) {
            return;
        }
        if (aliveArenaCount === 1) {
            if ("original" in arena.dataUrl) {
                this.assetManager.deleteFileInTemp(gameId, Constants.GENERATED_FILE);
                this.assetManager.deleteFileInTemp(gameId, CCommon.ORIGINAL_FILE);
            } else {
                this.assetManager.deleteFileInTemp(gameId, CCommon.SCENE_FILE);
            }
        }
        this.countByGameId.set(gameId, aliveArenaCount - 1);

        this.arenas.delete(arena.arenaId);
    }

    public get userList(): Map<string, SocketIO.Socket> {
        return this.playerList;
    }

    public sendMessage(socketID: string, messageType: string, message: number): void {
        const playerSocket: SocketIO.Socket | undefined = this.playerList.get(socketID);
        if (playerSocket !== undefined) {
            playerSocket.emit(messageType, message);
        }
    }

    public async onPlayerInput(playerInput: IPlayerInput<IPosition2D | number>):
        Promise<IArenaResponse<IOriginalPixelCluster | any>>  {
        const arena: Arena<any, any, any, any> | undefined = this.arenas.get(playerInput.arenaId);
        if (arena !== undefined) {
            if (arena.contains(playerInput.user)) {
                return  arena.onPlayerInput(playerInput);
            }
        }

        return {
            status:     CCommon.ON_ERROR,
            response:   ON_ERROR_ORIGINAL_PIXEL_CLUSTER,
        };
    }

    public getUsersInArena(arenaId: number): IUser[] {
        const users: IUser[] = [];
        const arena: Arena<any, any, any, any> | undefined  = this.arenas.get(arenaId);

        if (arena) {
            const players: Player[] = arena.getPlayers();

            players.forEach(( player: Player) => {
                const user: IUser = {
                    username: player.username,
                    socketID: player.userSocketId,
                };
                users.push(user);
            });
        }

        return users;
    }
    // _TODO: OTER CA APRES REFACTOR
// tslint:disable-next-line:max-file-line-count
}
