import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {lodash} from '../utils';

@Component({
    selector: 'app-pagination',
    templateUrl: './pagination.component.html',
    styleUrls: ['./pagination.component.scss'],
    standalone: false
})
export class PaginationComponent<T> implements OnChanges {
  @Input() maxPerPage = 20;
  @Input() page: number = 1;
  @Input() items: T[] = [];
  @Input() maxSize: number = 10;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageChangeItems = new EventEmitter<T[]>();

  pages: Pages = {
    start: this.page,
    end: this.page + this.maxSize
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.applyPages();
  }

  private applyPages() {
    let start = 0;
    let end = this.totalPages();
    let leftOffset = Math.floor(this.maxSize / 2);
    let rightOffset = this.maxSize % 2 === 0 ? leftOffset - 1 : leftOffset;

    if (this.page <= leftOffset) {
      // very beginning, no rotation -> [0..maxSize]
      end = this.maxSize;
    } else if (this.totalPages() - this.page < leftOffset) {
      // very end, no rotation -> [len-maxSize..len]
      start = this.totalPages() - Math.min(this.maxSize, this.totalPages());
    } else {
      // rotate
      start = this.page - leftOffset - 1;
      end = this.page + rightOffset;
    }
    this.pages = {
      start: start + 1,
      end: Math.min(end, this.totalPages())
    };
  }

  getItemsOnPage(): T[] {
    if (this.items.length === 0) {
      this.page = 1;
      return [];
    }
    const chunks = lodash.chunk(this.items, this.maxPerPage);
    if (this.page > chunks.length) {
      this.page = chunks.length;
    }
    return chunks[this.page - 1];
  }

  moveToPage = (page: number) => {
    const pageChanged = this.page != page;
    this.page = page;
    if (pageChanged) {
      this.pageChange.emit(page);
      this.pageChangeItems.emit(this.getItemsOnPage());
    }
    this.applyPages();
  };

  totalPages = (): number => Math.ceil(this.items.length / this.maxPerPage);

  pagesArray = (): number[] => lodash.range(this.pages.start, this.pages.end + 1, 1);

  isCurrentPage = (page: number) => this.page === page;

  isFirstPage = () => this.page === 1;

  isLastPage = () => this.page === this.totalPages();
}

interface Pages {
  start: number;
  end: number;
}
