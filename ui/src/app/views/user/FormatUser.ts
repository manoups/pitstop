import {Injectable, Pipe, PipeTransform} from "@angular/core";
import {UserProfile} from '@pitstop/typescriptmodels/pitstop';

@Pipe({
    name: 'formatUser',
    standalone: false
})
@Injectable()
export class FormatUserPipe implements PipeTransform {

  transform(value: UserProfile, ...args: any[]) {
    return FormatUserPipe.format(value);
  }

  static format(value: UserProfile): string {
    if (!value) {
      return null;
    }
    const firstName = value?.details?.firstName;
    const lastName = value?.details?.lastName;
    return `${firstName}${lastName ? ' ' + lastName : ''}`;
  }
}
