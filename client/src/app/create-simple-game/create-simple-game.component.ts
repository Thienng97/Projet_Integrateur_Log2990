import { HttpClient } from "@angular/common/http";
import { Component } from "@angular/core";
import { FormControl, FormGroup, NgForm, Validators } from "@angular/forms";
import { MatDialogRef, MatSnackBar } from "@angular/material";
import { Message } from "../../../../common/communication/message";
import { CardManagerService } from "../card/card-manager.service";
import { Constants } from "../constants";
import { FileValidatorService } from "./game-validator.service";

@Component({
  selector: "app-create-simple-game",
  templateUrl: "./create-simple-game.component.html",
  styleUrls: ["./create-simple-game.component.css"],
})
export class CreateSimpleGameComponent {

  public readonly TITLE: string = "Créer un jeu de point de vue simple";
  public readonly INVALID_NAME: string = "Nom invalide";
  public readonly PLACE_HOLDER: string = "Nom du jeu";
  public readonly ORIGINAL_IMAGE: string = "Image originale";
  public readonly MODIFIED_IMAGE: string = "Image modifiée";
  public readonly SUBMIT: string = "Soumettre";
  public readonly CANCEL: string = "Annuler";
  public readonly MAX_LENGTH: number = 15;
  public readonly IS_IMAGE_BMP: boolean[] = [false, false];
  public readonly ORIGINAL_INDEX: number = 0;
  public readonly MODIFIED_INDEX: number = 1;
  public readonly ERROR_PATTERN: string = "Caractères autorisés: A-Z, a-z";
  public readonly ERROR_SIZE: string = "Taille: "
                                  + Constants.MIN_GAME_LENGTH + "-"
                                  + Constants.MAX_GAME_LENGTH + " caractères";
  public readonly ERROR_REQUIRED: string = "Nom de jeu requis";

  public formControl: FormGroup;
  private selectedFiles: [Blob, Blob];
  public isButtonEnabled: boolean;

  public constructor(
    private dialogRef: MatDialogRef<CreateSimpleGameComponent>,
    private fileValidatorService: FileValidatorService,
    private snackBar: MatSnackBar,
    private httpClient: HttpClient,
    private cardManagerService: CardManagerService,
    ) {
      this.isButtonEnabled = true;
      this.selectedFiles = [new Blob(), new Blob()];
      this.initFormControl();
    }

  private initFormControl(): void {
    this.formControl = new FormGroup({
      gameName: new FormControl("", [
        Validators.required,
        Validators.pattern(Constants.GAME_REGEX_PATTERN),
        Validators.minLength(Constants.MIN_GAME_LENGTH),
        Validators.maxLength(Constants.MAX_GAME_LENGTH),
      ]),
    });
  }

  public hasNameControlErrors(): boolean {
    return this.formControl.controls.gameName.errors == null || this.formControl.controls.gameName.pristine;
  }

  public hasFormControlErrors(): boolean {
    const hasErrorForm: Boolean = this.formControl.controls.gameName.errors == null;
    const isImageBmp: Boolean = this.IS_IMAGE_BMP[this.ORIGINAL_INDEX] && this.IS_IMAGE_BMP[this.MODIFIED_INDEX];

    return !(hasErrorForm && isImageBmp && this.isButtonEnabled);
  }

  public hasErrorOfType(errorType: string): boolean {
    return this.formControl.hasError(errorType);
  }

  public closeDialog(): void {
    this.dialogRef.close();
  }

  public onFileSelected(file: Blob, imageIndex: number): void {
    if (this.fileValidatorService.validateFile(file)) {
      this.selectedFiles[imageIndex] = file;
      this.IS_IMAGE_BMP[imageIndex] = true;
    } else {
      this.IS_IMAGE_BMP[imageIndex] = false;
      this.openSnackBar(Constants.SNACK_ERROR_MSG, Constants.SNACK_ACTION);
    }
  }

  private capitalizeFirstLetter(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

  private createFormData(data: NgForm): FormData {
    const formdata: FormData = new FormData();
    formdata.append(Constants.NAME_KEY, this.capitalizeFirstLetter(data.value.gameName));
    formdata.append(Constants.ORIGINAL_IMAGE_KEY, this.selectedFiles[this.ORIGINAL_INDEX]);
    formdata.append(Constants.MODIFIED_IMAGE_KEY, this.selectedFiles[this.MODIFIED_INDEX]);

    return formdata;
  }

  public submit(data: NgForm): void {
    this.isButtonEnabled = false;
    const formdata: FormData = this.createFormData(data);
    this.httpClient.post(Constants.SIMPLE_SUBMIT_PATH, formdata).subscribe((response: Message) => {
      this.analyseResponse(response);
      this.isButtonEnabled = true;
    });
  }

  private analyseResponse(response: Message): void {
    if (response.title === Constants.ON_SUCCESS_MESSAGE) {
      this.cardManagerService.updateCards(true);
      this.dialogRef.close();
    } else if (response.title === Constants.ON_ERROR_MESSAGE) {
      this.openSnackBar(response.body, Constants.SNACK_ACTION);
    }
  }

  private openSnackBar(msg: string, action: string): void {
    this.snackBar.open(msg, action, {
      duration: Constants.SNACKBAR_DURATION,
      verticalPosition: "top",
    });
  }
}
