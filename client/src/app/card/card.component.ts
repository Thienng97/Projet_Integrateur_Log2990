import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-card",
  templateUrl: "./card.component.html",
  styleUrls: ["./card.component.css"],
})
export class CardComponent implements OnInit {

  public isClicked: boolean;

  public constructor() {
    // default constructor
  }

  public ngOnInit(): void {
    // default init

  }

}
