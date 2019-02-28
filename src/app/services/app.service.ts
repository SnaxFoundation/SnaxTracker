import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { SnaxService } from "./snax.service";
import { Observable, Subject, timer, from, forkJoin, of } from "rxjs";
import {
  map,
  filter,
  share,
  withLatestFrom,
  switchMap,
  catchError,
  take
} from "rxjs/operators";
import { Result } from "../models";

const SNAX_QUOTE = 60000;
const RAM_QUOTE = 60000;
const GET_INFO_INTERVAL = 5000;

@Injectable({
  providedIn: "root"
})
export class AppService {
  private latestBlockNumberSource = new Subject<number>();

  latestBlockNumber$ = this.latestBlockNumberSource.asObservable();
  isMaintenance$: Observable<boolean>;
  snaxQuote$: Observable<any>;
  ramQuote$: Observable<any>;
  info$: Observable<any>;
  latestBlock$: Observable<any>;
  recentBlocks$: Observable<any[]>;
  recentTransactions$: Observable<any[]>;

  constructor(private http: HttpClient, private snaxService: SnaxService) {
    this.info$ = timer(0, GET_INFO_INTERVAL).pipe(
      switchMap(() => this.snaxService.getDeferInfo()),
      share()
    );
    this.latestBlock$ = this.info$.pipe(
      switchMap((info: any) =>
        from(this.snaxService.getDeferBlock(info.head_block_num))
      ),
      share()
    );
    this.recentBlocks$ = this.latestBlock$.pipe(
      switchMap((block: any) => {
        const blockNumber: number = block.block_num;
        const blockNumbers: number[] = [
          blockNumber - 1,
          blockNumber - 2,
          blockNumber - 3,
          blockNumber - 4
        ];
        const blockNumbers$: Observable<any>[] = blockNumbers.map(blockNum =>
          this.snaxService
            .getDeferBlock(blockNum)
            .pipe(catchError(() => of(null)))
        );
        return forkJoin(blockNumbers$).pipe(
          map(blocks => [block, ...blocks].filter(block => block !== null))
        );
      }),
      share()
    );
    this.recentTransactions$ = this.recentBlocks$.pipe(
      map((blocks: any[]) => {
        return blocks.reduce((previous, current) => {
          const transactions = current.transactions.map(transaction => {
            return {
              ...transaction,
              block_num: current.block_num,
              trx:
                typeof transaction.trx === "string"
                  ? { id: transaction.trx }
                  : transaction.trx
            };
          });
          return previous.concat(transactions);
        }, []);
      }),
      share()
    );
    this.isMaintenance$ = this.info$.pipe(
      withLatestFrom(this.latestBlockNumber$),
      map(([chainStatus, blockNumber]) => {
        return chainStatus.head_block_num - blockNumber > 600;
      }),
      share()
    );
    this.snaxQuote$ = timer(0, SNAX_QUOTE).pipe(
      switchMap(() => this.getSNAXTicker()),
      filter(ticker => !!ticker.data),
      map(ticker => ticker.data),
      share()
    );
    this.ramQuote$ = timer(0, RAM_QUOTE).pipe(
      switchMap(() =>
        from(
          this.snaxService.snax.getTableRows({
            json: true,
            code: "snax",
            scope: "snax",
            table: "rammarket"
          })
        )
      ),
      filter((data: any) => data.rows && data.rows.length),
      map(data => data.rows[0]),
      map(data => {
        const base = Number(data.base.balance.replace("RAM", ""));
        const quote = Number(data.quote.balance.replace("SNAX", ""));
        return {
          ...data,
          price: quote / base
        };
      }),
      share()
    );
  }

  getBlocks(blockNumber?: number, limit = 10): Observable<any[]> {
    let blockNumber$: Observable<number>;
    if (blockNumber) {
      blockNumber$ = of(blockNumber);
    } else {
      blockNumber$ = this.info$.pipe(
        take(1),
        map(info => info.head_block_num)
      );
    }
    return blockNumber$.pipe(
      switchMap(blockNumber => {
        let blockNumbers: number[] = [];
        for (let i = blockNumber; i > blockNumber - limit && i > 0; i--) {
          blockNumbers.push(i);
        }
        const blockNumbers$: Observable<any>[] = blockNumbers.map(
          blockNumber => {
            return this.snaxService
              .getDeferBlock(blockNumber)
              .pipe(catchError(() => of(null)));
          }
        );
        return forkJoin(blockNumbers$).pipe(
          map(blocks => blocks.filter(block => block !== null))
        );
      })
    );
  }

  getGlobalState(): Observable<Result<any>> {
    return this.snaxService.getGlobalState();
  }

  getTeamEscrow(): Observable<Result<any>> {
    return this.snaxService.getEscrowBalance("snax.team");
  }

  getSNAXStat(): Observable<Result<any>> {
    return this.snaxService.getSupplyInfo("SNAX");
  }

  getCirculatingSupply(): Observable<Result<any>> {
    return this.snaxService.getCirculatingSupply();
  }

  getSystemBalance(): Observable<Result<any>> {
    return this.snaxService.getCurrencyBalance(
      {
        account: "snax.token",
        symbol: "SNAX"
      },
      "snax"
    );
  }

  getTokens(): Observable<any[]> {
    return this.http.get<any[]>(
      `https://raw.githubusercontent.com/snaxcafe/snax-airdrops/master/tokens.json`
    );
  }

  getPlatformList() {
    return this.snaxService.getPlatformList();
  }

  getSNAXTicker(): Observable<CMCTicker> {
    return this.http.get<CMCTicker>(
      "https://api.coinmarketcap.com/v2/ticker/1765/"
    );
  }

  getBpJson(url: string): Observable<any> {
    return this.http.get<any>(`${url}/bp.json`);
  }

  setLatestBlockNumber(blockNumber: number) {
    if (blockNumber) {
      this.latestBlockNumberSource.next(blockNumber);
    }
  }
}

export interface CMCTicker {
  data?: {
    name: string;
    symbol: string;
    quotes: {
      USD: {
        price: number;
        market_cap: number;
        volume_24h: number;
      };
    };
  };
  metadata?: any;
}
