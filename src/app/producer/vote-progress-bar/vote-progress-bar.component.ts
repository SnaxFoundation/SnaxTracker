import { Component, OnChanges, Input } from '@angular/core';

function toFixed(num, fixed) {
  const re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
  return num.toString().match(re)[0];
}

@Component({
  selector: 'app-vote-progress-bar',
  templateUrl: './vote-progress-bar.component.html',
  styleUrls: ['./vote-progress-bar.component.scss']
})
export class VoteProgressBarComponent implements OnChanges {

  @Input() chainStatus;
  chainPercentage;
  chainNumber;

  constructor() { }

  ngOnChanges() {
    if (this.chainStatus) {
      const secondsFromStart = (Date.now() - new Date(this.chainStatus.start_time).getTime()) / 1000;
      const blocksFromStart = secondsFromStart * 2;
      const blockReward = 6.2;
      const totalReward = blocksFromStart * blockReward;

      this.chainPercentage = toFixed(this.chainStatus.total_activated_stake / 10000 / (15004794732 + totalReward) * 100, 1);
      this.chainNumber = (this.chainStatus.total_activated_stake / (15004794732 + totalReward) * 100000);
    }
  }

}
