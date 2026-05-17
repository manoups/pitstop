import {Directive, ElementRef, Input, OnDestroy, OnInit, Renderer2} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {Subscription} from 'rxjs';

@Directive({
    selector: '[routerLink]',
    standalone: false
})
export class ActiveWhenUrlMatchesDirective implements OnInit, OnDestroy {

    @Input() public routerLink: string;
    private readonly subscription: Subscription;

    constructor(private renderer: Renderer2, private hostElement: ElementRef, router: Router) {
        this.subscription = router.events.subscribe(e => {
            if (e instanceof NavigationEnd) {
                this.toggleClass();
            }
        });
    }

    ngOnInit(): void {
        this.toggleClass();
    }

    private toggleClass = () => {
        let activePath = decodeURIComponent(window.location.pathname);
        if (this.routerLink === activePath) {
            this.renderer.addClass(this.hostElement.nativeElement, 'active');
        } else {
            this.renderer.removeClass(this.hostElement.nativeElement, "active");
        }
    };

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
