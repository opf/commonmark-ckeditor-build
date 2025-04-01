/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */
/**
 * @module mention/ui/domwrapperview
 */
import { View } from 'ckeditor5/src/ui.js';
/**
 * This class wraps DOM element as a CKEditor5 UI View.
 *
 * It allows to render any DOM element and use it in mentions list.
 */
export default class DomWrapperView extends View {
    /**
     * Creates an instance of {@link module:mention/ui/domwrapperview~DomWrapperView} class.
     *
     * Also see {@link #render}.
     */
    constructor(locale, domElement) {
        super(locale);
        // Disable template rendering on this view.
        this.template = undefined;
        this.domElement = domElement;
        // Render dom wrapper as a button.
        this.domElement.classList.add('ck-button');
        this.set('isOn', false);
        // Handle isOn state as in buttons.
        this.on('change:isOn', (evt, name, isOn) => {
            if (isOn) {
                this.domElement.classList.add('ck-on');
                this.domElement.classList.remove('ck-off');
            }
            else {
                this.domElement.classList.add('ck-off');
                this.domElement.classList.remove('ck-on');
            }
        });
        // Pass click event as execute event.
        this.listenTo(this.domElement, 'click', () => {
            this.fire('execute');
        });
    }
    /**
     * @inheritDoc
     */
    render() {
        super.render();
        this.element = this.domElement;
    }
    /**
     * Focuses the DOM element.
     */
    focus() {
        this.domElement.focus();
    }
}
