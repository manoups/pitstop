import {Component} from '@angular/core';
import {Handler} from "../../../../common/handler";
import {subscribeTo} from "../../../../common/app-common-utils";
import {Observable} from "rxjs";
import {BreadcrumbInfo} from "../../../../routing/router-handler";

@Component({
    selector: 'app-breadcrumb',
    templateUrl: './breadcrumb.component.html',
    styleUrls: ['./breadcrumb.component.scss'],
    standalone: false
})
@Handler()
export class BreadcrumbComponent {
  breadcrumbs: Observable<BreadcrumbInfo[]> = subscribeTo("getBreadcrumbs");
}
