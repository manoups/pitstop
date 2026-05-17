import {AfterViewInit, Component, ElementRef, Input, TemplateRef} from '@angular/core';
import {lodash} from "../utils";

@Component({
    selector: 'app-form-field',
    templateUrl: './form-field.component.html',
    styleUrls: ['./form-field.component.scss'],
    standalone: false
})
export class FormFieldComponent implements AfterViewInit {
  @Input() label: string;
  @Input() tooltip: string;
  @Input() tooltipTemplateRef: TemplateRef<any>;
  @Input() renderOptional: boolean = true;
  @Input() customClass: string;
  @Input() includeMargin: boolean = true;
  @Input() formatter;
  @Input() value: any;
  @Input() emptyReadOnlyValue: string;
  @Input() truncateReadOnly: boolean;
  @Input() separator: string = ", ";

  required: boolean;
  protected editMode: boolean = true;

  constructor(public element: ElementRef) {
  }

  @Input("editMode")
  set setEditMode(editMode: boolean) {
    this.editMode = editMode;
    setTimeout(() => this.refreshOptionalLabel(), 0);
  }

  get hasValue() {
    return !lodash.isNull(this.value) && !lodash.isUndefined(this.value);
  }

  get readOnlyValue() {
    if (typeof this.value === "boolean") {
      return this.formatter ? this.formatter(this.value) : (this.value ? "Yes" : this.emptyReadOnlyValue || "No");
    }
    return this.value
      ? this.formatter ? this.formatter(this.value) : this.value
      : this.emptyReadOnlyValue || `Unknown`;
  }

  ngAfterViewInit(): void {
    const el = this.getChildElement();
    this.refreshOptionalLabel();
    if (el) {
      const labels = this.getLabels();
      if (!this.element.nativeElement.querySelector('.invalid-feedback')) {
        const feedbackElement = document.createElement('div');
        el.parentElement.appendChild(feedbackElement);
        feedbackElement.outerHTML = '<div class="invalid-feedback">Please enter ' + (labels ? renderLabel(labels) : 'a value') + '</div>';
      }
    }

    function renderLabel(labels: NodeList): string {
      let name: string = "";
      labels.forEach(node => name += node.textContent + " and ");
      name = name.slice(0, name.length - 4).toLowerCase();
      switch (name.charAt(0)) {
        case 'a':
        case 'e':
        case 'i':
        case 'o':
        case 'u':
          return 'an ' + name;
      }
      return 'a ' + name;
    }
  }

  private refreshOptionalLabel() {
    const el = this.getChildElement();
    const labels = this.getLabels();
    if (this.editMode && el && el.hasAttribute('required')) {
      this.required = true;
      labels.forEach(label => label.classList.add('required'));
    } else {
      labels.forEach(label => label.classList.remove('required'));
    }
  }

  private getLabels() {
    return this.element.nativeElement.querySelectorAll('label:not(.btn):not(app-radio label)');
  }

  private getChildElement() {
    return this.element.nativeElement.querySelector('textarea, app-date-field, app-radio, app-multiselect, input, select, app-toggle');
  }
}

