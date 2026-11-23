import { EmitterMixin, Locale } from '@ckeditor/ckeditor5-utils';
import { BalloonPanelView, ButtonView, createDropdown, ToolbarView } from '@ckeditor/ckeditor5-ui';
import type { DropdownView } from '@ckeditor/ckeditor5-ui';
import type { Editor } from '@ckeditor/ckeditor5-core';
import OpToolbarPanelsPlugin from '../../src/plugins/op-toolbar-panels/op-toolbar-panels-plugin';
import { liftPanelToTopLayer, liftTooltipsAboveLiftedPanels } from '../../src/plugins/op-toolbar-panels/top-layer-panel';

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

	static report(target: Element, ...isIntersecting: boolean[]) {
		this.observers
			.filter(observer => observer.targets.includes(target))
			.forEach(observer => observer.callback(isIntersecting.map(intersecting => ({ target, isIntersecting: intersecting }))));
	}
}

class FakeResizeObserver {
	static observers: FakeResizeObserver[] = [];
	targets: Element[] = [];

	constructor(private callback: () => void) {
		FakeResizeObserver.observers.push(this);
	}

	observe(target: Element) {
		this.targets.push(target);
	}

	disconnect() {
		this.targets = [];
	}

	static report(target: Element) {
		this.observers.filter(observer => observer.targets.includes(target)).forEach(observer => observer.callback());
	}
}

