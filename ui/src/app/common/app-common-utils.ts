import {tap} from "rxjs/operators";
import {Observable, Subscriber, take} from "rxjs";
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {Router} from '@angular/router';
import {Alert, AlertLevel} from "./alerting/status-alert/alert";
import {QueryGateway} from "./query-gateway";
import {lodash, uuid} from "./utils";
import {ElementRef, Injector, ViewContainerRef} from '@angular/core';
import {CommandGateway, CommandOptions} from './command-gateway';
import {EventGateway} from './event-gateway';
import {RequestOptions} from './request-gateway';
import {defaultModalOptions, ModalOptions, OpenModal} from "./modal/modal";

export class InjectorProvider {
  static injector: Injector;
}

export function subscribeTo(type: string, payload = {}, options ?: RequestOptions, elementRef? : ElementRef<Element>): Observable<any> {
  if (!InjectorProvider.injector) {
    return new Observable((subscriber: Subscriber<any>) => {
      InjectorProvider.injector.get(QueryGateway).subscribe(type, payload, options, elementRef).subscribe(subscriber);
    });
  }
  return InjectorProvider.injector.get(QueryGateway).subscribe(type, payload, options, elementRef);
}

export function sendQuery(type: string, payload = {}, options ?: RequestOptions, elementRef? : ElementRef<Element>): Observable<any> {
  if (!InjectorProvider.injector) {
    return new Observable((subscriber: Subscriber<any>) => {
      InjectorProvider.injector.get(QueryGateway).send(type, payload, options, elementRef).subscribe(subscriber);
    });
  }
  return InjectorProvider.injector.get(QueryGateway).send(type, payload, options, elementRef);
}

export function sendCommand(type: string, payload: any,
                            successHandler?: (value: any) => void,
                            errorHandler?: (error: any) => void, options : CommandOptions = {},
                            elementRef? : ElementRef): void {
  AppCommonUtils.clearAlerts();
  options.hideError = true;
  AppCommonUtils.waitForProcess(InjectorProvider.injector.get(CommandGateway).send(type, payload, options, elementRef).pipe(take(1)))
    .subscribe({
      next: successHandler ? successHandler : () => AppCommonUtils.registerSuccess("Operation has completed successfully"),
      error: errorHandler ? errorHandler : (error) => AppCommonUtils.registerError(error)
    });
}

export function openModal(component, data?, viewContainerRef?: ViewContainerRef, options: ModalOptions = defaultModalOptions, closeCallback?: (args?: any) => any) {
  options = lodash.merge({}, defaultModalOptions, options);
  options.closeCallback = closeCallback;
  sendCommand("openModal", <OpenModal>{
    component: component,
    container: data?.viewContainerRef || viewContainerRef,
    data: data,
    options: options
  }, () => {});
}

export function sendCommandAndForget(type: string, payload: any = {}, options ?: CommandOptions, elementRef? : ElementRef): void {
  InjectorProvider.injector.get(CommandGateway).sendAndForget(type, payload, options, elementRef);
}

export function publishEvent(type: string, payload?: any, elementRef? : ElementRef) {
  InjectorProvider.injector.get(EventGateway).publish(type, payload || {}, elementRef);
}

export class AppCommonUtils {

  static isLocalhost: boolean = this.detectLocalhost();
  static pendingProcesses: any[] = [];
  static alerts: Alert[] = [];

  private static detectLocalhost(): boolean {
    const localHostMatch = window.location.href.match(/http:\/\/(localhost)(.*)/);
    return localHostMatch ? localHostMatch[1].toLocaleLowerCase() === "localhost" : null;
  }

  static getPreferredLanguage() {
    return localStorage.getItem('lastLanguage') || AppCommonUtils.getSystemLanguage() || 'en';
  }

  static initialiseLanguage(language: string) {
    localStorage.setItem('lastLanguage', language);
  }

  static getSystemLanguage(): string {
    let result = navigator.language?.split("-")[0];
    if (result) {
      switch (result) {
        case 'en':
        case 'nl':
          return result;
        default:
          return 'en';
      }
    }
    return null;
  }

  static navigateToUrl(url: string, reload = false) {
    if (reload) {
      location.href = url;
    } else {
      InjectorProvider.injector.get(Router).navigateByUrl(url);
    }
  }

  static removeFromCache(queryName: string, payload?: any) {
    InjectorProvider.injector.get(QueryGateway).removeFromCache(queryName, payload);
  }

  static modifyQueryCache<T>(queryName: string, modifier: (T) => T) {
    InjectorProvider.injector.get(QueryGateway).modifyCache(queryName, modifier);
  }

  static clearCache() {
    InjectorProvider.injector.get(QueryGateway).clearCache();
  }

  static httpClient(): HttpClient {
    return InjectorProvider.injector.get(HttpClient);
  }

  static waitForProcess = (process: Observable<any>): Observable<any> => {
    AppCommonUtils.pendingProcesses.push(process);
    const removeProcess = () => AppCommonUtils.pendingProcesses.splice(AppCommonUtils.pendingProcesses.indexOf(process), 1);
    return process.pipe(tap({next: removeProcess, error: removeProcess}));
  }

  static registerError(error: any, level: AlertLevel = 'danger'): Alert {
    this.alerts = this.alerts.filter(a => a.level === level);
    if (error instanceof HttpErrorResponse) {
      publishEvent("checkSession");
      if (error.status === 401) {
        publishEvent("userUnauthorized");
      }
      if (String(error.status).startsWith('4') && error.error?.error) {
        error = error.error.error;
        const splitErrors = (<string>error).split('\n');
        if (splitErrors.length > 1) {
          splitErrors.forEach(e => this.registerError(e));
          return;
        }
      } else {
        const errorId = uuid();
        error = 'An unexpected error occurred (' + error.status
          + '). Please contact the service desk and mention error id: ' + errorId;
      }
    } else if (error instanceof Error) {
      error = error.message;
    } else if (typeof error !== 'string') {
      error = JSON.stringify(error);
    }
    const alert = <Alert>{content: error, level: level, type: 'visit'};
    this.addAlert(alert);
    return alert;
  }

  static hasErrors() {
    return this.alerts.filter(a => a.level === 'danger').length > 0;
  }

  static registerSuccess(success: string, msShowTime?: number) {
    const alert = <Alert>{content: success, level: 'success', msShowTime: msShowTime == null ? 2000 : msShowTime};
    this.addAlert(alert);
  }

  static registerInfo(message: string, msShowTime?: number) {
    const alert = <Alert>{content: message, level: 'info', msShowTime: msShowTime == null ? 2000 : msShowTime};
    this.addAlert(alert);
  }

  static addAlert(alert: Alert) {
    if (this.alerts.filter(value => value.content === alert.content).length === 0) {
      this.alerts.push(alert);
    }
  }

  static closeAlerts(...alerts: Alert[]) {
    alerts.forEach(alert => {
      if (AppCommonUtils.alerts.indexOf(alert) >= 0) {
        AppCommonUtils.alerts.splice(AppCommonUtils.alerts.indexOf(alert), 1);
      }
    });
  }

  static clearAlerts() {
    this.alerts = [];
  }
}
