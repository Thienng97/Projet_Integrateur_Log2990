import * as http from "http";
import { inject, injectable } from "inversify";
import * as SocketIO from "socket.io";
import { ICanvasPosition } from "../../../common/communication/iGameplay";
import { Constants } from "../constants";
import { NameValidatorService } from "../services/validator/nameValidator.service";
import Types from "../types";

@injectable()
export class WebsocketManager {

    public constructor(@inject(Types.NameValidatorService) private nameValidatorService: NameValidatorService) {}

    public createWebsocket(server: http.Server): void {
        const io: SocketIO.Server = SocketIO(server);
        io.on(Constants.CONNECTION, (socket: SocketIO.Socket) => {
            let name: string;
            socket.on(Constants.LOGIN_EVENT, (data: string) => {
                name = data;
            });

            socket.on(Constants.DISCONNECT_EVENT, (data: string) => {
                this.nameValidatorService.leaveBrowser(name);
            });

            socket.on(Constants.POSITION_VALIDATION_EVENT, (data: ICanvasPosition) => {
                // recover data to make validation
            });

         });
        io.listen(Constants.WEBSOCKET_PORT_NUMBER);
    }

}
