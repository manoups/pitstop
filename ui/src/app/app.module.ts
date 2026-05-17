import {APP_INITIALIZER, Injector, LOCALE_ID, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import {CommonModule, DecimalPipe, TitleCasePipe} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {CommonsModule} from "./common/commons.module";
import {CommandGateway} from "./common/command-gateway";
import {QueryGateway} from "./common/query-gateway";
import {EventGateway} from "./common/event-gateway";
import {TimestampPipe} from "./common/timestamp.pipe";
import {HomeComponent} from "./views/home/home.component";
import {TopMenuBarComponent} from './views/home/top-menu-bar/top-menu-bar.component';
import {HandlerRegistry} from "./common/handler-registry.service";
import {InjectorProvider} from './common/app-common-utils';
import {BreadcrumbComponent} from './views/home/top-menu-bar/bread-crump/breadcrumb.component';
import {RouterHandler} from "./routing/router-handler";
import {EditProfileGeneralComponent} from "./views/user/edit-profile-general/edit-profile-general.component";
import {EditProfileComponent} from "./views/user/edit-profile.component";
import {AuthConfig, OAuthModule, OAuthStorage} from "angular-oauth2-oidc";
import {environment} from '../environments/environment';
import {StorageService} from "./authentication/storage.service";
import {StatehandlerService, StatehandlerServiceImpl} from "./authentication/statehandler.service";
import {
  StatehandlerProcessorService,
  StatehandlerProcessorServiceImpl
} from "./authentication/statehandler-processor.service";
import {FormatUserPipe} from "./views/user/FormatUser";
import {IncidentOverviewComponent} from './views/incident-overview/incident-overview.component';
import {
  IncidentOverviewItemComponent
} from './views/incident-overview/incident-overview-item/incident-overview-item.component';
import {
  IncidentModalComponent
} from './views/incident-overview/incident-details-modal/incident-modal.component';
import { MapBoxComponent } from './views/incident-overview/current-location/map-box.component';
import {NgxMapboxGLModule} from 'ngx-mapbox-gl';
import { OfferModalComponent } from './views/incident-overview/offer-modal/offer-modal.component';
import { RegisterOperatorComponent } from './views/user/register-operator/register-operator.component';
import { OfferOverviewItemComponent } from './views/incident-overview/incident-overview-item/offer-overview-item/offer-overview-item.component';
import { AssistanceOverviewItemComponent } from './views/incident-overview/incident-overview-item/assistance-overview-item/assistance-overview-item.component';

const authConfig: AuthConfig = {
  scope: 'openid profile email offline_access',
  responseType: 'code',
  oidc: true,
  clientId: environment.auth.clientId,
  issuer: environment.auth.domain,
  redirectUri: `${environment.auth.redirectBaseUri}/auth/callback`,
  postLogoutRedirectUri: environment.auth.redirectBaseUri,
  requireHttps: false
};

@NgModule({ declarations: [
        FormatUserPipe,
        AppComponent,
        // Signed in
        HomeComponent,
        TopMenuBarComponent,
        BreadcrumbComponent,
        // User profile
        EditProfileComponent,
        EditProfileGeneralComponent,
        // pitstop
        IncidentOverviewComponent,
        IncidentOverviewItemComponent,
        IncidentModalComponent,
        MapBoxComponent,
        OfferModalComponent,
        RegisterOperatorComponent,
        OfferOverviewItemComponent,
        AssistanceOverviewItemComponent,
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        CommonModule,
        FormsModule,
        CommonsModule,
        OAuthModule.forRoot({
            resourceServer: {
                allowedUrls: [`${environment.auth.domain}/admin/v1`, `${environment.auth.domain}/management/v1`, `${environment.auth.domain}/auth/v1/`],
                sendAccessToken: true,
            },
        }),
        NgxMapboxGLModule.withConfig({
            accessToken: environment.mapbox.accessToken,
        })], providers: [
        HandlerRegistry,
        CommandGateway,
        QueryGateway,
        EventGateway,
        TitleCasePipe,
        TimestampPipe,
        DecimalPipe,
        RouterHandler,
        { provide: LOCALE_ID, useValue: 'en-NL' },
        {
            provide: APP_INITIALIZER,
            useFactory: (stateHandler: StatehandlerService) => () => stateHandler.initStateHandler(),
            multi: true,
            deps: [StatehandlerService],
        },
        {
            provide: AuthConfig,
            useValue: authConfig,
        },
        {
            provide: StatehandlerProcessorService,
            useClass: StatehandlerProcessorServiceImpl,
        },
        {
            provide: StatehandlerService,
            useClass: StatehandlerServiceImpl,
        },
        {
            provide: OAuthStorage,
            useClass: StorageService,
        },
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule {
  constructor(injector: Injector) {
    InjectorProvider.injector = injector;
    InjectorProvider.injector.get(RouterHandler);
  }
}
