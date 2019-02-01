import { HttpClient } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, NgForm, Validators } from "@angular/forms";
import { MatDialogRef, MatSnackBar } from "@angular/material";
import { Message } from "../../../../common/communication/message";
import { Constants } from "../constants";
import { FileValidatorService } from "./game-validator.service";

@Component({
  selector: "app-create-simple-game",
  templateUrl: "./create-simple-game.component.html",
  styleUrls: ["./create-simple-game.component.css"],
})
export class CreateSimpleGameComponent implements OnInit {

  public TITLE: string = "Créer un jeu de point de vue simple";
  public PLACE_HOLDER: string = "Nom du jeu";
  public ORIGINAL_IMAGE: string = "Image originale";
  public MODIFIED_IMAGE: string = "Image modifiée";
  public SUBMIT: string = "Soumettre";
  public CANCEL: string = "Annuler";
  public MAX_LENGTH: number = 15;
  public IS_IMAGE_BMP: boolean[] = [false, false];
  public ORIGINAL_INDEX: number = 0;
  public MODIFIED_INDEX: number = 1;
  public ERROR_PATTERN: string = "Caractères autorisés: A-Z, a-z";
  public ERROR_SIZE: string = "Taille: "
                                  + Constants.MIN_GAME_LENGTH + "-"
                                  + Constants.MAX_GAME_LENGTH + " caractères";
  public ERROR_REQUIRED: string = "Nom de jeu requis";

  private selectedFiles: [Blob, Blob] = [new Blob(), new Blob()];

  public formControl: FormGroup = new FormGroup({
    gameName: new FormControl("", [
      Validators.required,
      Validators.pattern(Constants.GAME_REGEX_PATTERN),
      Validators.minLength(Constants.MIN_GAME_LENGTH),
      Validators.maxLength(Constants.MAX_GAME_LENGTH),
    ]),
  });

  public constructor(
    public dialogRef: MatDialogRef<CreateSimpleGameComponent>,
    private fileValidatorService: FileValidatorService,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    ) {
      // default constructor
    }

  public ngOnInit(): void {
    // default init
  }

  public hasFormControlErrors(): boolean {
    return !( this.formControl.controls.gameName.errors == null &&
              this.IS_IMAGE_BMP[this.ORIGINAL_INDEX] && this.IS_IMAGE_BMP[this.MODIFIED_INDEX]);
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
      this.snackBar.open(Constants.SNACK_ERROR_MSG, Constants.SNACK_ACTION, {
        duration: Constants.SNACKBAR_DURATION,
        verticalPosition: "top",
      });
    }
  }

  private createFormData(data: NgForm): FormData {
    const formdata: FormData = new FormData();
    formdata.append("name", data.value.gameName);
    formdata.append("original", this.selectedFiles[this.ORIGINAL_INDEX]);
    formdata.append("modified", this.selectedFiles[this.MODIFIED_INDEX]);

    return formdata;
  }

  public submit(data: NgForm): void {
    const formdata: FormData = this.createFormData(data);
    this.http.post(Constants.BASIC_SERVICE_BASE_URL + "/api/card/submit", formdata).subscribe((response: boolean | Message) => {
      // TBD
      console.log(response);

    });
  }
}
