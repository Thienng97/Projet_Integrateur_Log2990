import "reflect-metadata";

import { throws } from "assert";
import * as chai from "chai";
import * as spies from "chai-spies";
import * as fs from "fs";
import * as path from "path";
import SocketIO = require("socket.io");
import { mock, verify } from "ts-mockito";
import { GameMode } from "../../../../common/communication/iCard";
import { GameType, IGameRequest } from "../../../../common/communication/iGameRequest";
import { IArenaResponse, IOriginalPixelCluster, IPosition2D } from "../../../../common/communication/iGameplay";
import { IUser } from "../../../../common/communication/iUser";
import { Message } from "../../../../common/communication/message";
import { CCommon } from "../../../../common/constantes/cCommon";
// import { Constants } from "../../constants";
import { Arena2D } from "../../services/game/arena/arena2d";
import { I2DInfos, IArenaInfos, IPlayerInput } from "../../services/game/arena/interfaces";
import { GameManagerService } from "../../services/game/game-manager.service";
import { UserManagerService } from "../../services/user-manager.service";
// tslint:disable no-magic-numbers no-any await-promise
// tslint:disable-next-line:max-func-body-length

let gameManagerService: GameManagerService;
let userManagerService: UserManagerService;
const mockAdapter:  any = require("axios-mock-adapter");
const axios:        any = require("axios");
let mockAxios:      any;

const request2D: IGameRequest = {
    username:   "Frank",
    gameId:     1,
    type:       GameType.singlePlayer,
    mode:       GameMode.simple,
};

const request3D: IGameRequest = {
    username:   "Franky",
    gameId:     105,
    type:       GameType.singlePlayer,
    mode:       GameMode.free,
};

const invalidRequest: IGameRequest = {
    username:   "Frankette",
    gameId:     103,
    type:       GameType.singlePlayer,
    mode:       GameMode.invalid,
};

const iArenaInfos: IArenaInfos<I2DInfos> = {
    arenaId:            1,
    users:              [{username: "Frank", socketID: "12345"}],
    dataUrl:            {
        original:    "../../../asset/image/1_original.bmp",
        difference:  "../../../asset/image/1_modified.bmp",
    },
};

const playerInput: IPlayerInput<IPosition2D | number> = {
    event:      "onClick",
    arenaId:    1,
    user: {
        username: "Frank",
        socketID: "12345",
    },
    eventInfo: {
        x: 12,
        y: 12,
    },
};

let socket: SocketIO.Socket;
const original: Buffer = fs.readFileSync(path.resolve(__dirname, "../../asset/image/testBitmap/imagetestOg.bmp"));
const modified: Buffer = fs.readFileSync(path.resolve(__dirname, "../../asset/image/testBitmap/imagetestOg.bmp"));

beforeEach(() => {
    socket              = mock(SocketIO);
    userManagerService  = new UserManagerService();
    gameManagerService  = new GameManagerService(userManagerService);
    mockAxios           = new mockAdapter.default(axios);
});

