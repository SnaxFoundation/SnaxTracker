import {
  Api,
  JsonRpc,
  RpcError,
  JsSignatureProvider
} from "@snaxfoundation/snaxjs";
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";
import {
  Observable,
  from,
  forkJoin,
  of,
  defer,
  combineLatest,
  BehaviorSubject
} from "rxjs";
import { map, catchError, switchMap } from "rxjs/operators";
import { Result } from "../models";
import { LoggerService } from "./logger.service";

declare var TextDecoder: any;
declare var TextEncoder: any;

@Injectable()
export class SnaxService {
  private apiEndpointSource = new BehaviorSubject<string>(
    environment.blockchainUrl
  );
  public apiEndpoint$ = this.apiEndpointSource.asObservable();
  public snax: any;

  constructor(private http: HttpClient, private logger: LoggerService) {
    this.apiEndpoint$.subscribe(apiEndpoint => {});
    const rpc = new JsonRpc(environment.blockchainUrl, { fetch });
    const signatureProvider = new JsSignatureProvider([]);
    this.snax = new Api({
      rpc,
      signatureProvider,
      chainId: environment.chainId,
      textDecoder: new TextDecoder(),
      textEncoder: new TextEncoder()
    });
  }

  setApiEndpoint(url: string) {
    this.apiEndpointSource.next(url);
  }

  // Note: to convert chain promise to cold observable, use defer

  private getResult<T>(source$: Observable<T>): Observable<Result<T>> {
    return source$.pipe(
      map(data => {
        return {
          isError: false,
          value: data
        };
      }),
      catchError(error => {
        this.logger.error("CHAIN_ERROR", error);
        return of({
          isError: true,
          value: error
        });
      })
    );
  }

  getDeferInfo(): Observable<any> {
    return defer(() => from(this.snax.rpc.get_info({})));
  }

  getDeferBlock(id: string | number): Observable<any> {
    return defer(() => from(this.snax.rpc.get_block(id)));
  }

  getDeferAccount(name: string): Observable<any> {
    return defer(() => from(this.snax.rpc.get_account(name)));
  }

  getDeferTransaction(id: string): Observable<any> {
    return defer(() => from(this.snax.rpc.history_get_transaction(id)));
  }

  getAccountRaw(name: string): Observable<Result<any>> {
    const getAccount$ = defer(() => from(this.snax.rpc.get_account(name)));
    return this.getResult<any>(getAccount$);
  }

  getSupplyInfo(token: string): Observable<Result<any>> {
    return from(
      this.snax.rpc.get_table_rows({
        json: true,
        code: "snax.token",
        scope: token,
        table: "stat",
        limit: 1,
        table_key: ""
      })
    ).pipe(
      map((result: any) => {
        return result.rows[0];
      })
    );
  }

  getGlobalState(): Observable<Result<any>> {
    return from(
      this.snax.rpc.get_table_rows({
        json: true,
        code: "snax",
        scope: "snax",
        table: "global",
        limit: 1,
        table_key: ""
      })
    ).pipe(
      map((result: any) => {
        return result.rows[0];
      })
    );
  }

  getAccountActions(
    name: string,
    position = -1,
    offset = -20
  ): Observable<Result<any[]>> {
    const getAccountActions$ = defer(() =>
      from(
        this.snax.rpc.history_get_actions({
          account_name: name,
          pos: position,
          offset: offset
        })
      )
    );
    return this.getResult<any[]>(
      getAccountActions$.pipe(
        map((data: any) => data.actions),
        map((actions: any[]) =>
          actions.sort((a, b) => b.account_action_seq - a.account_action_seq)
        )
      )
    );
  }

  getCurrencyBalance(token: any, account: string): Observable<any> {
    return from(
      this.snax.rpc.get_currency_balance(token.account, account, token.symbol)
    ).pipe(catchError(() => of("0.0000 " + token.symbol)));
  }

  getAccountTokens(name: string): Observable<Result<any[]>> {
    const allTokens$: Observable<any[]> = this.http.get<any[]>(
      `https://raw.githubusercontent.com/snaxcafe/snax-airdrops/master/tokens.json`
    );
    const getCurrencyBalance = function(
      token: any,
      account: string
    ): Observable<any> {
      return from(
        this.snax.rpc.get_currency_balance(token.account, account, token.symbol)
      ).pipe(
        map((balance: string[]) => ({
          ...token,
          balance: balance[0] ? Number(balance[0].split(" ", 1)) : 0
        })),
        catchError(() =>
          of({
            ...token,
            balance: 0
          })
        )
      );
    };
    const accountTokens$ = allTokens$.pipe(
      switchMap(tokens => {
        return combineLatest(
          tokens.map(token => getCurrencyBalance.bind(this)(token, name))
        ).pipe(map(tokens => tokens.filter(token => token.balance > 0)));
      })
    );
    return this.getResult<any[]>(accountTokens$);
  }

  getAbi(name: string): Observable<Result<any>> {
    const getCode$ = defer(() =>
      from(
        this.snax.rpc.get_abi({
          account_name: name
        })
      )
    );
    return this.getResult<any>(getCode$);
  }

  getBlockRaw(id: string | number): Observable<Result<any>> {
    const getBlock$ = defer(() => from(this.snax.rpc.get_block(id)));
    return this.getResult<any>(getBlock$);
  }

  getTransactionRaw(blockId: number, id: string): Observable<Result<any>> {
    const getTransaction$ = defer(() =>
      from(
        this.snax.rpc.history_get_transaction({
          id: id,
          block_num_hint: blockId
        })
      )
    );
    return this.getResult<any>(getTransaction$);
  }

  getProducers() {
    return from(
      this.snax.rpc.get_table_rows({
        json: true,
        code: "snax",
        scope: "snax",
        table: "producers",
        limit: 700,
        table_key: ""
      })
    ).pipe(
      map((result: any) => {
        return result.rows
          .map(row => ({ ...row, total_votes: parseFloat(row.total_votes) }))
          .sort((a, b) => b.total_votes - a.total_votes);
      })
    );
  }

  getPlatformList() {
    return this.getGlobalState().pipe(
      map((result: any) => {
        return forkJoin(
          result.platforms.map(({ account, period, weight }) =>
            combineLatest([
              from(
                this.snax.rpc.get_table_rows({
                  json: true,
                  code: "snax",
                  scope: "snax",
                  table: "platsteps",
                  limit: 1
                })
              ),
              from(
                this.snax.rpc.get_table_rows({
                  json: true,
                  code: account,
                  scope: account,
                  table: "state",
                  limit: 1
                })
              )
            ]).pipe(
              map(([steps, result]: Array<any>) => ({
                last_scoring_time: steps[0]
                  ? new Date(steps[0].request)
                  : "Didn't score yet",
                ...result.rows[0],
                period,
                weight
              }))
            )
          )
        );
      })
    );
  }

  getChainStatus() {
    return from(
      this.snax.rpc.get_table_rows({
        json: true,
        code: "snax",
        scope: "snax",
        table: "global",
        limit: 1
      })
    ).pipe(map((result: any) => result.rows[0]));
  }
}
