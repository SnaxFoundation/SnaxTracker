import {Injectable} from '@angular/core';
import * as Snax from '@snaxfoundation/snaxjs';
import {LocalStorage} from 'ngx-webstorage';

@Injectable()
export class ScatterService {
  @LocalStorage()
  identity: any;
  snax: any;
  scatter: any;
  network: any;

  load() {
    this.scatter = (<any>window).scatter;

    this.network = {
      blockchain: 'snax',
      host: 'api1.snaxdublin.io',
      port: 443,
      chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'
    };
    if (this.scatter) {
      this.snax = this.scatter.snax(this.network, Snax, {chainId: this.network.chainId}, 'https');
    }

  }

  login() {
    this.load();
    const requirements = {accounts: [this.network]};
    if (!this.scatter) {
      alert("You need to install Scatter to use the form.");
      return;
    }
    return this.scatter.getIdentity(requirements);
  }

  logout() {
    this.scatter.forgetIdentity();
  }

  isLoggedIn() {
    return this.scatter && !!this.scatter.identity;
  }

  accountName() {
    if (!this.scatter || !this.scatter.identity) {
      return;
    }
    const account = this.scatter.identity.accounts.find(acc => acc.blockchain === 'snax');
    return account.name;
  }

  support(amount: string) {
    this.load();
    const account = this.scatter.identity.accounts.find(acc => acc.blockchain === 'snax');
    return this.snax.transfer(account.name, 'trackeraegis', amount + " SNAX", 'Aegis Support');
  }

  refund() {
    this.load();
    const account = this.scatter.identity.accounts.find(acc => acc.blockchain === 'snax');
    const options = {authorization: [`${account.name}@${account.authority}`]};
    return this.snax.contract('trackeraegis').then(contract => contract.refund(account.name, options));
  }
}
