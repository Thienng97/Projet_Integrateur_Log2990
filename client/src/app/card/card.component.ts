import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatSnackBar } from "@angular/material";
import { Router } from "@angular/router";
import { ICard } from "../../../../common/communication/iCard";
import { Constants } from "../constants";
import { GameModeService } from "../game-list-container/game-mode.service";
import { HighscoreService } from "../highscore-display/highscore.service";
import { CardManagerService } from "./card-manager.service";

@Component({
  selector: "app-card",
  templateUrl: "./card.component.html",
  styleUrls: ["./card.component.css"],
  providers: [HighscoreService],
})

export class CardComponent {
  public hsButtonIsClicked: boolean;
  public readonly TROPHY_IMAGE_URL: string = "https://img.icons8.com/metro/1600/trophy.png";
  public readonly TEXT_PLAY: string = "JOUER";
  public readonly TEXT_PLAY_SINGLE: string = "Jouer en simple";
  public readonly TEXT_PLAY_MULTI: string = "Jouer en multijoueur";
  public readonly TEXT_RESET_TIMERS: string = "Réinitialiser les temps";
  public readonly TEXT_DELETE: string = "Supprimer la carte";
  public readonly ADMIN_PATH: string = "/admin";
  public readonly GAME_VIEW_PATH: string = "/game-view";

  @Input() public card: ICard;

  public constructor(
    public router: Router,
    public gameModeService: GameModeService,
    public cardManagerService: CardManagerService,
    private snackBar: MatSnackBar,
    private highscoreService: HighscoreService,
    ) {
      // default constructor
    }

  @Output() public cardDeleted: EventEmitter<string> = new EventEmitter();

  public onDeleteButtonClick(): void {
    this.cardManagerService.removeCard(this.card.gameID, this.card.gamemode).subscribe((response: string) => {
      this.openSnackbar(response);
      this.cardDeleted.emit();
    });
  }

  public onResetButtonClick(): void {
    this.highscoreService.resetHighscore(this.card.gameID);
  }

  private openSnackbar(response: string): void {
    this.snackBar.open( response, Constants.SNACK_ACTION, {
      duration: Constants.SNACKBAR_DURATION,
      verticalPosition: "top",
      panelClass: ["green-snackbar"],
    });
  }

  public onHSButtonClick(): void {
    this.hsButtonIsClicked = !this.hsButtonIsClicked;
    this.highscoreService.getHighscore(this.card.gameID);
  }
}
