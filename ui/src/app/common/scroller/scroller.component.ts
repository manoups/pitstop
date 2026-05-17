import {AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';

@Component({
    selector: 'app-scroller',
    templateUrl: './scroller.component.html',
    styleUrls: ['./scroller.component.scss'],
    standalone: false
})
export class ScrollerComponent implements AfterViewInit {

  @Output() endReached = new EventEmitter();
  @Input() windowScroll: boolean;

  @ViewChild("wrapper", {static: true}) private wrapperElement: ElementRef<HTMLDivElement>;
  private _offset: number = 1000;

  ngAfterViewInit(): void {
    if (this.windowScroll) {
      $(window).on('scroll', this.onScrollWindow);
    } else {
      $(this.wrapper).on('scroll', this.onScroll);
    }
  }

  private get wrapper() {
    return this.wrapperElement.nativeElement;
  }

  private onScrollWindow = () => {
    if (window.innerHeight + window.scrollY + this._offset > (this.wrapper.offsetTop + this.wrapper.offsetHeight)) {
      this.endReached.emit();
    }
  };

  private onScroll = (event: Event) => {
    const target = event.target as any;
    if (target.scrollHeight - target.scrollTop < (this.wrapper.offsetTop + this.wrapper.offsetHeight)) {
      this.endReached.emit();
    }
  }
}
