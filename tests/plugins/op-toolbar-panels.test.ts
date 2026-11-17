import { EmitterMixin, Locale } from '@ckeditor/ckeditor5-utils';
import { ButtonView, createDropdown, ToolbarView } from '@ckeditor/ckeditor5-ui';
import type { DropdownView } from '@ckeditor/ckeditor5-ui';
import type { Editor } from '@ckeditor/ckeditor5-core';
import OpToolbarPanelsPlugin from '../../src/plugins/op-toolbar-panels/op-toolbar-panels-plugin';
import { liftPanelToTopLayer } from '../../src/plugins/op-toolbar-panels/top-layer-panel';

const showPopover = jest.fn();
const hidePopover = jest.fn();

class FakeIntersectionObserver {
	static observers: FakeIntersectionObserver[] = [];
	targets: Element[] = [];

	constructor(private callback: (entries: Partial<IntersectionObserverEntry>[]) => void) {
		FakeIntersectionObserver.observers.push(this);
	}

	observe(target: Element) {
		this.targets.push(target);
	}

	disconnect() {
		this.targets = [];
	}

	static report(target: Element, isIntersecting: boolean) {
		this.observers
			.filter(observer => observer.targets.includes(target))
			.forEach(observer => observer.callback([{ target, isIntersecting }]));
	}
}

function rect(left: number, top: number, width: number, height: number) {
	return { left, top, width, height, right: left + width, bottom: top + height, x: left, y: top } as DOMRect;
}

function placeElement(element: Element, box: DOMRect) {
	jest.spyOn(element, 'getBoundingClientRect').mockReturnValue(box);
}

function sizePanel(dropdownView: DropdownView, width: number, height: number) {
	Object.defineProperties(dropdownView.panelView.element!, {
		offsetWidth: { value: width, configurable: true },
		scrollHeight: { value: height, configurable: true },
	});
}

function dropdown({ locale = new Locale(), parent = document.body as HTMLElement } = {}) {
	const dropdownView = createDropdown(locale);

	dropdownView.render();
	parent.appendChild(dropdownView.element!);
	placeElement(dropdownView.buttonView.element!, rect(600, 100, 40, 30));
	sizePanel(dropdownView, 200, 150);

	return dropdownView;
}

function panelOf(dropdownView: DropdownView) {
	return dropdownView.panelView.element!;
}

