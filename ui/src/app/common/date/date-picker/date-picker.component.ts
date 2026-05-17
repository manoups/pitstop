import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Moment, unitOfTime} from "moment/moment";
import lodash from "lodash";
import moment from "moment";
import {AppCommonUtils} from "../../app-common-utils";


@Component({
    selector: 'app-date-picker',
    templateUrl: './date-picker.component.html',
    styleUrls: ['./date-picker.component.scss'],
    standalone: false
})
export class DatePickerComponent {
    @Input() yearSpan: number = 10;

    @Input() range: boolean = false;
    @Output() dateChanged: EventEmitter<DatePickerRange> = new EventEmitter<DatePickerRange>();

    private localeData = moment.localeData(AppCommonUtils.getPreferredLanguage());

    protected monthNames = this.localeData.monthsShort();
    protected days = this.localeData.weekdaysShort().map(s => s.substring(0, 2));
    protected calendar: { [yearMonth: string]: MonthCalendar } = {};
    protected sortedCalendar: MonthCalendar[];
    protected month: string;
    protected year: number;

    private dateInfo: PickerDateTimeRange;
    private _date: DatePickerRange;
    private _minDate: Moment;
    private _numberOfCalendars: number;
    private calendarDate: Moment;

    private rangeSelection: {
        start?: DateTimeInfo;
        end?: DateTimeInfo;
        hover?: DateTimeInfo;
        clickCount?: number;
    } = {};

    constructor() {
        this._numberOfCalendars = 1;
    }

    @Input() set numberOfCalendars(calendars: number) {
        this._numberOfCalendars = calendars;
        this.updateCalendar();
    }

    @Input() set date(date: DatePickerRange) {
        const d = date || {
            start: moment(),
            end: moment()
        };
        if (!d.start?.isValid()) {
            d.start = moment();
        }
        if (!d.end?.isValid()) {
            d.end = moment();
        }
        this._date = {
            start: d.start.clone().local(),
            end: d.end.clone().local()
        };
        this.rangeSelection = {};
        this.setLocalDateVariables(this._date);
    }

    @Input() set minDate(minDate: Moment | string) {
        this._minDate = typeof minDate === "string" ? moment(minDate) : minDate;
        this.updateCalendar();
    }

    private setLocalDateVariables(date: DatePickerRange) {
        this.dateInfo = {
            start: DatePickerComponent.getTimeInfoFromDate(date.start),
            end: DatePickerComponent.getTimeInfoFromDate(date.end)
        };
        this.month = this.monthNames[this.dateInfo.start.month]
        this.year = this.dateInfo.start.year;
        this.calendarDate = date.start.clone();
        this.updateCalendar();
    }

    get years(): number[] {
        return lodash.range(this._date.start.year() - this.yearSpan, this._date.start.year() + this.yearSpan, 1);
    }

    get isSelectingRange(): boolean {
        return (this.rangeSelection.clickCount || 0) !== 0;
    }

    isCurrentDay(date: Moment) {
        return this.isSelected(date, this._date.start) || (!this._date.start.isSame(this._date.end, 'day') && this.isSelected(date, this._date.end, false));
    }

    isSelectedDate(date: Moment) {
        if (this.range && this.rangeSelection.start && this.rangeSelection.end && (this.isSelected(date, moment(this.rangeSelection.start)) || this.isSelected(date, moment(this.rangeSelection.end)))) {
            return true;
        }
        return this.isSelected(date, this.getValue().start) || this.isSelected(date, this.getValue().end, false);
    }

    private isSelected(date: Moment, toCheck: Moment, inclusive: boolean = true) {
        return inclusive
            ? date.year() === toCheck.year() && date.month() === toCheck.month() && date.date() === toCheck.date()
            : this.isSelected(date, toCheck.clone().subtract(1, 'day'), true);
    }

