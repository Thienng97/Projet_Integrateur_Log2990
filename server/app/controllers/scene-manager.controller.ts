import { NextFunction, Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { ISceneObject } from "../../../common/communication/iSceneObject";
import { ISceneData } from "../../../common/communication/iSceneVariables";
import { SceneManager } from "../services/scene/scene-manager.service";
import Types from "../types";

@injectable()
export class SceneManagerController {

    public constructor(@inject(Types.SceneManager) private sceneManager: SceneManager) {}

    public get router(): Router {
        const router: Router = Router();

        router.post("/generator", async (req: Request, res: Response, next: NextFunction) => {
            const resultGenerator: ISceneData<ISceneObject> | string = this.sceneManager.createScene(req.body);
            res.json(resultGenerator);
        });

        return router;
    }
}
