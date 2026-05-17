import {Inject, Injectable, Pipe, PipeTransform} from '@angular/core';
import {lodash} from './utils';

@Pipe({
    name: 'sentenceCase',
    standalone: false
})
@Injectable()
export class SentenceCasePipe implements PipeTransform {

  transform(value: any, ...args: any[]): any {
    return SentenceCasePipe.format(value);
  }

  static format = (value: string): string =>
      value && (value.toString().substring(0, 1).toUpperCase() + value.toString().substring(1).toLowerCase());

  static formatWithSpaces = (value: string) =>  {
    const sentenceCase = value.replace(/([A-Z])/g, ' $1').trim();
    return SentenceCasePipe.format(sentenceCase.charAt(0).toUpperCase() + sentenceCase.slice(1));
  }
}
