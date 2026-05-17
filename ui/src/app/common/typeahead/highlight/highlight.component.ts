import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
    selector: 'app-highlight',
    imports: [CommonModule],
    templateUrl: './highlight.component.html',
    styleUrls: ['./highlight.component.scss']
})
export class HighlightComponent {
  parts: string[];

  @Input() highlightClass = 'highlight';
  @Input() accentSensitive = true;
  @Input() emptyText: string;

  private _term: string;
  protected _result?: string | null;

  @Input() set result(r: string | null) {
    this._result = r;
    this.updateHighlighting();
  }

  @Input()
  set term(t: string) {
    this._term = t;
    this.updateHighlighting();
  }

  private updateHighlighting = () => {
    if (!this.accentSensitive && !String.prototype.normalize) {
      console.warn(
        'The `accentSensitive` input in `app-highlight` cannot be set to `false` in a browser ' +
        'that does not implement the `String.normalize` function. ' +
        'You will have to include a polyfill in your application to use this feature in the current browser.',
      );
      this.accentSensitive = true;
    }
    const result = (this._result ?? '').toString();
    const terms = Array.isArray(this._term) ? this._term : [this._term];
    const prepareTerm = (term) => (this.accentSensitive ? term : this.removeAccents(term));
    const escapedTerms = terms.map((term) => this.regExpEscape(prepareTerm(term))).filter((term) => term);
    const toSplit = this.accentSensitive ? result : this.removeAccents(result);
    const parts = escapedTerms.length ?
      toSplit.split(new RegExp(`(${escapedTerms.join('|')})`, 'gmi')) : [result];

    if (this.accentSensitive) {
      this.parts = parts;
    } else {
      let offset = 0;
      this.parts = parts.map((part) => result.substring(offset, (offset += part.length)));
    }
  }

  removeAccents = (str: string): string => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  regExpEscape = (text) => text?.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}