    changeDate(date: Moment) {
        let info: DateTimeInfo = {
            day: date.date(),
            month: date.month(),
            year: date.year()
        };
        const isEndDate = this.range && (this.rangeSelection.clickCount || 0) !== 0;
        if (isEndDate) {
            let newDate = date.clone().add(1, 'day');
            info = {
                day: newDate.date(),
                month: newDate.month(),
                year: newDate.year()
            };
        }
        if (this.range) {
            this.month = this.monthNames[date.month()];
            this.year = date.year();
            this.rangeSelection.clickCount = (this.rangeSelection.clickCount || 0);
            if (this.rangeSelection.clickCount === 0) {
                this.rangeSelection.start = info;
                this.rangeSelection.end = null;
            } else {
                this.rangeSelection.end = info;
            }
            this.rangeSelection.clickCount++;
            if (this.rangeSelection.clickCount == 2) {
                let dates = {start: moment(this.rangeSelection.start), end: moment(this.rangeSelection.end)};
                const startIsBeforeEnd = dates.start.isBefore(dates.end, "day");
                this.dateInfo.start = startIsBeforeEnd ? this.rangeSelection.start : this.rangeSelection.end;
                this.dateInfo.end = startIsBeforeEnd ? this.rangeSelection.end : this.rangeSelection.start;
                this.rangeSelection.clickCount = 0;
                this.updateDate();
            }
            this.updateCalendar();
        } else {
            this.dateInfo.start = this.dateInfo.end = info;
            this.month = this.monthNames[date.month()];
            this.year = date.year();
            this.updateDate();
        }
    }

    updateDate() {
        this.dateChanged.emit(this.getValue());
    }

    selectMonth = (month: string) => {
        const monthIndex = this.monthNames.indexOf(month);
        this.calendarDate.month(monthIndex);
        this.updateCalendar();
    }

    selectYear = (year: number) => {
        this.calendarDate.year(year);
        this.updateCalendar();
    }

    previous = (unit: unitOfTime.All) => {
        const value = this.getValue();
        value.start = this.calendarDate;
        value.start.set(unit, value.start.get(unit) - 1);
        this.setLocalDateVariables(value);
    }

    next = (unit: unitOfTime.All) => {
        const value = this.getValue();
        value.start = this.calendarDate;
        value.start.set(unit, value.start.get(unit) + 1);
        this.setLocalDateVariables(value);
    }

    private getValue = () => (<DatePickerRange>{
        start: moment(this.dateInfo.start),
        end: moment(this.dateInfo.end)
    });

    private getRangeSelection = (): DatePickerRange => {
        if (!this.rangeSelection.start && !this.rangeSelection.end) {
            return {
                start: this._date.start ? moment(this._date.start) : (this.dateInfo.start ? moment(this.dateInfo.start) : null),
                end: this._date.end ? moment(this._date.end) : (this.dateInfo.end ? moment(this.dateInfo.end) : null)
            };
        } else {
            return {
                start: this.rangeSelection.start ? moment(this.rangeSelection.start) : null,
                end: this.rangeSelection.hover ? moment(this.rangeSelection.hover) : null
            };
        }
    };

    updateCalendar() {
        const calendarDate = this.calendarDate || this.getValue().start;
        const rangeSelection = this.getRangeSelection();
        const calendars: MonthCalendar[] = lodash.range(0, this._numberOfCalendars)
            .map(i => this.createCalendar(i, calendarDate.clone().startOf('month')));

        calendars.forEach(c => {
            c.weeks.forEach(w => w.days.forEach(d => {
                const day: Day = this.getCalendarDay(d.date, rangeSelection, c.monthRange);
                d.date = day.date;
                d.withinSelection = day.withinSelection;
                d.disabled = day.disabled;
                d.insideMonth = day.insideMonth;
                d.hidden = day.hidden;
                d.cssClasses = this.getCellClass(d, rangeSelection);
            }));
            this.calendar[c.key] = c;
        });

        for (let month in this.calendar) {
            const monthCalendar = this.calendar[month];
            if (!calendars.some(c => c.key === monthCalendar.key)) {
                delete this.calendar[month];
            }
        }
        this.sortedCalendar = Object.values(this.calendar)
            .sort((a, b) => a.startDate > b.startDate ? 1 : -1);
    }

    private getCalendarDay(d: Moment, rangeSelection: DatePickerRange, month: DatePickerRange): Day {
        const start = rangeSelection.start.isBefore(rangeSelection.end) ? rangeSelection.start : rangeSelection.end;
        const end = rangeSelection.start.isAfter(rangeSelection.end) ? rangeSelection.start : rangeSelection.end;
        const day: Day = {
            date: d,
            withinSelection: this.range && d.isBetween(start, end, 'day', '[)'),
            insideMonth: d.isBetween(month.start, month.end, "day", "[]"),
            disabled: this._minDate ? d.isBefore(this._minDate, 'day') : false,
            hidden: this.range && !d.isBetween(month.start, month.end, 'day', '[]')
        };
        day.cssClasses = this.getCellClass(day, rangeSelection);
        return day;
    }

