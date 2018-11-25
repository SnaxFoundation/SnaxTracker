import { Component, OnInit } from '@angular/core';
import { AppService } from '../../../services/app.service';

@Component({
  selector: 'app-supply',
  templateUrl: './supply.component.html',
  styleUrls: ['./supply.component.scss'],
})
export class SupplyComponent implements OnInit {
  status$;

  constructor(private appService: AppService) {}

  ngOnInit() {
    this.status$ = this.appService.info$;
  }
}
