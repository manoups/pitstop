import {RequestGateway, RequestOptions} from './request-gateway';
import { HttpClient } from '@angular/common/http';
import {ElementRef, Injectable} from '@angular/core';
import {Observable, ReplaySubject, Subject, take} from 'rxjs';
import {HandlerRegistry} from "./handler-registry.service";
import {HandlerInvoker, HandlerOptions} from './handler';
import {AppCommonUtils} from "./app-common-utils";

@Injectable()
export class QueryGateway extends RequestGateway {
  protected static invokers: Map<string, HandlerInvoker[]> = new Map();

  constructor(protected registry: HandlerRegistry, http: HttpClient) {
    super(QueryGateway.invokers, registry, http, "get");
  }

  subscribe(type: string, payload: any, options: RequestOptions = {caching: true, showSpinner: false}, elementRef?: ElementRef<Element>): Subject<any> {
    const startTime = Date.now();
    const subject = new ReplaySubject(1);
    const innerSubject = super.send(type, payload, options, elementRef) as Subject<any>;
    if (!innerSubject.unsubscribe) {
      innerSubject.unsubscribe = () => {};
    }
    innerSubject.subscribe((n) => {
      const endTime = Date.now();
      subject.next(n);
      if (AppCommonUtils.isLocalhost) {
        console.debug(`Execution time for subscribe: ${type} ${endTime - startTime}ms`);
      }
    });
    return subject;
  }

  override send(type: string, payload: any, options: RequestOptions = {caching: true, showSpinner: false}, elementRef?: ElementRef<Element>): Observable<any> {
    return super.send(type, payload, options, elementRef).pipe(take(1));
  }

  static registerHandlerInvoker(target: any, eventName: string, handler: Function, options?: HandlerOptions) {
    this.addInvoker(this.invokers, target, eventName, handler, 'query', options);
  }
}
