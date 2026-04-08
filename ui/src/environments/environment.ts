// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --configuration production` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiProtocol: "",
  apiDomain: "",
  apiPath: "/api",
  mapbox: {
    accessToken: "pk.eyJ1IjoiZmx1eGhvc3QiLCJhIjoiY201dHNnOHF6MTBkazJuc2VmMWZsYWE0dCJ9.FoPjoC7H7HPLUpfSui_BPg",
  },
  auth: {
    domain: "https://track-rejoice-dev-7kxie6.us1.zitadel.cloud",
    clientId: "365704552508327461",
    redirectBaseUri: "http://localhost:4200",
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
