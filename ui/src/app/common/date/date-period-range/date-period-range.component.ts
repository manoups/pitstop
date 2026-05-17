import {Component, EventEmitter, Input, Output} from '@angular/core';
import moment, {unitOfTime} from "moment";
import {DateFieldRange, MomentDateFieldRange} from "../date-range/date-field-range";
import {DatePickerRange} from "../date-picker/date-picker.component";
import {DateRangeUtils} from "../date-range/date-range.utils";
import {localTimeFormat} from "../../utils";
import lodash from "lodash";
import {TranslateDirective} from "../../utils/translate.directive";

@Component({
    selector: 'app-date-period-range',
    templateUrl: './date-period-range.component.html',
    styleUrls: ['./date-period-range.component.scss'],
    standalone: false
})
export class DatePeriodRangeComponent {
  @Input() period: DateFieldRange;
  @Output() periodChange: EventEmitter<DateFieldRange> = new EventEmitter<DateFieldRange>();

  ranges: MomentDateFieldRange[] = [PERIOD_RANGES.thisMonth, PERIOD_RANGES.previousMonth, PERIOD_RANGES.thisYear, PERIOD_RANGES.previousYear,
    PERIOD_RANGES.lastTwelveMonths];

  movePeriodBack = () => {
    this.period = this.getPreviousDateTimeRange();
    this.periodChange.emit(this.period);
  }

  movePeriodForward = () => {
    this.period = this.getNextDateTimeRange();
    this.periodChange.emit(this.period);
  }

  dateRangeChanged(dateTimeRange: DateFieldRange) {
    this.period = {
      start: dateTimeRange.start,
      end: dateTimeRange.end,
      label: dateTimeRange.label
    };
    this.periodChange.emit(this.period);
  }


  get dateLabel(): string {
    if (!this.period) {
      return "";
    }
    const timeRange: MomentDateFieldRange = {
      start: moment(this.period.start),
      end: moment(this.period.end).subtract(1, "day"),
      label: this.period.label
    };
    if (timeRange.label) {
      return TranslateDirective.getTranslation(timeRange.label, true);
    }
    const isSame = {
      day: timeRange.start.isSame(timeRange.end, 'day'),
      month: timeRange.start.isSame(timeRange.end, 'month'),
      wholeMonth: timeRange.start.isSame(timeRange.end, 'month') && this.isSame(timeRange, 'month'),
      year: timeRange.start.isSame(timeRange.end, 'year'),
      wholeYear: timeRange.start.isSame(timeRange.end, 'year') && this.isSame(timeRange, 'year')
    };
    if (isSame.day && isSame.month && isSame.year) {
      return moment(this.period.start).format("DD MMM YYYY");
    }
    if (isSame.month && isSame.wholeMonth && isSame.year) {
      return moment(this.period.start).format("MMMM YYYY");
    }
    if (isSame.wholeYear) {
      return moment(this.period.start).format("YYYY");
    }
    return `${timeRange.start.format("DD MMM YYYY")} - ${timeRange.end.format("DD MMM YYYY")}`;
  }

  private isSame(timeRange: MomentDateFieldRange, unitOfTime: unitOfTime.StartOf) {
    if (unitOfTime === 'year' && !this.isSame(timeRange, 'month')) {
      return false;
    }
    return timeRange.start.isSame(timeRange.start.clone().startOf(unitOfTime), 'day')
      && timeRange.end.isSame(timeRange.end.clone().endOf(unitOfTime), 'day');
  }

  getPreviousDateTimeRange(): DateFieldRange {
    let {time, resolution, difference} = this.calculateDifference(this.getDateTimeRange());
    const range: DatePickerRange = {
      start: time.start.clone().subtract(difference, resolution),
      end: time.start
    };
    const label = DateRangeUtils.getRangeLabel(range, this.ranges);
    return {
      start: range.start.toISOString(),
      end: range.end.toISOString(),
      label: label
    }
  }

  getNextDateTimeRange(): DateFieldRange {
    let {time, resolution, difference} = this.calculateDifference(this.getDateTimeRange());
    const range: DatePickerRange = {
      start: time.end.clone(),
      end: time.end.clone().add(difference, resolution)
    }
    const label = DateRangeUtils.getRangeLabel(range, this.ranges);
    return {
      start: range.start.toISOString(),
      end: range.end.toISOString(),
      label: label
    }
  }

  private calculateDifference(dateTimeRange: DateFieldRange) {
    const time = {
      start: moment(dateTimeRange.start),
      end: moment(dateTimeRange.end)
    };
    const resolutions: unitOfTime.Diff[] = ["year", "month", "day"];
    const result = resolutions.map(resolution => {
      let difference = time.end.diff(time.start, resolution, true);
      return lodash.inRange(difference, 0.95, 1.05) ? {resolution: resolution, difference: difference} : null;
    }).find(r => r);

    return {time: time, resolution: result.resolution, difference: result.difference};
  }

  getDateTimeRange = (): DateFieldRange => this.period ? {
    start: moment(this.period.start).format(localTimeFormat),
    end: moment(this.period.end).format(localTimeFormat),
    label: this.period.label
  } : null
}

export const PERIOD_RANGES: { [key: string]: MomentDateFieldRange } = {
  thisMonth: {
    label: 'This month',
    start: moment().startOf('month'),
    end: moment().add(1, "month").startOf('month')
  },
  previousMonth: {
    label: 'Previous month',
    start: moment().startOf('month').subtract(1, 'month'),
    end: moment().startOf('month')
  },
  thisYear: {
    label: 'This year',
    start: moment().startOf('year'),
    end: moment().add(1, "year").startOf('year')
  },
  previousYear: {
    label: 'Previous year',
    start: moment().startOf('year').subtract(1, 'year'),
    end: moment().startOf('year')
  },
  lastTwelveMonths: {
    label: 'Last 12 months',
    start: moment().subtract(1, 'year').add(1, 'month').startOf('month'),
    end: moment().startOf('month').add(1, 'month')
  },
  lastWeek: {
    label: 'Last week',
    start: moment().subtract(1, 'week').startOf('week'),
    end: moment().startOf('week')
  }
}
