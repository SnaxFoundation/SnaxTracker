import { Component, OnInit } from "@angular/core";
import { AppService } from "../../../services/app.service";

@Component({
  selector: "app-supply",
  templateUrl: "./supply.component.html",
  styleUrls: ["./supply.component.scss"]
})
export class SupplyComponent implements OnInit {
  status$;
  snaxTokenInfo$;
  globalInfo$;
  systemBalance$;

  constructor(private appService: AppService) {}

  ngOnInit() {
    this.status$ = this.appService.info$;
    this.snaxTokenInfo$ = this.appService.getSNAXStat();
    this.globalInfo$ = this.appService.getGlobalState();
    this.systemBalance$ = this.appService.getSystemBalance();
  }
}