    cellMouseEnter(d: Day) {
        if (this.range && this.isSelectingRange) {
            const date = d.date.clone();
            this.rangeSelection.hover = DatePickerComponent.getTimeInfoFromDate(date);
            this.updateCalendar();
        }
    }

    getCellClass(d: Day, rangeSelection: DatePickerRange) {
        const isPrimary = this.isCurrentDay(d.date) && !this.isSelectingRange;
        const isSelection = ((!this.isCurrentDay(d.date) || this.isSelectingRange) && d.withinSelection) || (this.isHoveredDate(d.date) && !isPrimary);
        const startSelection = d.withinSelection && ((!this.isSelectingRange && this.isSelected(d.date, this._date.start))
            || (this.isSelectingRange && this.isSelected(d.date, rangeSelection.start)));
        const endSelection = d.withinSelection && ((!this.isSelectingRange && this.isSelected(d.date, this._date.end, false))
            || (this.isSelectingRange && this.isSelected(d.date, rangeSelection.end, false)));
        return {
            'disabled': !d.insideMonth,
            'invisible': d.hidden,
            'bg-info': isSelection,
            'bg-primary': isPrimary,
            'bg-hovered': (!this.isSelectedDate(d.date) || this.isSelectingRange) && d.withinSelection && !isPrimary,
            'rounded-0': d.withinSelection || startSelection || endSelection,
            'rounded-start': startSelection,
            'rounded-end': endSelection
        }
    }

    isHoveredDate = (date: Moment) => {
        return this.isSelected(date, moment(this.dateInfo.start));
    }

    sortCalendar = (a: MonthCalendar, b: MonthCalendar) => {
        return a.startDate > b.startDate ? 1 : -1;
    }

    static getTimeInfoFromDate = (date: Moment): DateTimeInfo => ({
        year: date.year(),
        month: date.month(),
        day: date.date(),
        hour: date.clone().local().hour(),
        minute: date.minute(),
        second: date.seconds(),
        millisecond: date.milliseconds()
    })

    private createCalendar(index: number, startDay: Moment): MonthCalendar {
        const date: Moment = startDay.clone().month(startDay.month() + index);
        const month = date.format('MM-YYYY');
        if (this.calendar[month]) {
            return this.calendar[month];
        }
        const weeksInMonth = this.getWeeksInMonth(date);
        const weeks = new Map<string, Calendar>();
        weeksInMonth.forEach(w => weeks.set(w, this.getDays(w)));

        return {
            startDate: date.clone().toISOString(),
            key: month,
            monthRange: {
                start: date.clone().startOf('month'),
                end: date.clone().endOf('month'),
            },
            month: date.clone().set("month", date.month()).locale(AppCommonUtils.getPreferredLanguage()).format('MMMM'),
            weeks: weeks
        }
    }

    private getDays(weekYear: string): Calendar {
        const startOfWeek = moment(weekYear, 'YYYY-ww').startOf('week');
        const days = lodash.range(0, 7, 1)
            .map((v) => (<Day>{
                date: startOfWeek.clone().add(v, 'day')
            }));
        return {
            days: days
        }
    }

    private getWeeksInMonth(date: Moment) {
        const firstDayOfMonth = date.clone().startOf('day');
        const numOfDays = firstDayOfMonth.daysInMonth();
        let weeks = new Set<string>();

        for (let i = 0; i < numOfDays; i++) {
            const currentDay = moment(firstDayOfMonth, 'YYYY-MM-DD').add(i, 'day');
            weeks.add(currentDay.clone().endOf('week').format('YYYY-ww'));
        }

        return Array.from(weeks);
    }
}

export interface DatePickerRange {
    start: Moment;
    end: Moment;
}

export interface PickerDateTimeRange {
    start: DateTimeInfo;
    end: DateTimeInfo;
}

export interface DateTimeInfo {
    year?: number;
    month?: number;
    day?: number;
    hour?: number;
    minute?: number;
    second?: number;
    millisecond?: number;
}

interface MonthCalendar {
    key: string;
    startDate: string;
    month: string;
    monthRange: DatePickerRange;
    weeks: Map<string, Calendar>;
}

interface Calendar {
    days: Day[]
}

interface Day {
    date: Moment;
    withinSelection?: boolean;
    insideMonth?: boolean;
    disabled?: boolean;
    hidden?: boolean;
    cssClasses?: any;
}
