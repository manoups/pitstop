import {Component, forwardRef, Input} from '@angular/core';
import countryJson from "./countries.json";
import {AbstractValueAccessorComponent} from "../component/value-accessor.component";
import {NG_VALUE_ACCESSOR} from "@angular/forms";

@Component({
    selector: 'app-country-select',
    templateUrl: './country-select.component.html',
    styleUrls: ['./country-select.component.scss'],
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CountrySelectComponent), multi: true }
    ],
    standalone: false
})
export class CountrySelectComponent extends AbstractValueAccessorComponent<string> {
  @Input() required: boolean;
  @Input() disabled: boolean;
  country: Country;
  countries: Country[] = countryJson;

  get value(): string {
    return this.country?.countryCode;
  }

  writeValue(value: string): void {
    this.country = value ? this.countries.find(c => c.countryCode === value) : null;
  }

  changeCountry = (country: Country) => {
    this.country = country;
    this.onModelChange();
  }

  protected countryFormatter = (country: Country) => `${country.icon} ${country.name} (+${country.telephonePrefix})`;
}

interface Country {
  countryCode: string;
  name: string;
  icon: string;
  telephonePrefix: string;
}
