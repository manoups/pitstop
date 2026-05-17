import {AfterContentInit, Component, ContentChildren, inject, Input, QueryList} from '@angular/core';
import {TabItemComponent} from "./tab-item/tab-item.component";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
    selector: 'app-tab-panel',
    templateUrl: './tab-panel.component.html',
    styleUrls: ['./tab-panel.component.scss'],
    standalone: false
})
export class TabPanelComponent implements AfterContentInit {
  route: ActivatedRoute = inject(ActivatedRoute);
  router: Router = inject(Router);

  @ContentChildren(TabItemComponent) tabs!: QueryList<TabItemComponent>;
  activeComponent!: TabItemComponent;
  @Input() activeIndex: number = 0;

  ngAfterContentInit() {
    const tabItemComponents = this.tabs.toArray();
    this.activeComponent = tabItemComponents[Math.min(tabItemComponents.length - 1, this.activeIndex || 0)];
  }

  activateTab(tab: TabItemComponent) {
    if (tab.externalLink) {
      window.open(tab.externalLink, '_blank').focus();
      return;
    }
    if (tab.routerLink) {
      this.router.navigate([tab.routerLink], {relativeTo: this.route});
    }
    this.activeComponent = tab;
  }
}
