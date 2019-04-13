import { Component, OnChanges, Input } from "@angular/core";

function toFixed(num, fixed) {
  const re = new RegExp("^-?\\d+(?:.\\d{0," + (fixed || -1) + "})?");
  return num.toString().match(re)[0];
}

@Component({
  selector: "app-vote-progress-bar",
  templateUrl: "./vote-progress-bar.component.html",
  styleUrls: ["./vote-progress-bar.component.scss"]
})
export class VoteProgressBarComponent implements OnChanges {
  @Input() chainStatus;
  @Input() supplyInfo;
  chainPercentage;
  chainNumber;

  constructor() {}

  ngOnChanges() {
    if (this.chainStatus && this.supplyInfo) {
      const supply = parseFloat(this.supplyInfo.supply);
      const totalActivatedStake =
        this.chainStatus.total_activated_stake / 10000;

      this.chainPercentage = toFixed((totalActivatedStake / supply) * 100, 1);

      this.chainNumber = this.chainStatus.total_activated_stake;
    }
  }
}
