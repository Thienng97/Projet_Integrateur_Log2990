import { inject } from "inversify";
import { GameMode } from "../../../../../common/communication/iCard";
import { ActionType, IArenaResponse, ISceneObjectUpdate } from "../../../../../common/communication/iGameplay";
import { ISceneObject } from "../../../../../common/communication/iSceneObject";
import { IModification, ISceneVariablesMessage, ModificationType } from "../../../../../common/communication/iSceneVariables";
import { IUser } from "../../../../../common/communication/iUser";
import Types from "../../../types";
import { GameManagerService } from "../game-manager.service";
import { Arena } from "./arena";
import { I3DInfos, IArenaInfos, IHitConfirmation, IPlayerInput } from "./interfaces";
import { Referee } from "./referee";

// tslint:disable:no-any
export class Arena3D extends Arena<IPlayerInput<number>, IArenaResponse<ISceneObjectUpdate>, ISceneObjectUpdate, number> {

    protected referee: Referee<number, ISceneObjectUpdate>;

    public constructor (
        protected arenaInfos: IArenaInfos<I3DInfos>,
        @inject(Types.GameManagerService) public gameManagerService: GameManagerService) {
            super(arenaInfos, gameManagerService);
            this.ARENA_TYPE = GameMode.free;
    }

    public sendMessage(playerSocketId: string, event: string, message: number): void {
        this.gameManagerService.sendMessage(playerSocketId, event, message);
    }

    public async onPlayerClick(objectId: number, user: IUser): Promise<IArenaResponse<ISceneObjectUpdate>> {
        const arenaResponse: IArenaResponse<ISceneObjectUpdate> = await this.referee.onPlayerClick(objectId, user);
        arenaResponse.arenaType = GameMode.free;

        return arenaResponse;
    }

    public async validateHit(objectId: number): Promise<IHitConfirmation> {
        return this.referee.validateHit(objectId);
    }

    public async onPlayerInput(playerInput: IPlayerInput<number>): Promise<IArenaResponse<ISceneObjectUpdate>> {

        let response: IArenaResponse<ISceneObjectUpdate> = this.buildArenaResponse(
            this.ON_FAILED_CLICK,
        );

        switch (playerInput.event) {
            case this.ON_CLICK:
                response = await this.onPlayerClick(playerInput.eventInfo, playerInput.user);
                break;
            default:
                break;
        }

        return response;
    }

    public async prepareArenaForGameplay(): Promise<void> {
        await this.extractModifiedSceneObjects();
        this.referee = new Referee<number, ISceneObjectUpdate>(
            this, this.players, this.originalElements, this.timer, this.arenaInfos.dataUrl.sceneData);
    }

    private async extractModifiedSceneObjects(): Promise<void> {
        const sceneData:        Buffer                  = await this.getDifferenceDataFromURL(this.arenaInfos.dataUrl.sceneData);
        const sceneDataJson:    ISceneVariablesMessage  = JSON.parse(sceneData.toString()) as ISceneVariablesMessage;

        sceneDataJson.modifications.forEach((modification: IModification) => {
            const sceneObjectUpdate: ISceneObjectUpdate = this.findObjectToUpdate(modification, sceneDataJson);
            this.originalElements.set(modification.id, sceneObjectUpdate);
        });
    }

    private findObjectToUpdate(modification: IModification, sceneVariableMessage: ISceneVariablesMessage): ISceneObjectUpdate {

        const originalSceneObjects: ISceneObject[] = sceneVariableMessage.originalScene.sceneObjects;
        const modifiedSceneObjects: ISceneObject[] = sceneVariableMessage.modifiedScene.sceneObjects;

        let sceneObjectUpdate: ISceneObjectUpdate;

        switch (modification.type) {
            case ModificationType.added:
                sceneObjectUpdate = this.buildSceneObjectUpdate(ActionType.CHANGE_COLOR, modifiedSceneObjects[modification.id]);
                break;
            case ModificationType.removed:
                sceneObjectUpdate = this.buildSceneObjectUpdate(ActionType.CHANGE_COLOR, originalSceneObjects[modification.id]);
                break;
            case ModificationType.changedColor:
                sceneObjectUpdate = this.buildSceneObjectUpdate(ActionType.CHANGE_COLOR, originalSceneObjects[modification.id]);
                break;
            default:
                sceneObjectUpdate = this.buildSceneObjectUpdate(ActionType.CHANGE_COLOR);
                break;
        }

        return sceneObjectUpdate;
    }

    private buildSceneObjectUpdate(actionType: ActionType, sceneObject?: ISceneObject): ISceneObjectUpdate {
        return {
            actionToApply:  actionType,
            sceneObject:    sceneObject,
        } as ISceneObjectUpdate;
    }
}
