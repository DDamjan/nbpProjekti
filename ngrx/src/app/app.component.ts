import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import * as actions from './store/actions';
import { WebSocketService } from './service/web-socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  title = 'NGDispatcher';
  loggedIn: boolean;

  constructor(private store: Store<any>, private webSocketService: WebSocketService) { }

  public ngOnInit() {
    this.webSocketService.listen('connection').subscribe((data) => {
      console.log(data);
      console.log('Unutar random kompompponente slusa i reaguje na poziv severa');
    });

    this.webSocketService.listen('User:'/*+ USER.ID*/).subscribe((data) => {
      // Emit za Drivere
      console.log(data);
    });

    this.store.dispatch(new actions.GetDrivers());
    // this.store.select()
  }

  public ngDoCheck(){
    localStorage.getItem('currentUser') != null ? this.loggedIn = true : this.loggedIn = false;
  }
}
