import {AfterViewInit, Component, EventEmitter, Input, Output} from '@angular/core';
import {Observable, Observer} from "rxjs";
import {tap} from "rxjs/operators";

@Component({
    selector: 'app-overview',
    templateUrl: './overview.component.html',
    styleUrls: ['./overview.component.scss'],
    standalone: false
})
export class OverviewComponent implements AfterViewInit {
  @Input() windowScroll: boolean;
  @Input() localPaging: boolean = true;
  @Output() dataChange: EventEmitter<any[]> = new EventEmitter<any[]>();

  from: number = 0;
  maxItems: number = 50;
  endReached: boolean;
  loading: boolean;
  loadCount: number = 0;
  data: any[];
  allData: any[];

  private query: Observable<any[]>;
  private append: boolean;

  @Input("query")
  set setQuery(o: Observable<any[]>) {
    this.append = false;
    this.query = o ? this.tapQuery(o) : null;
    if (this.query) {
      this.query.subscribe();
    }
  }

  ngAfterViewInit(): void {
    this.loadData();
  }

  get isEmpty() {
    return !this.loading && (!this.data || this.data.length === 0);
  }

  protected loadNextPage = () => {
    if (!this.endReached && !this.loading) {
      this.from += this.maxItems;
      this.loadData(true);
    }
  }

  protected loadData = (append: boolean = false) => {
    this.endReached = false;
    this.data = append ? this.data : [];
    this.append = append;
    if (this.localPaging) {
      const r = (this.allData || []).slice(this.from, this.from + this.maxItems);
      this.setData(r, this.append);
    } else {
      this.query?.subscribe(() => this.append = false);
    }
  }

  protected setData = (result: any[], append: boolean) => {
    this.data = append ? this.data.concat(result) : result;
    this.endReached = result.length < this.maxItems;
    this.dataChange.emit(this.data);
    this.append = false;
  }

  private tapQuery(o: Observable<any[]>) {
    o["$subscribe"] = o.subscribe;
    (<any>o.subscribe) = (observer?: Partial<Observer<any[]>>) => {
      return o["$subscribe"](<Observer<any[]>>{
        next: (result: any[]) => {
          this.allData = result;
          const r = this.localPaging ? (this.allData || []).slice(0, this.from + this.maxItems) : this.allData;
          this.setData(r, this.append);
          this.loadCount++;
          if (observer?.next) {
            observer?.next(result);
          }
        },
        error: (error: any) => observer?.error ? observer.error(error) : null,
        complete: () => observer?.complete ? observer?.complete() : null
      })
    };
    return o;
  }
}
