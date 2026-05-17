import {HttpClient} from '@angular/common/http';
import {Observable, of, ReplaySubject, shareReplay, take} from 'rxjs';
import moment from "moment/moment";
import {environment} from '../../environments/environment';
import {Gateway} from "./gateway";
import {HandlerRegistry} from "./handler-registry.service";
import {HandlerInvoker} from './handler';
import {ElementRef} from '@angular/core';
import {tap} from 'rxjs/operators';
import {AppCommonUtils} from './app-common-utils';

export abstract class RequestGateway extends Gateway {
  private cache: Map<string, ReplaySubject<any>> = new Map();


  protected constructor(invokers: Map<string, HandlerInvoker[]>, protected registry: HandlerRegistry,
                        private http: HttpClient, private method: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head') {
    super(invokers, registry);
  }

  send(type: string, payload: any = {}, options: RequestOptions = {}, elementRef?: ElementRef<Element>): Observable<any> {
    const localResult = this.tryHandleRequestLocally(type, payload, options, elementRef);
    if (localResult) {
      return localResult;
    }
    let o: Observable<any>;
    if (options.caching) {
      const key = type + JSON.stringify(payload);
      const cachedResponse = this.cache.get(key);
      if (cachedResponse) {
        return cachedResponse;
      }
      const subject = o = new ReplaySubject(1);
      this.cache.set(key, subject);
      this.doSend(type, payload, options).pipe(shareReplay(1)).subscribe(
        {
          next: n => subject.next(n),
          error: e => {
            this.cache.delete(key);
            subject.error(e);
          }
        });
    } else {
      o = this.doSend(type, payload, options);
    }
    if (!options.hideError) {
      o = o.pipe(tap({error: e => AppCommonUtils.registerError(e)}));
    }
    if (options.showSpinner) {
      o = AppCommonUtils.waitForProcess(o);
    }
    return o;
  }

  protected tryHandleRequestLocally(type: string, payload: any, options: RequestOptions = {}, elementRef?: ElementRef<Element>): Observable<any> {
    const domResult = this.tryHandleOnDom(type, payload, elementRef);
    if (domResult) {
      return domResult;
    }
    const localHandler = this.getLocalHandler(type);
    if (localHandler) {
      console.debug(`Locally handling request ${type}. Handler: `, localHandler);
      payload = this.getPayload(payload);
      const result = localHandler.invoker.method.apply(localHandler.instance, [payload, options]);
      const handlerOptions = localHandler.invoker.options;
      const resultAsObservable = result instanceof Observable ? result : of(result);
      if (handlerOptions?.caching) {
        const key = type + JSON.stringify(payload);
        const cachedResponse = this.cache.get(key);
        if (cachedResponse) {
          return cachedResponse;
        }
        const subject = new ReplaySubject(1);
        resultAsObservable.pipe(shareReplay(1)).subscribe({
          next: n => subject.next(n),
          error: e => {
            this.cache.delete(key);
            subject.error(e);
          }
        });
        this.cache.set(key, subject);
        return subject as Observable<any>;
      }
      return resultAsObservable;
    }
  }

  private doSend(path: string, payload: any, options: any = {}) {
    // const message = asMessage(payload, type);
    // message.metadata.localTime = moment().toLocaleString();
    options.withCredentials = true;
    options.headers = addHeadersFromLocalStorage(options.headers, 'Authorization', 'X-Impersonation');
    const url = path.includes('://') ? path : environment.apiProtocol + environment.apiDomain + path;
    console.debug("sending " + this.method, url, payload, options);
    switch (this.method) {
      case "get":
        return this.http[this.method](url, options);
      case "delete":
        return this.http[this.method](url, options);
      default:
        return (<any>this.http[this.method])(url, payload, options);
    }

    function addHeadersFromLocalStorage(headers : any, ...headerNames : string[]): any {
      headers = headers || {};
      headerNames.forEach(headerName => {
        if (headerName && !headers[headerName]) {
          const value = localStorage.getItem(headerName);
          if (value) {
            headers[headerName] = value;
          }
        }
      });
      return headers;
    }
  }

  removeFromCache(type: string, payload?: any) {
    let key = type;
    if (payload) {
      key += JSON.stringify(payload);
    }
    Array.from(this.cache.keys()).filter(k => k.startsWith(key)).forEach(k => this.cache.delete(k));
  }

  clearCache() {
    this.cache = new Map();
  }

  modifyCache<T>(type: string, modifier: (T) => T) {
    Array.from(this.cache.entries())
      .filter(entry => entry[0].startsWith(type))
      .map(entry => entry[1])
      .forEach(o => o.pipe(take(1)).subscribe(value => o.next(modifier(value))));
  }
}

function asMessage(payload: any, type: string) {
  if (!payload) {
    payload = {};
  }
  //payload is already a message
  if (payload['@class'] === 'io.fluxcapacitor.javaclient.common.Message') {
    payload.metadata = payload.metadata || {};
    payload.payload["@class"] = type;
    return payload;
  }

  //payload should be converted to a message
  payload["@class"] = type;
  return {
    "@class": 'io.fluxcapacitor.javaclient.common.Message',
    payload: payload,
    metadata: {}
  }
}

export interface RequestOptions {
  caching?: boolean;
  showSpinner?: boolean;
  hideError?: boolean;
  responseType?: XMLHttpRequestResponseType;
  headers?: any;
}
