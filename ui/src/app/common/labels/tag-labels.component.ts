import {Component, Input} from '@angular/core';

@Component({
    selector: 'app-tag-labels',
    templateUrl: './tag-labels.component.html',
    styleUrls: ['./tag-labels.component.scss'],
    standalone: false
})
export class TagLabelsComponent {
  @Input() labels: any[];
  @Input() itemTemplate;
  @Input() formatter;
}
