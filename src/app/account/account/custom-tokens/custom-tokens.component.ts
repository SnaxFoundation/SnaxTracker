import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material';
import { AppService } from '../../../services/app.service';
import { SnaxService } from '../../../services/snax.service';
import { from } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-custom-tokens',
  templateUrl: './custom-tokens.component.html',
  styleUrls: ['./custom-tokens.component.scss']
})
export class CustomTokensComponent implements OnInit {

  tokenForm = new FormGroup({
    account: new FormControl(''),
    symbol: new FormControl('')
  });
  allTokens$;
  token$;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: any,
    private appService: AppService,
    private snaxService: SnaxService
  ) { }

  ngOnInit() {
    this.allTokens$ = this.appService.getTokens();
  }

  submit() {
    const token = this.tokenForm.value;
    this.token$ = from(this.snaxService.snax.getCurrencyBalance(token.account, this.data.account, token.symbol)).pipe(
      filter((balance: string[]) => balance && balance.length > 0),
      map(balance => balance[0])
    );
  }

}
