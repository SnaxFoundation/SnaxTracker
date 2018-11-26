import { Component, OnInit } from '@angular/core';
import { from } from 'rxjs';
import { SnaxService } from '../../services/snax.service';

@Component({
  selector: 'app-console',
  templateUrl: './console.component.html',
  styleUrls: ['./console.component.scss']
})
export class ConsoleComponent implements OnInit {

  apiEndpoint$;
  result$;

  constructor(
    private snaxService: SnaxService
  ) { }

  ngOnInit() {
    this.apiEndpoint$ = this.snaxService.apiEndpoint$;
  }

  getInfo() {
    this.result$ = from(this.snaxService.snax.getInfo({}));
  }

  getBlock(block_num_or_id: number) {
    this.result$ = from(this.snaxService.snax.getBlock(block_num_or_id));
  }

}
