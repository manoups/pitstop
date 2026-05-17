import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {AbstractValueAccessorComponent} from "../../component/value-accessor.component";
import {dispatchChangeEvent, uuid} from "../../utils";
import moment, {Moment, MomentInput} from "moment/moment";
import {Observable, of} from "rxjs";
import {NG_VALUE_ACCESSOR} from "@angular/forms";
import {DatePickerComponent, DatePickerRange} from "../date-picker/date-picker.component";
import {TranslateDirective} from "../../utils/translate.directive";

const times = [
  '00:00', '00:15', '00:30', '00:45',
  '01:00', '01:15', '01:30', '01:45',
  '02:00', '02:15', '02:30', '02:45',
  '03:00', '03:15', '03:30', '03:45',
  '04:00', '04:15', '04:30', '04:45',
  '05:00', '05:15', '05:30', '05:45',
  '06:00', '06:15', '06:30', '06:45',
  '07:00', '07:15', '07:30', '07:45',
  '08:00', '08:15', '08:30', '08:45',
  '09:00', '09:15', '09:30', '09:45',
  '10:00', '10:15', '10:30', '10:45',
  '11:00', '11:15', '11:30', '11:45',
  '12:00', '12:15', '12:30', '12:45',
  '13:00', '13:15', '13:30', '13:45',
  '14:00', '14:15', '14:30', '14:45',
  '15:00', '15:15', '15:30', '15:45',
  '16:00', '16:15', '16:30', '16:45',
  '17:00', '17:15', '17:30', '17:45',
  '18:00', '18:15', '18:30', '18:45',
  '19:00', '19:15', '19:30', '19:45',
  '20:00', '20:15', '20:30', '20:45',
  '21:00', '21:15', '21:30', '21:45',
  '22:00', '22:15', '22:30', '22:45',
  '23:00', '23:15', '23:30', '23:45'
];

@Component({
    selector: 'app-date-field',
    templateUrl: './date-field.component.html',
    styleUrls: ['./date-field.component.scss'],
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateFieldComponent), multi: true }
    ],
    standalone: false
})
export class DateFieldComponent extends AbstractValueAccessorComponent<string> implements OnInit, AfterViewInit {
  timestamp: string;
  _date: Moment;
  formattedDate: string;
  time: string;
  startDate: Moment;
  _calendarStartDate: DatePickerRange;
  _minDate: Moment;

  @Input() id = uuid();
  @Input() dateOnly = false;
  @Input() hideTime = false;
  @Input() defaultTime: string;
  @Input() disabled = false;
  @Input() required;
  @Input() yearSpan = 10;
  @Input() readonly;
  @Input() status : 'warning' | 'error';

  @Input() set minDate(date: Moment | string) {
    this._minDate = typeof date === "string" ? moment(date) : date;
    this.calendarStartDate = date;
  }

  @Input() set calendarStartDate(value: MomentInput) {
    this.startDate = value ? moment(value) : moment();
    this.updateCalendarStartDate();
  }

  set date(date: Moment) {
    this._date = date;
    this.updateCalendarStartDate();
  }

  @Output() focus = new EventEmitter();
  @Output() blur = new EventEmitter();

  @ViewChild("picker") pickerEl: ElementRef;
  @ViewChild(DatePickerComponent, {static: false}) pickerComponent: DatePickerComponent;
  showPicker: boolean;
  private readonly displayFormat = "DD-MM-YYYY";
  private readonly timeFormat = "HH:mm";

  constructor(public elementRef: ElementRef, private changeDetectorRef: ChangeDetectorRef) {
    super();
  }

  ngAfterViewInit() {
    if (this.pickerEl) {
      $(this.pickerEl.nativeElement).on("show.bs.dropdown", () => {
        this.showPicker = true;
        this.pickerComponent?.updateCalendar();
        this.changeDetectorRef.markForCheck();
        return true;
      });
    }
  }

  updateCalendarStartDate = (): void => {
    this._calendarStartDate = {
      start: this._date || this.startDate,
      end: this._date || this.startDate
    }
  };

  searchTime = (term: string): Observable<any> => of(times.filter(option =>
    option.replace(':', '').startsWith(term.replace(':', ''))));

  onDatePickerChanged = (d: DatePickerRange) => {
    const date = moment(`${d.start.format(this.displayFormat)} ${this.time}`, `${this.displayFormat} ${this.timeFormat}`);
    this.date = date;
    this.writeValue(date.toISOString());
    this.onDateChange();
  }

  onDateChange = () => {
    if (!this.time) {
      this.time = this.defaultTime;
    }
    this.writeValue(this.formattedDate ? this.getDate().toISOString() : null);
    this.onModelChange();
    dispatchChangeEvent(this.elementRef.nativeElement);
    this.blur.emit(this.value);
  };

  onTimeChange = ($event) => {
    this.time = times.indexOf(this.time) >= 0 ? $event : null;
    this.writeValue(this.formattedDate ? this.getDate().toISOString() : null);
    this.onModelChange();
    dispatchChangeEvent(this.elementRef.nativeElement);
    this.blur.emit(this.value);
  };

  private getDate() {
    const date = moment(this.formattedDate, this.displayFormat);
    let time =  moment(this.time, this.timeFormat);
    if (!this.time && this.defaultTime) {
      this.time = this.defaultTime;
      time = moment(this.time, this.timeFormat);
    }
    return date.hour(time.hour()).minute(time.minute()).second(time.second()).millisecond(time.millisecond());
  };

  get value(): string {
    if (!this._date || typeof this._date === 'string') {
      this.date = null;
      this.time = null;
      return null;
    }
    if (this.dateOnly) {
      const m = moment({y: this._date.year(), M: this._date.month(), d: this._date.date()});
      if (!this.isValid(m)) {
        this.date = null;
        this.time = null;
        return null;
      }
      const hasTime = this.defaultTime;
      if (this.time || hasTime) {
        let time =  moment(this.time || this.defaultTime, this.timeFormat);
        m.hour(time.hour()).minute(time.minute()).second(time.second()).millisecond(time.millisecond());
      }
      return hasTime ? m.toISOString() : m.format('YYYY-MM-DD');
    }
    if (!this.time) {
      return null;
    }
    if (times.indexOf(this.time) < 0) {
      return null;
    }
    if (!this.isValid(this._date)) {
      this.date = null;
      this.time = null;
      return null;
    }
    return this.timestamp = this._date.utc().toISOString();
  }

  writeValue(value): void {
    this.changeDetectorRef.detectChanges();
    this.timestamp = value === undefined ? null : value;
    const m = moment(this.timestamp);
    this.date = this.validateDate(m);
    this.time = this._date?.format(this.timeFormat) || null;
    this.formattedDate = this._date?.format(this.displayFormat);
  }

  private validateDate = (date: Moment): Moment => {
    if (!date || !date.isValid()) {
      return null;
    }
    if (this._minDate && date.isBefore(this._minDate)) {
      return this._minDate;
    }
    return date;
  };

  ngOnInit(): void {
    if (this.required === '') {
      this.required = true;
    }
    if (this.readonly === '') {
      this.readonly = true;
    }
  }

  private isValid = (m: Moment) => m.isValid() && m.isBetween(moment().subtract(this.yearSpan, 'years'), moment().add(this.yearSpan, 'years'));

  translatedPlaceholder = (): string => TranslateDirective.getTranslation("dd-mm-yyyy", true);
}
