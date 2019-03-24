import { AxiosInstance, AxiosResponse } from "axios";
import { inject } from "inversify";
import { Time } from "../../../../../common/communication/highscore";
import { GameMode } from "../../../../../common/communication/iCard";
import { IArenaResponse } from "../../../../../common/communication/iGameplay";
import { IUser } from "../../../../../common/communication/iUser";
import { CCommon } from "../../../../../common/constantes/cCommon";
import Types from "../../../types";
import { Mode } from "../../highscore/utilities/interfaces";
import { GameManagerService } from "../game-manager.service";
import { I2DInfos, I3DInfos, IArenaInfos, IHitConfirmation } from "./interfaces";
import { Player } from "./player";
import { Referee } from "./referee";
import { Timer } from "./timer";

// tslint:disable:no-any
const axios:          AxiosInstance = require("axios");
const CHECK_INTERVAL: number        = 500;
const MAX_TRIES:      number        = 6;

export abstract class Arena<IN_T, OUT_T, DIFF_T, EVT_T> {

    public ARENA_TYPE:              GameMode;
    public timer:                   Timer;

    private waitForRefereeInterval: NodeJS.Timeout;

    protected readonly ERROR_ON_HTTPGET:  string = "Didn't succeed to get image buffer from URL given. File: arena.ts.";
    protected readonly ON_FAILED_CLICK:   string = "onFailedClick";
    protected readonly ON_CLICK:          string = "onClick";
    protected readonly ONE_PLAYER:        number = 1;
    protected players:                    Player[];
    protected referee:                    Referee<any, any>;
    protected originalElements:           Map<number, DIFF_T>; // _TODO: A BOUGER DANS LES ARENA 2D et 3D

    public constructor (
        protected arenaInfos: IArenaInfos<I2DInfos | I3DInfos>,
        @inject(Types.GameManagerService) public gameManagerService: GameManagerService) {
            this.players = [];
            this.createPlayers();
            this.originalElements   = new Map<number, DIFF_T>();
            this.timer              = new Timer();
        }

    public sendMessage<DATA_T>(playerSocketId: string, event: string, data?: DATA_T): void {
        this.gameManagerService.sendMessage(playerSocketId, event, data);
    }

    public abstract async onPlayerClick(eventInfos: EVT_T, user: IUser): Promise<IArenaResponse<DIFF_T>>;
    public abstract async onPlayerInput(playerInput: IN_T):              Promise<IArenaResponse<DIFF_T>>;
    public abstract async validateHit(eventInfos: EVT_T):                Promise<IHitConfirmation>; // _TODO: Pour fin de tests (a enlever)
    public abstract async prepareArenaForGameplay():                     Promise<void>;
    public getPlayers(): Player[] {
        return this.players;
    }

    public getDifferencesIds(): number[] {

        const foundDifferences: number[] = this.referee.getFoundDifferences();
        const differencesIds:   number[] = [];

        this.originalElements.forEach((value: DIFF_T, key: number) => {
            if (foundDifferences.indexOf(key) < 0) {
                differencesIds.push(key);
            }
        });

        return differencesIds;
    }

    public contains(user: IUser): boolean {
        return this.players.some((player: Player) => {
            return player.getUsername() === user.username;
        });
    }

    public removePlayer(username: string): void {
        this.players = this.players.filter( (player: Player) => {
            return player.getUsername() !== username;
        });
        if (this.players.length === 0) {
            this.referee.timer.stopTimer();
            clearInterval(this.waitForRefereeInterval);
            this.referee.cancelCountdown();
            this.gameManagerService.deleteArena(this.arenaInfos);
        }
    }

    public endOfGameRoutine(time: number, winner: Player): void {
        const mode: Mode = (this.players.length === this.ONE_PLAYER) ? Mode.Singleplayer : Mode.Multiplayer;
        const newTime: Time = {
            username: winner.getUsername(),
            time: time,
        };
        this.gameManagerService.endOfGameRoutine(newTime, mode, this.arenaInfos, this.ARENA_TYPE);
    }

    public onPlayerReady(socketID: string): void {
        let nbPlayersReady: number = 0;
        this.players.forEach((player: Player) => {
            if (player.getUserSocketId() === socketID) {
                player.setPlayerState(true);
            }

            if (player.getPlayerIsReady()) {
                nbPlayersReady++;
            }
        });

        if (nbPlayersReady === this.players.length) {
            if (this.referee === undefined) {
                this.waitForReferee();
            } else {
                this.referee.onPlayersReady();
            }
        }
    }

    protected waitForReferee(): void {
        let nbOfTries: number = 0;
        this.waitForRefereeInterval = setInterval(
        () => {
            nbOfTries++;
            if (nbOfTries === MAX_TRIES && !this.referee) {
                this.cancelGame();
            }
            if (nbOfTries === MAX_TRIES || this.referee) {
                clearInterval(this.waitForRefereeInterval);
            }
            if (this.referee) {
                this.referee.onPlayersReady();
            }

        },
        CHECK_INTERVAL);
    }

    protected cancelGame(): void {
        this.players.forEach((player: Player) => {
            this.sendMessage(player.getUserSocketId(), CCommon.ON_CANCEL_GAME);
        });
        this.gameManagerService.deleteArena(this.arenaInfos);
    }

    protected async getDifferenceDataFromURL(differenceDataURL: string): Promise<Buffer> {

        return axios
            .get(differenceDataURL, {
                responseType: "arraybuffer",
            })
            .then((response: AxiosResponse) => Buffer.from(response.data, "binary"))
            .catch((error: Error) => {
                throw new TypeError(this.ERROR_ON_HTTPGET);
            });
    }

    protected createPlayers(): void {
        this.arenaInfos.users.forEach((user: IUser) => {
            this.players.push(new Player(user));
        });
    }

    protected buildArenaResponse(status: string, response?: DIFF_T): IArenaResponse<DIFF_T> {

        const arenaResponse: IArenaResponse<DIFF_T> = {
            status: status,
        };

        if (response) {
            arenaResponse.response = response;
        }

        return arenaResponse;
    }

}
