import {NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {TypeaheadWindowComponent} from "./typeahead/typeahead-window.component";
import {PopoverComponent} from "./popover/popover.component";
import {TooltipComponent} from "./tooltip/tooltip.component";
import {PopoverDirective} from "./popover/popover.directive";
import {DateRangeComponent} from "./date/date-range/date-range.component";
import {DateFieldComponent} from "./date/date-field/date-field.component";
import {DatePickerComponent} from "./date/date-picker/date-picker.component";
import {SelectComponent} from "./select/select.component";
import {TimestampPipe} from "./date/timestamp.pipe";
import {LocalFilterComponent} from "./search/local-filter/local-filter.component";
import {TagsComponent} from "./tags/tags.component";
import {ConfirmationToggleComponent} from "./confirmation-toggle/confirmation-toggle.component";
import {FormFieldComponent} from "./form-field/form-field.component";
import {TabPanelComponent} from "./tab-panel/tab-panel.component";
import {TabItemComponent} from "./tab-panel/tab-item/tab-item.component";
import {TypeaheadDirective} from "./typeahead/typeahead.directive";
import {TimePickerComponent} from "./date/time-picker/time-picker.component";
import {AutoFocusDirective} from "./auto-focus.directive";
import {SearchComponent} from "./search/search/search.component";
import {FormComponent} from "./form/form.component";
import {PaginationComponent} from "./pagination/pagination.component";
import {SentenceCasePipe} from "./sentence-case.pipe";
import {ScrollerComponent} from "./scroller/scroller.component";
import {MultiInputComponent} from "./multi-input/multi-input.component";
import {ModalConfirmAutofocus} from "./modal-confirm/modal-confirm.component";
import {RouteReuseStrategy} from "@angular/router";
import {RouteStrategyService} from "./utils/route-strategy.service";
import {ModalComponent} from "./modal/modal.component";
import {
  DefaultConfirmationDialogComponent
} from "./confirmation-modal/default-confirmation-dialog/default-confirmation-dialog.component";
import {ConfirmationModalComponent} from "./confirmation-modal/confirmation-modal.component";
import {HighlightComponent} from "./typeahead/highlight/highlight.component";
import {AlertingComponent} from "./alerting/alerting.component";
import {StatusAlertComponent} from "./alerting/status-alert/status-alert.component";
import {BootstrapTooltipDirective} from "./bootstrap-tooltip.directive";
import {ActiveWhenUrlMatchesDirective} from "./active-when-url-matches.directive";
import {FilterComponent} from "./search/filter/filter.component";
import {OverviewComponent} from "./overview/overview.component";
import {WebsocketService} from './websocket.service';
import {DatePeriodRangeComponent} from './date/date-period-range/date-period-range.component';
import {DefaultValueDirective} from './default-value.directive';
import {CountrySelectComponent} from "./country-select/country-select.component";
import {TagLabelsComponent} from "./labels/tag-labels.component";

export const commonDeclarations = [
  // Pipes
  TimestampPipe,
  SentenceCasePipe,

  // Directives
  PopoverDirective,
  AutoFocusDirective,
  TypeaheadDirective,

  // Components
  TooltipComponent,
  DateFieldComponent,
  DateRangeComponent,
  DatePickerComponent,
  DatePeriodRangeComponent,
  SelectComponent,
  FilterComponent,
  SearchComponent,
  LocalFilterComponent,
  MultiInputComponent,
  TagsComponent,
  ConfirmationToggleComponent,
  ScrollerComponent,
  FormFieldComponent,
  TabPanelComponent,
  TabItemComponent,
  TimePickerComponent,
  FormComponent,
  CountrySelectComponent,
  TagLabelsComponent,

  BootstrapTooltipDirective,
  ActiveWhenUrlMatchesDirective,

  // Alerting
  AlertingComponent,
  StatusAlertComponent,

  // Modal
  ConfirmationModalComponent,
  DefaultConfirmationDialogComponent,
  ModalComponent,
  PaginationComponent,
  ModalConfirmAutofocus,

  // Overview
  OverviewComponent,
]

@NgModule({ declarations: [
        commonDeclarations,
        DefaultValueDirective
    ],
    exports: [
        commonDeclarations,
        PaginationComponent,
        DefaultValueDirective,
    ], imports: [BrowserModule,
        CommonModule,
        FormsModule,
        TypeaheadWindowComponent,
        PopoverComponent,
        HighlightComponent], providers: [
        SentenceCasePipe,
        { provide: RouteReuseStrategy, useClass: RouteStrategyService },
        WebsocketService
    ] })
export class CommonsModule {

}
