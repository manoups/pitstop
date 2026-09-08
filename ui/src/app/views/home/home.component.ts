import {Component, inject, OnInit} from '@angular/core';
import {AppContext} from '../../app-context';
import {WebsocketService} from '../../common/websocket.service';
import {publishEvent, subscribeTo} from '../../common/app-common-utils';
import {Handler} from "../../common/handler";
import {View} from "../../common/view";
import {take} from 'rxjs';
import Keycloak from "keycloak-js";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers: [WebsocketService],
  standalone: false
})
@Handler()
export class HomeComponent extends View implements OnInit {
  context = inject(AppContext);
  socketService: WebsocketService<any> = inject(WebsocketService<any>);
  authService = inject(Keycloak);

  ngOnInit(): void {
    const subscription = subscribeTo("/api/user");
    subscription.pipe(take(1)).subscribe({
      next: userProfile => {
        if (userProfile) {
          this.socketService.initialise(
            "api/updates",
            update => publishEvent(update.type, update),
            true,
            undefined,
            // Source the websocket credential from the Keycloak session. Refresh the token
            // before every (re)connect so reconnects use a valid bearer token.
            async () => {
              try {
                await this.authService.updateToken(30);
              } catch (ignored) {
                // fall through with whatever token we currently have
              }
              return {
                token: this.authService.token,
                impersonation: localStorage.getItem("X-Impersonation") ?? undefined
              };
            });
        } else {
          this.authService.logout();
        }
      },
      error: () => this.authService.logout()
    });
    subscription.subscribe(userProfile => this.context.setUserProfile(userProfile));
  }
}
