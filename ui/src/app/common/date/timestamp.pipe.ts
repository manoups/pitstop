import {Pipe, PipeTransform} from '@angular/core';
import moment from 'moment';

@Pipe({
    name: 'timestamp',
    standalone: false
})
export class TimestampPipe implements PipeTransform {

  transform(value: any, ...args: any[]): string {
    if (!value) {
      return '';
    }
    let [format] = args;
    if (!format) {
      format = 'DD-MM-YYYY HH:mm';
    }
    return moment(value).format(format);
  }

}
