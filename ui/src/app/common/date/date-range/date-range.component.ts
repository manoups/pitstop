import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import moment from "moment";
import {DatePickerComponent, DatePickerRange, PickerDateTimeRange} from "../date-picker/date-picker.component";
import {dispatchChangeEvent, uuid} from "../../utils";
import {AbstractValueAccessorComponent} from "../../component/value-accessor.component";
import {Moment} from "moment/moment";
import lodash from "lodash";
import {NG_VALUE_ACCESSOR} from "@angular/forms";
import {DateFieldRange, MomentDateFieldRange} from "./date-field-range";
import {TimePickerInfo} from "../time-picker/time-picker.component";
import {DateRangeUtils} from "./date-range.utils";

@Component({
    selector: 'app-date-range',
    templateUrl: './date-range.component.html',
    styleUrls: ['./date-range.component.scss'],
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateRangeComponent), multi: true }
    ],
    standalone: false
})
export class DateRangeComponent extends AbstractValueAccessorComponent<DateFieldRange> implements OnInit, AfterViewInit {
  utils = DateRangeUtils;
  formattedDate: string;
  _date: DatePickerRange;
  time: string;
  startDating: Moment;
  _calendarStartDate: DatePickerRange;
  _minDate: Moment;

  @Input() id = uuid();
  @Input() dateOnly;
  @Input() defaultTime: string;
  @Input() disabled = false;
  @Input() required;
  @Input() yearSpan = 10;
  @Input() readonly;
  @Input() status: 'warning' | 'error';
  @Input() separator: string = " - ";
  @Input() includeTime: boolean;
  @Input() inputMode: 'input' | 'button' = 'input';
  @Input() ranges: MomentDateFieldRange[];
  @Input() show: boolean = true;
  @Input() showBackdrop: boolean;

  @Input() localStorageKey: string;

  @Output() focus = new EventEmitter();
  @Output() blur = new EventEmitter();

  startTime: TimePickerInfo = {hour: 12, minute: 0, second: 0};
  endTime: TimePickerInfo = {hour: 12, minute: 0, second: 0};

  numberOfMonths: number = (window.innerWidth > 0 ? window.innerWidth : screen.width) > 500 ? 2 : 1;

  @Input() set minDate(date: Moment | string) {
    this._minDate = typeof date === "string" ? moment(date) : date;
    this.calendarStartDate = this._minDate;
  }

  @Input() set calendarStartDate(value: Moment) {
    this.startDating = value;
    if (this._date) {
      this.updateCalendarStartDate();
    }
  }

  set date(date: PickerDateTimeRange) {
    this._date = {
      start: moment(date.start),
      end: moment(date.end)
    };
    this.updateCalendarStartDate();
  }

  @ViewChild("picker") pickerEl: ElementRef;
  @ViewChild("dropdownButton") dropdownButton: ElementRef;
  @ViewChild("dropdownMenu") dropdownMenu: ElementRef;
  @ViewChild(DatePickerComponent, {static: false}) pickerComponent: DatePickerComponent;
  showPicker: boolean;
  isShown: boolean;

  constructor(public elementRef: ElementRef) {
    super();
  }

  ngOnInit(): void {
    if (this.required === '') {
      this.required = true;
    }
    if (this.readonly === '') {
      this.readonly = true;
    }
  }

  ngAfterViewInit() {
    $(this.pickerEl.nativeElement).on("show.bs.dropdown", () => {
      this.showPicker = this.isShown = true;
      this.pickerComponent?.updateCalendar();
      return true;
    });
    $(this.pickerEl.nativeElement).on("hide.bs.dropdown", () => {
      this.isShown = false;
      return true;
    });
  }

  selectRange = (range: MomentDateFieldRange) => {
    this.writeValue({
      label: range.label,
      start: range.start.toISOString(),
      end: range.end.toISOString()
    });
    this.onModelChange();
    dispatchChangeEvent(this.elementRef.nativeElement);
    this.closeCalendar();
  }

  openCalendar = () => {
    const dropdownButton = this.getDropdownButton();
    dropdownButton.dropdown("show");
    setTimeout(() => dropdownButton.dropdown("update"), 0);
  };

  closeCalendar = () => {
    this.getDropdownButton().dropdown("hide");
  }

  getDropdownButton = () => {
    return $(this.elementRef.nativeElement).find('[data-bs-toggle="dropdown"]:first');
  }

  updateCalendarStartDate = (): void => {
    this._calendarStartDate = {
      start: moment(this._date.start),
      end: moment(this._date.end)
    }
  };

  onTimeChanged($event: any) {
    this.reformat();
    this.onModelChange();
    dispatchChangeEvent(this.elementRef.nativeElement);
  }

  onDatePickerChanged = (d: DatePickerRange) => {
    this.date = {
      start: DatePickerComponent.getTimeInfoFromDate(d.start),
      end: DatePickerComponent.getTimeInfoFromDate(d.end)
    };
    this.writeValue(this.pickerRangeToDateRange(d));
    this.onDateChange();
    this.closeCalendar();
  }