describe("GameManagerService tests", () => {
    chai.use(spies);

    it("should add socketID in playerList", () => {

        gameManagerService.subscribeSocketID("dylan", socket);
        const result: SocketIO.Socket | undefined = gameManagerService.userList.get("dylan");
        chai.expect(result).to.be.equal(socket);
    });

    it("should add socketID in playerList", () => {

        const arena: Arena2D = new Arena2D(iArenaInfos, gameManagerService);
        gameManagerService["arenas"].set(iArenaInfos.arenaId, arena);
        const usersInArena: IUser[] = gameManagerService.getUsersInArena(iArenaInfos.arenaId);

        const isRightUsername:      boolean = usersInArena[0].username === "Frank";
        const isRightSocketId:      boolean = usersInArena[0].socketID === "12345";
        const isRightNumberOfUsers: boolean = usersInArena.length === 1;

        chai.expect(isRightSocketId && isRightUsername && isRightNumberOfUsers).to.equal(true);
    });

    it("should remove socketID in playerList", () => {

        gameManagerService.subscribeSocketID("dylan", socket);
        gameManagerService.subscribeSocketID("michelGagnon", socket);
        gameManagerService.unsubscribeSocketID("dylan", "");
        const result: SocketIO.Socket | undefined = gameManagerService.userList.get("michelGagnon");
        chai.expect(result).to.be.equal(socket);
    });

    // it("Should return buildArenaInfo successfully", async () => {
    //     const arenaInfo: IArenaInfos<I2DInfos> = {
    //         arenaId:            1000,
    //         users:              [{username: "Frank", socketID: "12345"}],
    //         dataUrl:            {
    //             original:    Constants.PATH_TO_IMAGES + "1" + CCommon.ORIGINAL_FILE,
    //             difference:  Constants.PATH_TO_IMAGES + "1" + Constants.GENERATED_FILE,
    //         },
    //     };
    //     chai.spy.on(gameManagerService, "buildArenaInfos");
    //     chai.expect(
    //         gameManagerService["buildArenaInfos"]({username: "Frank", socketID: "12345"}, 1))
    //         .to.deep.equal(arenaInfo);
    // });

    // it("Should return a success message when creating a 2D arena", async () => {
    //     userManagerService.validateName(request2D.username);

    //     mockAxios.onGet(iArenaInfos.dataUrl.original, {
    //         responseType: "arraybuffer",
    //     }).reply(200, original);

    //     mockAxios.onGet(iArenaInfos.dataUrl.difference, {
    //         responseType: "arraybuffer",
    //     }).reply(200, modified);

    //     chai.spy.on(gameManagerService, "buildArenaInfos", (returns: any) => iArenaInfos);
    //     chai.spy.on(gameManagerService, "init2DArena", () => {
    //         gameManagerService.arena.timer.stopTimer();
    //     });

    //     gameManagerService.analyseRequest(request2D).then((message: any) => {
    //         chai.expect(message.title).to.equal("onSuccess");
    //     }).catch();

    // });

    it("Should return a success message when creating a 3D arena", async () => {
        userManagerService.validateName(request3D.username);
        const message: Message = await gameManagerService.analyseRequest(request3D);
        chai.expect(message.title).to.equal("onSuccess");
    });

    it("Should return a success message when creating a 3D arena", async () => {
        userManagerService.validateName(request3D.username);
        const message: Message = await gameManagerService.analyseRequest(request3D);
        chai.expect(message.title).to.equal("onSuccess");
    });

    it("Should return an error message when loading an invalid game", async () => {
        userManagerService.validateName(invalidRequest.username);
        const message: Message = await gameManagerService.analyseRequest(invalidRequest);
        chai.expect(message.body).to.equal("Game mode invalide");
    });

    it("Should return an error message when username doesnt exist", async () => {
        const message: Message = await gameManagerService.analyseRequest(invalidRequest);
        chai.expect(message.body).to.equal("Utilisateur inexistant");
    });

    it("Should return an error message when loading an invalid game", async () => {
        const ON_ERROR_ORIGINAL_PIXEL_CLUSTER: IOriginalPixelCluster = { differenceKey: -1, cluster: [] };
        const expectedMessage: IArenaResponse<any> = {
            status:     CCommon.ON_ERROR,
            response:   ON_ERROR_ORIGINAL_PIXEL_CLUSTER,
        };
        chai.expect(await gameManagerService.onPlayerInput(playerInput)).to.deep.equal(expectedMessage);
    });

    it("Should return error if arena have been created", async () => {
        userManagerService.validateName(request2D.username);

        mockAxios.onGet(iArenaInfos.dataUrl.original, {
            responseType: "arraybuffer",
        }).reply(200, original);

        mockAxios.onGet(iArenaInfos.dataUrl.difference, {
            responseType: "arraybuffer",
        }).reply(200, modified);

        chai.spy.on(gameManagerService, "buildArenaInfos", (returns: any) => iArenaInfos);
        chai.spy.on(gameManagerService, "init2DArena", () => {
            gameManagerService["arena"].timer.stopTimer();
        });

        gameManagerService.analyseRequest(request2D).catch();

        const ON_ERROR_ORIGINAL_PIXEL_CLUSTER: IOriginalPixelCluster = { differenceKey: -1, cluster: [] };
        const expectedMessage: IArenaResponse<any> = {
            status:     CCommon.ON_ERROR,
            response:   ON_ERROR_ORIGINAL_PIXEL_CLUSTER,
        };
        chai.expect(await gameManagerService.onPlayerInput(playerInput)).to.deep.equal(expectedMessage);
    });

    // it("should remove player patate from arena", async () => {
    //     userManagerService.validateName(request2D.username);

    //     mockAxios.onGet(iArenaInfos.dataUrl.original, {
    //         responseType: "arraybuffer",
    //     }).reply(200, original);

    //     mockAxios.onGet(iArenaInfos.dataUrl.difference, {
    //         responseType: "arraybuffer",
    //     }).reply(200, modified);

    //     chai.spy.on(gameManagerService, "buildArenaInfos", (returns: any) => iArenaInfos);
    //     chai.spy.on(gameManagerService, "init2DArena", async () => {
    //         await gameManagerService["arena"].timer.stopTimer();
    //     });

    //     gameManagerService.analyseRequest(request2D).catch();
    //     gameManagerService.unsubscribeSocketID("12345", "Frank");
    //     chai.expect(gameManagerService["arena"].getPlayers().length).to.deep.equal(0);
    // });

    // it("should delete arena succesfully", async () => {
    //     userManagerService.validateName(request2D.username);
    //     mockAxios.onGet(iArenaInfos.dataUrl.original, {
    //         responseType: "arraybuffer",
    //     }).reply(200, original);

    //     mockAxios.onGet(iArenaInfos.dataUrl.difference, {
    //         responseType: "arraybuffer",
    //     }).reply(200, modified);

    //     chai.spy.on(gameManagerService, "buildArenaInfos", (returns: any) => iArenaInfos);
    //     chai.spy.on(gameManagerService, "init2DArena", () => {
    //         gameManagerService["arena"].timer.stopTimer();
    //     });

    //     const spy: any = chai.spy.on(gameManagerService["arenas"][0], "delete");

    //     gameManagerService.analyseRequest(request2D).catch();
    //     gameManagerService.deleteArena(iArenaInfos);
    //     chai.expect(spy).to.have.been.called();

    // });

    it("Should send message with socket", async () => {
        gameManagerService = new GameManagerService(userManagerService);
        gameManagerService.subscribeSocketID("socketID", socket);
        gameManagerService.sendMessage("socketID", "onEvent", 1);
        verify(socket.emit("onEvent", 1)).atLeast(0);
    });
    it("Should increment to 1 the counter linked to the gameId", () => {
        userManagerService.validateName(request2D.username);

        mockAxios.onGet(iArenaInfos.dataUrl.original, {
            responseType: "arraybuffer",
        }).reply(200, original);

        mockAxios.onGet(iArenaInfos.dataUrl.difference, {
            responseType: "arraybuffer",
        }).reply(200, modified);

        chai.spy.on(gameManagerService, "buildArenaInfos", (returns: any) => iArenaInfos);
        chai.spy.on(gameManagerService, "init2DArena", () => {
            gameManagerService["arenas[0]"].timer.stopTimer();
        });

        gameManagerService.analyseRequest(request2D).then().catch();
        chai.expect(gameManagerService["countByGameId"].get(request2D.gameId)).to.equal(1);

    });
    it("Should increment to 2 the counter linked to the gameId when adding a 2nd arena with same game id", () => {
        userManagerService.validateName(request2D.username);

        mockAxios.onGet(iArenaInfos.dataUrl.original, {
            responseType: "arraybuffer",
        }).reply(200, original);

        mockAxios.onGet(iArenaInfos.dataUrl.difference, {
            responseType: "arraybuffer",
        }).reply(200, modified);

        chai.spy.on(gameManagerService, "buildArenaInfos", (returns: any) => iArenaInfos);
        chai.spy.on(gameManagerService, "init2DArena", () => {
            gameManagerService["arenas[0]"].timer.stopTimer();
        });

        gameManagerService.analyseRequest(request2D).then().catch();
        gameManagerService.analyseRequest(request2D).then().catch();
        chai.expect(gameManagerService["countByGameId"].get(request2D.gameId)).to.equal(2);

    });
    it("Should throw an error if cannot copy the gameImages", () => {
        userManagerService.validateName(request2D.username);
        chai.spy.on(gameManagerService["assetManager"], "copyFileToTemp", () =>  throws(() => new TypeError()));

        mockAxios.onGet(iArenaInfos.dataUrl.original, {
            responseType: "arraybuffer",
        }).reply(200, original);

        mockAxios.onGet(iArenaInfos.dataUrl.difference, {
            responseType: "arraybuffer",
        }).reply(200, modified);

        chai.spy.on(gameManagerService, "buildArenaInfos", (returns: any) => iArenaInfos);
        chai.spy.on(gameManagerService, "init2DArena", () => {
            gameManagerService["arenas[0]"].timer.stopTimer();
        });
        const spy: any = chai.spy.on(gameManagerService, "tempRoutine");

        gameManagerService.analyseRequest(request2D).then().catch();
        gameManagerService.analyseRequest(request2D).then().catch();
        chai.expect(spy).to.throw();

    });
    it("should delete the temp images if we delete the last arena alive", () => {
        userManagerService.validateName(request2D.username);
        mockAxios.onGet(iArenaInfos.dataUrl.original, {
            responseType: "arraybuffer",
        }).reply(200, original);

        mockAxios.onGet(iArenaInfos.dataUrl.difference, {
            responseType: "arraybuffer",
        }).reply(200, modified);

        chai.spy.on(gameManagerService, "buildArenaInfos", (returns: any) => iArenaInfos);
        chai.spy.on(gameManagerService, "init2DArena", () => {
            gameManagerService["arenas"][0].timer.stopTimer();
        });
        const spy: any = chai.spy.on(gameManagerService["gameIdByArena"], "set");

        gameManagerService.analyseRequest(request2D).catch();
        gameManagerService["countByGameId"].set(1, 0);
        gameManagerService.deleteArena(iArenaInfos);
        chai.expect(spy).to.have.been.called();

    });
});
// tslint:disable-next-line:max-file-line-count