describe('liftPanelToTopLayer', () => {
	beforeEach(() => {
		Object.assign(HTMLElement.prototype, { showPopover, hidePopover });
		FakeIntersectionObserver.observers = [];
		window.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;
		Object.defineProperties(document.documentElement, {
			clientWidth: { value: 1000, configurable: true },
			clientHeight: { value: 800, configurable: true },
		});
	});

	afterEach(() => {
		jest.restoreAllMocks();
		delete (HTMLElement.prototype as Partial<HTMLElement>).showPopover;
		delete (HTMLElement.prototype as Partial<HTMLElement>).hidePopover;
		delete (window as unknown as Record<string, unknown>).IntersectionObserver;
		delete (document.documentElement as unknown as Record<string, unknown>).clientWidth;
		delete (document.documentElement as unknown as Record<string, unknown>).clientHeight;
		document.body.innerHTML = '';
	});

	test('opens the panel in the top layer below the button, aligned to its end', () => {
		const dropdownView = dropdown();
		const panel = panelOf(dropdownView);

		liftPanelToTopLayer(dropdownView);
		dropdownView.isOpen = true;

		expect(panel.getAttribute('popover')).toBe('manual');
		expect(showPopover.mock.contexts).toEqual([panel]);
		expect(dropdownView.panelView.position).toBe('sw');
		expect(panel.style).toMatchObject({ position: 'fixed', margin: '0px', overflow: 'visible' });
		expect(panel.style).toMatchObject({ top: '130px', left: '440px', minWidth: '40px', maxHeight: '', overflowY: 'visible' });

		dropdownView.isOpen = false;

		expect(hidePopover.mock.contexts).toEqual([panel]);
		expect(panel.hasAttribute('popover')).toBe(false);
		expect(panel.hasAttribute('style')).toBe(false);
	});

	test('opens above the button when there is more room, and scrolls when neither side fits', () => {
		const dropdownView = dropdown();
		const panel = panelOf(dropdownView);

		placeElement(dropdownView.buttonView.element!, rect(600, 600, 40, 30));
		liftPanelToTopLayer(dropdownView);
		sizePanel(dropdownView, 200, 300);
		dropdownView.isOpen = true;

		expect(dropdownView.panelView.position).toBe('nw');
		expect(panel.style).toMatchObject({ top: '300px', maxHeight: '', overflowY: 'visible' });

		dropdownView.isOpen = false;
		sizePanel(dropdownView, 200, 700);
		dropdownView.isOpen = true;

		expect(panel.style).toMatchObject({ top: '8px', maxHeight: '592px', overflowY: 'auto' });
	});

	test('aligns to the end of its anchor, mirrored for right-to-left languages, within the viewport', () => {
		const ltr = dropdown();
		const rtl = dropdown({ locale: new Locale({ uiLanguage: 'ar' }) });
		const anchor = document.createElement('div');

		placeElement(anchor, rect(-50, 90, 900, 50));
		liftPanelToTopLayer(ltr, () => anchor);
		liftPanelToTopLayer(rtl, () => anchor);
		ltr.isOpen = true;
		rtl.isOpen = true;

		expect(panelOf(ltr).style.left).toBe('650px');
		expect(rtl.panelView.position).toBe('se');
		expect(panelOf(rtl).style.left).toBe('8px');
	});

	test('follows the button while scrolling, and closes once the button is hidden', () => {
		const dropdownView = dropdown();
		const button = dropdownView.buttonView.element!;
		const panel = panelOf(dropdownView);

		liftPanelToTopLayer(dropdownView);
		dropdownView.isOpen = true;
		FakeIntersectionObserver.report(button, true);

		placeElement(button, rect(600, 200, 40, 30));
		document.dispatchEvent(new Event('scroll'));
		expect(panel.style.top).toBe('230px');

		placeElement(button, rect(600, 360, 40, 30));
		window.dispatchEvent(new Event('resize'));
		expect(panel.style.top).toBe('390px');
		expect(dropdownView.isOpen).toBe(true);

		FakeIntersectionObserver.report(button, false);
		expect(dropdownView.isOpen).toBe(false);
		expect(panel.hasAttribute('popover')).toBe(false);

		dropdownView.isOpen = true;
		expect(dropdownView.isOpen).toBe(true);
	});

	test('opens a dropdown inside a lifted panel within that panel', () => {
		const outer = dropdown();
		const inner = dropdown({ parent: panelOf(outer) });

		liftPanelToTopLayer(outer);
		liftPanelToTopLayer(inner);
		outer.isOpen = true;
		inner.isOpen = true;

		expect(panelOf(inner).hasAttribute('popover')).toBe(false);
		expect(showPopover.mock.contexts).toEqual([panelOf(outer)]);
	});

	test('leaves the panel in place in browsers without the Popover API', () => {
		const dropdownView = dropdown();

		delete (HTMLElement.prototype as Partial<HTMLElement>).showPopover;
		liftPanelToTopLayer(dropdownView);
		dropdownView.isOpen = true;

		expect(panelOf(dropdownView).hasAttribute('popover')).toBe(false);
		expect(panelOf(dropdownView).hasAttribute('style')).toBe(false);
	});

	describe('OpToolbarPanelsPlugin', () => {
		function editorWithToolbar() {
			const locale = new Locale();
			const toolbar = new ToolbarView(locale);
			const ui = Object.assign(new (EmitterMixin())(), { view: { toolbar } });
			const plugin = new OpToolbarPanelsPlugin({ ui } as unknown as Editor);

			toolbar.render();
			document.body.appendChild(toolbar.element!);
			placeElement(toolbar.element!, rect(100, 90, 800, 50));
			toolbar.items.add(new ButtonView(locale));
			plugin.init();

			return { locale, toolbar, ui };
		}

		function toolbarDropdown(locale: Locale) {
			const dropdownView = createDropdown(locale);

			dropdownView.on('render', () => {
				placeElement(dropdownView.buttonView.element!, rect(600, 100, 40, 30));
				sizePanel(dropdownView, 200, 150);
			}, { priority: 'lowest' });

			return dropdownView;
		}

		test('lifts the dropdowns among the toolbar items, before and after the editor is ready', () => {
			const { locale, toolbar, ui } = editorWithToolbar();
			const before = toolbarDropdown(locale);
			const after = toolbarDropdown(locale);

			toolbar.items.add(before);
			ui.fire('ready');
			toolbar.items.add(after);
			before.isOpen = true;
			after.isOpen = true;

			expect(panelOf(before).style.left).toBe('440px');
			expect(panelOf(after).style.left).toBe('440px');
		});

		test('aligns the "Show more items" panel to the end of the toolbar', () => {
			const { locale, toolbar, ui } = editorWithToolbar();
			const showMore = toolbarDropdown(locale);

			ui.fire('ready');
			toolbar.children.add(showMore);
			showMore.isOpen = true;

			expect(panelOf(showMore).style.left).toBe('700px');
		});
	});
});
