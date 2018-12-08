import { Component, OnInit } from "@angular/core";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import { Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import { AppService } from "../../../services/app.service";

@Component({
  selector: "app-platforms",
  templateUrl: "./platforms.component.html",
  styleUrls: ["./platforms.component.scss"]
})
export class PlatformsComponent implements OnInit {
  columnHeaders$: Observable<string[]> = of(DEFAULT_HEADERS);
  platforms$;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private appService: AppService
  ) {}

  ngOnInit() {
    this.columnHeaders$ = this.breakpointObserver
      .observe(Breakpoints.XSmall)
      .pipe(map(result => (result.matches ? XSMALL_HEADERS : DEFAULT_HEADERS)));
    this.platforms$ = this.appService.getPlatformList();
  }
}

const DEFAULT_HEADERS = [
  "platform_name",
  "platform_account",
  "supply_share",
  "scoring_round_time",
  "users_count",
  "emission_total",
  "sr_time_last"
];

const XSMALL_HEADERS = ["platform_name", "supply_share"];
