import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SnaxService } from '../../services/snax.service';
import { Result } from '../../models';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  templateUrl: './transaction.component.html',
  styleUrls: ['./transaction.component.scss']
})
export class TransactionComponent implements OnInit {

  transaction$: Observable<Result<any>>;

  constructor(
    private route: ActivatedRoute,
    private snaxService: SnaxService
  ) { }

  ngOnInit() {
    this.transaction$ = this.route.params.pipe(
      switchMap(params => this.snaxService.getTransactionRaw(+params.blockId, params.id))
    );
  }

}
