import { User } from './../user';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AuthWeb3Service } from 'src/services/auth-web3.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'], 
  changeDetection: ChangeDetectionStrategy.Default,
})
export class AuthComponent implements OnInit {
  loginUser: boolean = false;
  miUser: User | undefined;
  addressUserView: boolean = false;
texto:string='';
  web3: any; 

  constructor( private authWeb3Srv: AuthWeb3Service) {
    this.web3 = this.authWeb3Srv.web3Instance;
    console.log(this.web3)
  }

  connect() {
    this.authWeb3Srv.connect();
  }

  ngOnInit(): void {
/*     this.authWeb3Srv.loginUser.subscribe((res: boolean) => { 
      this.loginUser = res;
      (!this.loginUser) ? this.addressUserView = false : this.addressUserView = true;
      //this.cdr.detectChanges();
    }); */
    
    this.authWeb3Srv.user.subscribe((res: User) => { 
      this.miUser = res;
      this.addressUserView = (!(this.miUser.address===''));
      this.texto='Ha llegado el cambio'
      //this.cdr.detectChanges();
    });
  }

}