  onDateChange = () => {
    const dates = this.formattedDate.split(this.separator);
    let ranges: DateFieldRange;
    if (dates.length == 2) {
      ranges = {
        start: moment(dates[0], this.getDisplayFormat()).toISOString(),
        end: moment(dates[1], this.getDisplayFormat()).toISOString()
      }
    } else if (this.formattedDate) {
      ranges = {
        start: moment(this.formattedDate, this.getDisplayFormat()).toISOString(),
        end: moment(this.formattedDate, this.getDisplayFormat()).clone().add(14, 'day').toISOString()
      }
    }
    if (this.includeTime && ranges) {
      ranges = {
        start: this.dateToIsoString(moment(ranges.start), this.startTime, this.getDisplayFormat()),
        end: this.dateToIsoString(moment(ranges.end), this.endTime, this.getDisplayFormat()),
      }
    }
    this.writeValue(ranges ? ranges : (this.formattedDate ? this.pickerRangeToDateRange(this._date) : null));
    this.onModelChange();
    dispatchChangeEvent(this.elementRef.nativeElement);
  };

  get value(): DateFieldRange {
    if (this.includeTime && lodash.isEqual(this._date.start, this._date.end) && lodash.isEqual(this.startTime, this.endTime)) {
      this.startTime = {hour: 0, minute: 0, second: 0};
      this.endTime = {hour: 23, minute: 59, second: 59};
    }

    if (this.includeTime && lodash.isEqual(this._date.start, this._date.end)) {
      this._date.start = this._date.start.clone().startOf('day');
      this._date.end = this._date.end.clone().endOf('day');
    }
    const date: DateFieldRange = this._date?.start && this._date?.end
        ? {
          start: this.dateToIsoString(this._date.start, this.startTime, moment.defaultFormat),
          end: this.dateToIsoString(this._date.end, this.endTime, moment.defaultFormat),
        } : null;
    if (date) {
      date.label = DateRangeUtils.getRangeLabel(this._date, this.ranges);
    }
    return date;
  }

  writeValue(value: DateFieldRange): void {
    value = !value || !value.start || !value.end ? null : value;
    if (!this._date) {
      this._date = {
        start: null,
        end: null
      };
    }
    let changed = !value;
    if (!value && this.localStorageKey) {
      const preference: LocalStorageSettings = JSON.parse(localStorage.getItem(this.localStorageKey));
      changed = true;
      if (preference) {
        value = ({
          start: moment().startOf('day').subtract(preference.daysBefore, 'd').format('YYYY-MM-DD'),
          end: moment().startOf('day').add(preference.daysAfter, 'd').format('YYYY-MM-DD')
        });
      }
    }
    if (!value) {
      const today = moment().startOf('day');
      this._date.start = today.clone().subtract(7, 'day');
      this._date.end = today.clone().add(7, 'day');
      this.updateCalendarStartDate();
      this.reformat();
      this.onModelChange();
      return;
    }
    const [start, end] = [value.start, value.end];
    let startMoment = moment(start);
    this._date.start = this.validateDate(startMoment);
    let endMoment = moment(end);
    this._date.end = this.validateDate(endMoment);
    if (this.includeTime) {
      this.startTime = {hour: startMoment.hour(), minute: startMoment.minute(), second: startMoment.second()};
      this.endTime = {hour: endMoment.hour(), minute: endMoment.minute(), second: endMoment.second()};
    }
    this.updateCalendarStartDate();
    this.reformat();

    if (this.localStorageKey && value) {
      const now = moment().startOf('day');
      let daysBefore = now.diff(moment(value.start), 'days')
      let daysAfter = moment(value.end).diff(now, 'days');

      localStorage.setItem(this.localStorageKey, JSON.stringify(<LocalStorageSettings>{
        daysBefore: daysBefore,
        daysAfter: daysAfter
      }));
    }

    if (changed) {
      this.onModelChange();
    }
  }

  private validateDate = (date: Moment): Moment => {
    if (!date || !date.isValid()) {
      return date;
    }
    if (this._minDate && date.isBefore(this._minDate)) {
      return this._minDate;
    }
    return date;
  };

  private reformat = () => {
    const displayFormat = this.getDisplayFormat();
    this.formattedDate = this._date.start
      ? this.dateToIsoString(this._date.start, this.startTime, displayFormat) + (this._date.end ? this.separator + this.dateToIsoString(this._date.end, this.endTime, displayFormat) : "")
      : "";
  };

  private pickerRangeToDateRange(d: DatePickerRange): DateFieldRange {
    const date: PickerDateTimeRange = {
      start: DatePickerComponent.getTimeInfoFromDate(d.start),
      end: DatePickerComponent.getTimeInfoFromDate(d.end)
    };
    return {
      start: this.dateToIsoString(moment(date.start), this.startTime, moment.defaultFormat),
      end: this.dateToIsoString(moment(date.end), this.endTime, moment.defaultFormat),
    }
  }

  private getDisplayFormat(): string {
    return this.includeTime ? 'MMM DD, YYYY HH:mm:ss' : this.inputMode === "input" ? 'MMM DD, YYYY' : moment.defaultFormat;
  }

  private dateToIsoString(date: Moment, time: TimePickerInfo, displayFormat: string): string {
    if (!date) {
      return null;
    }
    if (!this.includeTime || !time) {
      time = {hour: 0, minute: 0, second: 0};
    }
    const m = moment({y: date.year(), M: date.month(), d: date.date(), h: time.hour, m: time.minute, s: time.second});
    return m.isValid() ? m.format(displayFormat) : null;
  }
}

interface LocalStorageSettings {
  daysBefore: number;
  daysAfter: number;
}