function nextFrame() {
	jest.advanceTimersByTime(16);
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
		FakeResizeObserver.observers = [];
		jest.useFakeTimers();
		window.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;
		window.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
		Object.defineProperties(document.documentElement, {
			clientWidth: { value: 1000, configurable: true },
			clientHeight: { value: 800, configurable: true },
		});
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.restoreAllMocks();
		delete (HTMLElement.prototype as Partial<HTMLElement>).showPopover;
		delete (HTMLElement.prototype as Partial<HTMLElement>).hidePopover;
		delete (window as unknown as Record<string, unknown>).IntersectionObserver;
		delete (window as unknown as Record<string, unknown>).ResizeObserver;
		delete (document.documentElement as unknown as Record<string, unknown>).clientWidth;
		delete (document.documentElement as unknown as Record<string, unknown>).clientHeight;
		delete (window as unknown as Record<string, unknown>).visualViewport;
		document.body.innerHTML = '';
	});

	test('opens the panel in the top layer below the button, starting at the button', () => {
		const dropdownView = dropdown();
		const panel = panelOf(dropdownView);

		liftPanelToTopLayer(dropdownView);
		dropdownView.isOpen = true;

		expect(panel.getAttribute('popover')).toBe('manual');
		expect(showPopover.mock.contexts).toEqual([panel]);
		expect(dropdownView.panelView.position).toBe('se');
		expect(panel.style).toMatchObject({ position: 'fixed', margin: '0px', overflow: 'visible' });
		expect(panel.style).toMatchObject({ top: '130px', left: '600px', minWidth: '40px', maxHeight: '', overflowY: 'visible' });

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

		expect(dropdownView.panelView.position).toBe('ne');
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

	test('aligns to the end of the button when the dropdown asks for it, or when the panel does not fit otherwise', () => {
		const requested = dropdown();
		const fallback = dropdown();

		requested.panelPosition = 'sw';
		placeElement(fallback.buttonView.element!, rect(900, 100, 40, 30));
		liftPanelToTopLayer(requested);
		liftPanelToTopLayer(fallback);
		requested.isOpen = true;
		fallback.isOpen = true;

		expect(requested.panelView.position).toBe('sw');
		expect(panelOf(requested).style.left).toBe('440px');
		expect(fallback.panelView.position).toBe('sw');
		expect(panelOf(fallback).style.left).toBe('740px');
	});

	test('is in the top layer before the dropdown moves focus into it', () => {
		const dropdownView = dropdown();
		let liftedWhenFocused: boolean | undefined;

		jest.spyOn(dropdownView.panelView, 'focus').mockImplementation(() => {
			liftedWhenFocused = panelOf(dropdownView).hasAttribute('popover');
		});
		liftPanelToTopLayer(dropdownView);
		dropdownView.isOpen = true;

		expect(liftedWhenFocused).toBe(true);
	});

	test('places a dropdown lifted before it is rendered after CKEditor has positioned it', () => {
		const dropdownView = createDropdown(new Locale());

		dropdownView.panelPosition = 'sw';
		liftPanelToTopLayer(dropdownView);
		dropdownView.render();
		document.body.appendChild(dropdownView.element!);
		placeElement(dropdownView.buttonView.element!, rect(600, 700, 40, 30));
		sizePanel(dropdownView, 200, 150);
		dropdownView.isOpen = true;

		expect(dropdownView.panelView.position).toBe('nw');
		expect(panelOf(dropdownView).style.top).toBe('550px');
	});

	test('keeps inline styles it did not set', () => {
		const dropdownView = dropdown();
		const panel = panelOf(dropdownView);

		panel.style.width = '300px';
		liftPanelToTopLayer(dropdownView);
		dropdownView.isOpen = true;
		dropdownView.isOpen = false;

		expect(panel.getAttribute('style')).toBe('width: 300px;');
	});

	test('follows the button while scrolling, and closes once the button is hidden', () => {
		const dropdownView = dropdown();
		const button = dropdownView.buttonView.element!;
		const panel = panelOf(dropdownView);

		liftPanelToTopLayer(dropdownView);
		dropdownView.isOpen = true;
		FakeIntersectionObserver.report(button, true);

		nextFrame();
		placeElement(button, rect(600, 200, 40, 30));
		document.dispatchEvent(new Event('scroll'));
		document.dispatchEvent(new Event('scroll'));
		expect(panel.style.top).toBe('130px');
		nextFrame();
		expect(panel.style.top).toBe('230px');

		placeElement(button, rect(600, 260, 40, 30));
		panel.dispatchEvent(new Event('scroll'));
		nextFrame();
		expect(panel.style.top).toBe('230px');

		window.dispatchEvent(new Event('resize'));
		nextFrame();
		expect(panel.style.top).toBe('290px');

		placeElement(button, rect(600, 360, 40, 30));
		FakeResizeObserver.report(panel);
		nextFrame();
		expect(panel.style.top).toBe('390px');
		expect(dropdownView.isOpen).toBe(true);

		const item = document.createElement('button');

		panel.appendChild(item);
		item.focus();
		const buttonFocused = jest.spyOn(dropdownView.buttonView, 'focus');

		FakeIntersectionObserver.report(button, false);
		expect(dropdownView.isOpen).toBe(false);
		expect(buttonFocused).not.toHaveBeenCalled();
		expect(document.activeElement).not.toBe(item);
		expect(panel.hasAttribute('popover')).toBe(false);

		dropdownView.isOpen = true;
		expect(dropdownView.isOpen).toBe(true);
	});

	test('lifts a dropdown inside a lifted panel above it, so a scrolling outer panel cannot clip it', () => {
		const outer = dropdown();
		const inner = dropdown({ parent: panelOf(outer) });

		liftPanelToTopLayer(outer);
		liftPanelToTopLayer(inner);
		outer.isOpen = true;
		inner.isOpen = true;

		expect(panelOf(inner).getAttribute('popover')).toBe('manual');
		expect(showPopover.mock.contexts).toEqual([panelOf(outer), panelOf(inner)]);
	});

	test('leaves the panel in place in browsers without the Popover API', () => {
		const dropdownView = dropdown();

		delete (HTMLElement.prototype as Partial<HTMLElement>).showPopover;
		liftPanelToTopLayer(dropdownView);
		dropdownView.isOpen = true;

		expect(panelOf(dropdownView).hasAttribute('popover')).toBe(false);
		expect(panelOf(dropdownView).hasAttribute('style')).toBe(false);
	});

	test('shows tooltips above lifted panels only while one is open', () => {
		const balloon = new BalloonPanelView();
		const dropdownView = dropdown();

		balloon.render();
		document.body.appendChild(balloon.element!);
		liftTooltipsAboveLiftedPanels(balloon);
		liftPanelToTopLayer(dropdownView);

		balloon.isVisible = true;
		expect(balloon.element!.hasAttribute('popover')).toBe(false);
		balloon.isVisible = false;

		dropdownView.isOpen = true;
		balloon.isVisible = true;
		expect(balloon.element!.getAttribute('popover')).toBe('manual');
		expect(balloon.element!.style).toMatchObject({ margin: '0px', padding: '', overflow: 'visible' });
		expect(showPopover.mock.contexts).toEqual([panelOf(dropdownView), balloon.element]);

		balloon.isVisible = false;
		expect(balloon.element!.hasAttribute('popover')).toBe(false);
		expect(balloon.element!.style).toMatchObject({ margin: '', overflow: '' });

		balloon.isVisible = true;
		dropdownView.isOpen = false;
		expect(balloon.element!.hasAttribute('popover')).toBe(false);
	});

	test('lifts a tooltip that is already visible when a panel opens', () => {
		const balloon = new BalloonPanelView();
		const dropdownView = dropdown();

		balloon.render();
		document.body.appendChild(balloon.element!);
		liftTooltipsAboveLiftedPanels(balloon);
		liftPanelToTopLayer(dropdownView);
		balloon.isVisible = true;
		dropdownView.isOpen = true;

		expect(showPopover.mock.contexts).toEqual([panelOf(dropdownView), balloon.element]);

		dropdownView.isOpen = false;
		balloon.isVisible = false;
	});

	test('stays open when the button is visible again by the time the observer reports', () => {
		const dropdownView = dropdown();

		liftPanelToTopLayer(dropdownView);
		dropdownView.isOpen = true;
		FakeIntersectionObserver.report(dropdownView.buttonView.element!, false, true);

		expect(dropdownView.isOpen).toBe(true);
	});

	test('places the panel within the visible part of a pinch-zoomed page, and follows it', () => {
		const dropdownView = dropdown();
		const panel = panelOf(dropdownView);
		const visualViewport = Object.assign(new EventTarget(), { offsetLeft: 20, offsetTop: 7, width: 360, height: 320 });

		Object.defineProperty(window, 'visualViewport', { value: visualViewport, configurable: true });
		placeElement(dropdownView.buttonView.element!, rect(250, 257, 40, 32));
		sizePanel(dropdownView, 200, 220);
		liftPanelToTopLayer(dropdownView);
		dropdownView.isOpen = true;

		expect(dropdownView.panelView.position).toBe('nw');
		expect(panel.style).toMatchObject({ top: '37px', left: '90px' });

		visualViewport.offsetTop = 0;
		visualViewport.dispatchEvent(new Event('scroll'));
		nextFrame();
		expect(panel.style.top).toBe('37px');
		expect(panel.style.maxHeight).toBe('');

		visualViewport.offsetTop = 100;
		visualViewport.dispatchEvent(new Event('scroll'));
		nextFrame();
		expect(panel.style).toMatchObject({ top: '108px', maxHeight: '149px', overflowY: 'auto' });

		dropdownView.isOpen = false;
		visualViewport.offsetTop = 0;
		visualViewport.dispatchEvent(new Event('scroll'));
		nextFrame();
		expect(panel.hasAttribute('style')).toBe(false);
	});

	test('cleans up a panel that is released while open, even once it has left the document', () => {
		const balloon = new BalloonPanelView();
		const dropdownView = dropdown();
		const panel = panelOf(dropdownView);
		const releaseTooltips = liftTooltipsAboveLiftedPanels(balloon);
		const release = liftPanelToTopLayer(dropdownView);

		balloon.render();
		document.body.appendChild(balloon.element!);
		dropdownView.isOpen = true;
		document.dispatchEvent(new Event('scroll'));
		dropdownView.element!.remove();
		release();

		expect(dropdownView.isOpen).toBe(false);
		expect(hidePopover).not.toHaveBeenCalled();
		expect(panel.hasAttribute('popover')).toBe(false);
		expect(panel.hasAttribute('style')).toBe(false);
		expect(FakeIntersectionObserver.observers[0].targets).toEqual([]);
		expect(FakeResizeObserver.observers[0].targets).toEqual([]);
		// The reposition scheduled by the scroll above is cancelled.
		nextFrame();
		expect(panel.hasAttribute('style')).toBe(false);

		// The released panel no longer counts as open, so tooltips stay where they are.
		balloon.isVisible = true;
		expect(balloon.element!.hasAttribute('popover')).toBe(false);

		document.body.appendChild(dropdownView.element!);
		dropdownView.isOpen = false;
		dropdownView.isOpen = true;
		expect(panel.hasAttribute('popover')).toBe(false);
		releaseTooltips();
	});

	describe('OpToolbarPanelsPlugin', () => {
		function editorWithToolbar(balloonPanelView = new BalloonPanelView(new Locale())) {
			const locale = new Locale();
			const toolbar = new ToolbarView(locale);
			const tooltipManager = { balloonPanelView };
			const ui = Object.assign(new (EmitterMixin())(), { view: { toolbar }, tooltipManager });
			const plugin = new OpToolbarPanelsPlugin({ ui } as unknown as Editor);

			toolbar.render();
			document.body.appendChild(toolbar.element!);
			placeElement(toolbar.element!, rect(100, 90, 800, 50));
			toolbar.items.add(new ButtonView(locale));
			plugin.init();

			return { locale, toolbar, ui, plugin };
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

			expect(panelOf(before).style.left).toBe('600px');
			expect(panelOf(after).style.left).toBe('600px');
		});

		test('aligns the "Show more items" panel to the end of the toolbar', () => {
			const { locale, toolbar, ui } = editorWithToolbar();
			const showMore = toolbarDropdown(locale);

			ui.fire('ready');
			toolbar.children.add(showMore);
			showMore.isOpen = true;

			expect(panelOf(showMore).style.left).toBe('700px');
		});

		test('closes its open panels when destroyed, and keeps tooltips lifted for the editors that remain', () => {
			const balloon = new BalloonPanelView();
			const first = editorWithToolbar(balloon);
			const second = editorWithToolbar(balloon);
			const firstDropdown = toolbarDropdown(first.locale);
			const secondDropdown = toolbarDropdown(second.locale);

			balloon.render();
			document.body.appendChild(balloon.element!);
			first.toolbar.items.add(firstDropdown);
			second.toolbar.items.add(secondDropdown);
			first.ui.fire('ready');
			second.ui.fire('ready');
			firstDropdown.isOpen = true;
			first.plugin.destroy();

			expect(panelOf(firstDropdown).hasAttribute('popover')).toBe(false);

			secondDropdown.isOpen = true;
			balloon.isVisible = true;
			expect(balloon.element!.getAttribute('popover')).toBe('manual');

			second.plugin.destroy();
			expect(balloon.element!.hasAttribute('popover')).toBe(false);
			expect(panelOf(secondDropdown).hasAttribute('popover')).toBe(false);

			balloon.isVisible = false;
			secondDropdown.isOpen = false;
			secondDropdown.isOpen = true;
			balloon.isVisible = true;
			expect(balloon.element!.hasAttribute('popover')).toBe(false);
		});
	});
});
