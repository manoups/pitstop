import {RequestGateway, RequestOptions} from './request-gateway';
import { HttpClient } from '@angular/common/http';
import {ElementRef, Injectable} from '@angular/core';
import {HandlerRegistry} from "./handler-registry.service";
import {HandlerInvoker, HandlerOptions} from './handler';
import {Observable, take} from "rxjs";
import {tap} from 'rxjs/operators';
import {publishEvent} from './app-common-utils';

@Injectable()
export class CommandGateway extends RequestGateway {
  protected static invokers: Map<string, HandlerInvoker[]> = new Map();

  constructor(protected registry: HandlerRegistry, http: HttpClient) {
    super(CommandGateway.invokers, registry, http, "post");
  }

  send(type: string, payload: any, options: CommandOptions = {}, elementRef?: ElementRef<Element>): Observable<any> {
    let observable = super.send(type, payload, options, elementRef).pipe(take(1));
    if (options.eventOnSuccess) {
      observable = observable.pipe((tap(value => {
        publishEvent("commandSuccess", value, elementRef);
      })));
    }
    return observable;
  }

  sendAndForget(type: string, payload: any, options: CommandOptions = {}, elementRef?: ElementRef<Element>): void {
    this.send(type, payload, options, elementRef).subscribe();
  }

  static registerHandlerInvoker(target: any, type: string, handler: Function, options?: HandlerOptions) {
    this.addInvoker(this.invokers, target, type, handler, 'command', options);
  }
}

export interface CommandOptions extends RequestOptions {
  eventOnSuccess? : boolean
}
