import {Directive, ElementRef, NgZone} from '@angular/core';
import translations from 'src/assets/translation/translations.json';
import {AppCommonUtils} from "../app-common-utils";

@Directive({
    selector: '[appTranslate]',
    standalone: false
})
export class TranslateDirective {
    static translations = translations;

    constructor(private elementRef: ElementRef, private ngZone: NgZone) {
        this.tryTranslate(this.elementRef.nativeElement);
        this.ngZone.runOutsideAngular(() => {
            const observer = new MutationObserver(
                () => this.tryTranslate(this.elementRef.nativeElement));
            observer.observe(this.elementRef.nativeElement, {attributes: false, childList: true, subtree: true});
        });
    }

    tryTranslate(element: Element) {
        this.ngZone.runOutsideAngular(() => {
            if (element.classList.contains("notranslate")) {
                return;
            }
            if (!this.translateContent(element)) {
                if (element.childElementCount > 0) {
                    for (let i = 0; i < element.children.length; i++) {
                        this.tryTranslate(element.children.item(i));
                    }
                    for (let i = 0; i < element.childNodes.length; i++) {
                        this.translateNode(element.childNodes.item(i));
                    }
                }
            }
            this.translatePlaceholder(element);
            this.translateTitle(element);
            this.translateAlt(element);
        });
    }

    private translateContent = (element: Element): boolean => {
        const key = element.innerHTML.trim().toLowerCase();
        const translation = TranslateDirective.getTranslation(key)
        if (translation) {
            element.innerHTML = translation;
            element.classList.add('notranslate');
            return true;
        }
        return false;
    };

    private translateNode = (node: Node) => {
        if (node.nodeType !== Node.TEXT_NODE) {
            return;
        }
        const text = node.nodeValue.trim();
        const key = text.toLowerCase();
        const translation = TranslateDirective.getTranslation(key)
        if (translation) {
            node.nodeValue = node.nodeValue.replace(text, translation);
            node.parentElement.setAttribute("translate", "no");
        }
    };

    private translatePlaceholder = (element: Element) => {
        const placeholder = element.attributes?.getNamedItem('placeholder');
        if (placeholder) {
            const key = placeholder?.value?.trim().toLowerCase();
            const translation = TranslateDirective.getTranslation(key)
            if (translation) {
                placeholder.value = translation;
                element.setAttribute("translate", "no");
            }
        }
    };

    private translateAlt = (element: Element) => {
        const alt = element.attributes?.getNamedItem('alt');
        if (alt) {
            const key = alt?.value?.trim().toLowerCase();
            const translation = TranslateDirective.getTranslation(key)
            if (translation) {
                alt.value = translation;
                element.setAttribute("translate", "no");
            }
        }
    };

    private translateTitle = (element: Element) => {
        const title = element['title'];
        const key = title && title.trim().toLowerCase();
        const translation = TranslateDirective.getTranslation(key);
        if (translation) {
            element['title'] = translation;
            element.setAttribute("translate", "no");
        }
    };

    static getTranslation(key: string, defaultValue?: string | boolean) {
        if (!key) {
            return key;
        }
        const language = AppCommonUtils.getPreferredLanguage();
        const mapping = TranslateDirective.translations[key.trim().toLowerCase()];
        const translation = mapping && mapping[language];
        return translation ? translation : defaultValue === true ? key : defaultValue;
    }
}
