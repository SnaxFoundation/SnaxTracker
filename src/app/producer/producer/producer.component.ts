import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Observable, combineLatest, of } from "rxjs";
import { map, switchMap, share, catchError } from "rxjs/operators";
import { SnaxService } from "../../services/snax.service";
import { AppService } from "../../services/app.service";

@Component({
  templateUrl: "./producer.component.html",
  styleUrls: ["./producer.component.scss"]
})
export class ProducerComponent implements OnInit {
  name$: Observable<string>;
  producer$: Observable<any>;

  constructor(
    private route: ActivatedRoute,
    private snaxService: SnaxService,
    private appService: AppService
  ) {}

  ngOnInit() {
    this.name$ = this.route.params.pipe(map(params => params.id));
    this.producer$ = combineLatest(
      this.name$,
      this.snaxService.getChainStatus(),
      this.snaxService.getProducers(),
      this.name$.pipe(switchMap(name => this.snaxService.getDeferAccount(name)))
    ).pipe(
      map(([name, chainStatus, producers, account]) => {
        const producer = producers.find(producer => producer.owner === name);
        const index = producers.findIndex(producer => producer.owner === name);
        const votesToRemove = producers.reduce((acc, cur) => {
          const percentageVotes =
            (cur.total_votes / chainStatus.total_producer_vote_weight) * 100;
          if (percentageVotes * 200 < 100) {
            acc += parseFloat(cur.total_votes);
          }
          return acc;
        }, 0);

        const blockReward = 6.2;
        const dailyBlocks = 24 * 3600 * 2;

        let position = parseInt(index) + 1;
        let reward = 0;

        let percentageVotes =
          (producer.total_votes / chainStatus.total_producer_vote_weight) * 100;

        let percentageVotesRewarded =
          (producer.total_votes /
            (chainStatus.total_producer_vote_weight - votesToRemove)) *
          100;

        reward += percentageVotesRewarded * blockReward * dailyBlocks / 100;

        return {
          ...producer,
          account: account,
          position: position,
          reward: reward.toFixed(0),
          votes: percentageVotes.toFixed(2)
        };
      }),
      switchMap(producer => {
        if (!producer.url) {
          return of(producer);
        } else {
          return this.appService.getBpJson(producer.url).pipe(
            catchError(() => of(null)),
            map(bpJson => ({
              ...producer,
              bpJson,
              location:
                bpJson &&
                bpJson.nodes &&
                bpJson.nodes[0] &&
                bpJson.nodes[0].location,
              validated:
                bpJson &&
                bpJson.producer_public_key === producer.producer_key &&
                bpJson.producer_account_name === producer.owner
            }))
          );
        }
      }),
      share()
    );
  }
}
