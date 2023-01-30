import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import Web3 from 'web3';
import Swal from 'sweetalert2';
import { User } from 'src/app/components/user';

declare let window: any;

@Injectable({
  providedIn: 'root'
})
export class AuthWeb3Service {
  web3: any = null;
  
  get web3Instance() { return this.web3; }

  chainIds: string[] = ['0x'+Number(1337).toString(16).toUpperCase()];
  user: BehaviorSubject<User> = new BehaviorSubject<User>(new User());
  loginUser: any = new BehaviorSubject<boolean>(false);

  constructor() {
    if (typeof window.ethereum !== 'undefined') {
      this.web3 = new Web3(window.ethereum);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'No tienes instalado MetaMask!'
      });
    }
  }

  connect() {
    this.handleIdChainChanged();
  }

  async handleIdChainChanged() {
    const chainId: string = await window.ethereum.request({ method: 'eth_chainId' });

    if (this.chainIds.includes(chainId)) {
      this.handleAccountsChanged();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Selecciona la red principal de Ethereum (Mainet)'
      });
    }

    window.ethereum.on('chainChanged', (res: string) => {
      if (!this.chainIds.includes(res)) {
        this.logout();
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Selecciona la red principal de Ethereum (Mainet)'
        });
      } else {
        if (this.user.getValue().address === '') {
          this.handleAccountsChanged();
        } else {
          this.authBackend();
        }
      }
    });
  }

  async handleAccountsChanged() {
    const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    const initialvalue = await this.saldoCuenta(accounts[0]);
    
    //this.balance = this.web3js.utils.fromWei(initialvalue , 'ether');
    this.user.next(new User({address:accounts[0],balance:initialvalue}));
    this.authBackend();

    window.ethereum.on('accountsChanged', async(accounts: string[]) => {
      const initialvalue = await this.saldoCuenta(accounts[0]);
      this.user.next(new User({address:accounts[0],balance: initialvalue}));
      this.authBackend();
    });
  }

  async saldoCuenta(address:string) : Promise<string>{
    const initialvalue = await window.ethereum.request(
      { method: "eth_getBalance","params":[address, "latest"]});
      this.web3.utils.fromWei(initialvalue , 'ether');
    return this.web3.utils.fromWei(initialvalue , 'ether');;
  }

  async authBackend() {
    // => IF Success auth api backend
    this.loginUser.next(true);

    // => IF Failed auth api backend d
    //this.logout();
  }

  logout() {
    this.loginUser.next(false);
  }
}
