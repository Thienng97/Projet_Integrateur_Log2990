import * as chai from "chai";
import * as spies from "chai-spies";
import { ChatManagerService } from "../services/chat-manager.service";
import { TimeManagerService } from "../services/time-manager.service";
import * as Mockito from "ts-mockito";
import SocketIO = require("socket.io");
import { IPlayerInputResponse } from "../../../common/communication/iGameplay";

let chatManagerService: ChatManagerService;
let timeManagerService: TimeManagerService;
let socket: SocketIO.Socket;
let server: SocketIO.Server;
chai.use(spies);

beforeEach(() => {
    socket = Mockito.mock(SocketIO);
    server = Mockito.mock(SocketIO);
    timeManagerService = new TimeManagerService();
    chatManagerService = new ChatManagerService(timeManagerService);
});

describe("ChatManagerService Tests", () => {

    it ("should emit message of player login message", (done: Function) => {
        chatManagerService["server"] = server;
        const spy: any  = chai.spy.on(chatManagerService["server"], "emit");

        chatManagerService.sendPlayerLogStatus("test", server, true);

        chai.expect(spy).to.have.been.called();
        done();
    });

    it ("should emit message of player logout message", (done: Function) => {
        chatManagerService["server"] = server;
        const spy: any  = chai.spy.on(chatManagerService["server"], "emit");

        chatManagerService.sendPlayerLogStatus("test", server, false);

        chai.expect(spy).to.have.been.called();
        done();
    });

    it ("should emit chat message", (done: Function) => {
        chatManagerService["socket"] = socket;
        const spy: any  = chai.spy.on(chatManagerService["socket"], "emit");

        chatManagerService.sendChatMessage("data", socket);

        chai.expect(spy).to.have.been.called();
        done();
    });

    it ("should emit highscore message message", (done: Function) => {
        chatManagerService["server"] = server;
        const spy: any  = chai.spy.on(chatManagerService["server"], "emit");

        chatManagerService.sendNewHighScoreMessage(
            "username", "position", "gameName", "gameMode", server);

        chai.expect(spy).to.have.been.called();
        done();
    });

    it ("should emit message of position validation if wrong hit", (done: Function) => {

        chatManagerService["socket"] = socket;
        const spy: any  = chai.spy.on(chatManagerService["socket"], "emit");

        const test: IPlayerInputResponse = {
            status: "wrontHit",
            response: {
                differenceKey: 1,
                cluster: [{
                    color: {R: 1, G: 1, B: 1},
                    position: {x: 1, y: 1},
                }]
            },
        };
        chatManagerService.sendPositionValidationMessage(test, socket);

        chai.expect(spy).to.have.been.called();
        done();
    });

    it ("should emit message of position validation if good hit", (done: Function) => {

        chatManagerService["socket"] = socket;
        const spy: any  = chai.spy.on(chatManagerService["socket"], "emit");

        const test: IPlayerInputResponse = {
            status: "onSuccess",
            response: {
                differenceKey: 1,
                cluster: [{
                    color: {R: 1, G: 1, B: 1},
                    position: {x: 1, y: 1},
                }]
            },
        };
        chatManagerService.sendPositionValidationMessage(test, socket);

        chai.expect(spy).to.have.been.called();
        done();
    });


});