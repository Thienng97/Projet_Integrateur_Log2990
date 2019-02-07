import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { TestingImportsModule } from "../testing-imports/testing-imports.module";
import { CreateFreeGameComponent } from "./create-free-game.component";

describe("CreateFreeGameComponent", () => {
  let component: CreateFreeGameComponent;
  let fixture: ComponentFixture<CreateFreeGameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateFreeGameComponent ],
      imports: [TestingImportsModule],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateFreeGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
