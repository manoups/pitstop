import {environment} from "../../environments/environment";
import {Injectable, OnDestroy} from "@angular/core";
import {AppCommonUtils} from "./app-common-utils";

/**
 * Credentials used to authenticate the websocket handshake. Sourced from the Keycloak
 * session (see {@link HomeComponent}) rather than localStorage under the Angular 20 flow.
 */
export interface WebsocketCredentials {
  token?: string;
  impersonation?: string;
}

/**
 * Resolves the credentials to use for a (re)connect. May be synchronous or async so the
 * caller can refresh the Keycloak token (e.g. `keycloak.updateToken(...)`) before returning
 * a fresh bearer token for reconnects.
 */
export type WebsocketCredentialsProvider =
  () => WebsocketCredentials | Promise<WebsocketCredentials>;

@Injectable()
export class WebsocketService<T> implements OnDestroy {
  private socket: WebSocket;

  private endpoint: string;
  private onMessage: (update: T) => void;
  private retryOnClose: boolean = false;
  private onClose?: (closeEvent: CloseEvent) => void;
  private credentialsProvider?: WebsocketCredentialsProvider;

  initialise = (endpoint: string, onMessage: (update: T) => void,
                retryOnClose: boolean = true, onClose?: (closeEvent: CloseEvent) => void,
                credentialsProvider?: WebsocketCredentialsProvider) => {
    this.endpoint = endpoint;
    this.onMessage = onMessage;
    this.retryOnClose = retryOnClose;
    this.onClose = onClose;
    this.credentialsProvider = credentialsProvider;
    this.openWebsocket();
  }

  ngOnDestroy() {
    try {
      console.debug("Closing websocket");
      this.socket.onclose = () => {};
      this.socket.close();
      this.socket = null;
    } catch (ignored) {
    }
  }

  private openWebsocket = () => {
    // Resolve the credentials (refreshing the Keycloak token when a provider is supplied)
    // before connecting. A provider may be async, so wrap in Promise.resolve to stay
    // async-safe while still connecting synchronously when the credentials are available
    // synchronously.
    const provider: WebsocketCredentialsProvider =
      this.credentialsProvider ?? (() => ({token: ""}));
    let credentials: WebsocketCredentials | Promise<WebsocketCredentials>;
    try {
      credentials = provider();
    } catch (e) {
      this.handleConnectFailure(e);
      return;
    }
    if (credentials instanceof Promise) {
      credentials.then(resolved => this.connectWith(resolved))
        .catch(e => this.handleConnectFailure(e));
    } else {
      this.connectWith(credentials);
    }
  }

  private connectWith = (credentials: WebsocketCredentials) => {
    try {
      // Gate on the Keycloak-sourced token: when a credentials provider is wired up but
      // yields no token (anonymous / signed out), do not connect. When no provider is
      // supplied at all we fall back to connecting (legacy/local behavior).
      if (this.credentialsProvider && !credentials?.token) {
        return; //signed out
      }
      const url = this.getUrl();
      this.socket = new WebSocket(url, buildSubprotocol(credentials));
      this.subscribeToSocket();
    } catch (e) {
      this.handleConnectFailure(e);
      return;
    }

    function buildSubprotocol(creds: WebsocketCredentials): string[] {
      const result: string[] = [];
      // Same transport shape the backend expects: the Authorization header carried as a
      // websocket subprotocol pair, with the Keycloak token as a Bearer credential.
      result.push(encodeURIComponent("Authorization"),
        encodeURIComponent("Bearer " + (creds?.token ?? "")));
      // Preserve the optional impersonation entry only when such a value still exists.
      if (creds?.impersonation) {
        result.push(encodeURIComponent("X-Impersonation"),
          encodeURIComponent(creds.impersonation));
      }
      return result;
    }
  }

  private handleConnectFailure = (e: unknown) => {
    console.warn(`Could not open websocket (${this.endpoint}). Retrying every minute...`, e);
    setTimeout(() => this.openWebsocket(), 60_000);
  }

  private getUrl = () => environment.apiProtocol + environment.apiDomain + '/' + this.endpoint;

  private subscribeToSocket = () => {
    this.socket.onmessage = this.onMessageReceived;
    this.socket.onclose = this.onSocketClose;
    this.socket.onopen = this.onSocketOpen;
  };

  private onMessageReceived = (message: MessageEvent) => {
    if (typeof message.data === 'string') {
      try {
        const update: T = JSON.parse(message.data);
        if (update) {
          if (!this.onMessage) {
            this.ngOnDestroy();
            return;
          }
          this.onMessage(update);
        }
      } catch (exception) {
        console.error("Error while parsing message", exception);
        AppCommonUtils.registerError("Error while receiving automated message from backend, please contact support");
      }
    }
  }

  private onSocketClose = (event: CloseEvent) => {
    if (!event.wasClean) {
      console.warn(`Websocket closed with reason: ${event.reason} (${event.code}).${this.retryOnClose ? ' Trying to reconnect...' : ''}`);
    } else {
      console.debug(`Websocket closed with reason: ${event.reason} (${event.code}).${this.retryOnClose ? ' Trying to reconnect...' : ''}`);
    }
    if (this.retryOnClose) {
      setTimeout(() => this.openWebsocket(), 5_000);
    } else if (this.onClose) {
      this.onClose(event);
    }
  }

  private onSocketOpen = () => {
    console.debug(`Websocket opened (url: ${this.getUrl()})`);
  }
}
