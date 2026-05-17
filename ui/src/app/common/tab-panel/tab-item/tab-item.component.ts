import {Component, Input, TemplateRef, ViewChild} from '@angular/core';

@Component({
    selector: 'app-tab-item',
    templateUrl: './tab-item.component.html',
    styleUrls: ['./tab-item.component.scss'],
    standalone: false
})
export class TabItemComponent {
  @ViewChild("tabHeader") tabHeader: TemplateRef<any>;
  @Input() templateRef!: TemplateRef<any>;
  @Input() routerLink: string;
  @Input() externalLink: string;
  @Input() tabClass: string;
}
