import {Component, inject, OnInit} from '@angular/core';
import {AppContext} from '../../app-context';
import {WebsocketService} from '../../common/websocket.service';
import {publishEvent, subscribeTo} from '../../common/app-common-utils';
import {Handler} from "../../common/handler";
import {View} from "../../common/view";
import {take} from 'rxjs';
import {KeycloakService} from "keycloak-angular";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    providers: [WebsocketService],
    standalone: false
})
@Handler()
export class HomeComponent extends View implements OnInit {
  context = AppContext;
  socketService: WebsocketService<any> = inject(WebsocketService<any>);
  authService: KeycloakService = inject(KeycloakService);

  ngOnInit(): void {
    const subscription = subscribeTo("/api/user");
    subscription.pipe(take(1)).subscribe({
      next: userProfile => {
        if (userProfile) {
          this.socketService.initialise("api/updates", update => publishEvent(update.type, update));
        } else {
          this.authService.logout();
        }
      },
      error: () => this.authService.logout()
    });
    subscription.subscribe(userProfile => AppContext.setUserProfile(userProfile));
  }
}
