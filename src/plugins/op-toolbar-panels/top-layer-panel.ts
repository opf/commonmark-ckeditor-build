import type { BalloonPanelView, DropdownView } from '@ckeditor/ckeditor5-ui';

type Side = 'e' | 'w';
type Area = { left: number; top: number; right: number; bottom: number };

const VIEWPORT_MARGIN = 8;
// Replaces the panel's absolute position, which scrolls with the page in the top layer, and the popover's own
// margin, overflow and color. Inline, so no stylesheet of the host has to know about lifted panels.
const TOP_LAYER_STYLE = { position: 'fixed', margin: '0', overflow: 'visible', color: 'inherit' };
const PLACEMENT_STYLE_KEYS = ['minWidth', 'top', 'left', 'right', 'bottom', 'maxHeight', 'overflowY'];
// The balloon keeps its own absolute position and inline top and left; these undo the popover's
// centering margin, insets and scroll box.
const TOOLTIP_STYLE = { margin: '0', right: 'auto', bottom: 'auto', overflow: 'visible', color: 'inherit' };
const lifted = new WeakMap<DropdownView, () => void>();
const tooltipBalloons = new Map<BalloonPanelView, { users: number; release: () => void }>();
const openPanels = new Set<HTMLElement>();

/**
 * Opens the dropdown's panel in the top layer, so no clipping or stacking
 * ancestor of the editor (widget boxes, split panes, sticky toolbars of other
 * editors) can hide it. The panel keeps its place in the DOM, so focus
 * tracking, keyboard handling and clicks outside behave as before.
 *
 * The panel opens below the button, or above it when there is more room there.
 * With an `anchor`, it is aligned to the anchor's end. Otherwise it follows the
 * dropdown's `panelPosition`, or starts at the button when that is `auto` and
 * the panel fits.
 *
 * Returns a function that closes the dropdown and stops lifting its panel, for
 * when the dropdown is destroyed, which may happen while it is open. A dropdown
 * is lifted once: lifting it again returns the same function.
 */
export function liftPanelToTopLayer(dropdownView: DropdownView, anchor?: () => HTMLElement): () => void {
	const existing = lifted.get(dropdownView);

	if (existing) {
		return existing;
	}

	let frame: number | undefined;
	let buttonObserver: IntersectionObserver | undefined;
	let panelObserver: ResizeObserver | undefined;

	const reposition = () => {
		if (frame === undefined) {
			frame = requestAnimationFrame(() => {
				frame = undefined;
				place(dropdownView, anchor);
			});
		}
	};
	const repositionOnScroll = (evt: unknown, domEvt: Event) => {
		if (!dropdownView.panelView.element!.contains(domEvt.target as Node)) {
			reposition();
		}
	};

	const onOpenChange = (evt: unknown, name: string, isOpen: boolean) => {
		const panel = dropdownView.panelView.element!;

		if (isOpen && canLift(panel)) {
			panel.setAttribute('popover', 'manual');
			Object.assign(panel.style, TOP_LAYER_STYLE);
			panel.showPopover();
			openPanels.add(panel);
			place(dropdownView, anchor);
			// Unlike before, the panel is no longer clipped together with the button.
			buttonObserver = new IntersectionObserver(entries => {
				if (!entries[entries.length - 1].isIntersecting) {
					// Otherwise CKEditor focuses the button on close, scrolling it back into view.
					if (panel.contains(document.activeElement)) {
						(document.activeElement as HTMLElement).blur();
					}
					dropdownView.isOpen = false;
				}
			});
			buttonObserver.observe(dropdownView.buttonView.element!);
			if (typeof ResizeObserver === 'function') {
				panelObserver = new ResizeObserver(reposition);
				panelObserver.observe(panel);
			}
			dropdownView.listenTo(document, 'scroll', repositionOnScroll, { useCapture: true, usePassive: true });
			dropdownView.listenTo(window, 'resize', reposition);
			// Pinch zoom moves the visible part of the page without scrolling or resizing the window.
			if (window.visualViewport) {
				dropdownView.listenTo(window.visualViewport, 'scroll', reposition);
				dropdownView.listenTo(window.visualViewport, 'resize', reposition);
			}
			[...tooltipBalloons.keys()].forEach(liftTooltip);
		} else if (!isOpen) {
			lower();
		}
	};

	const lower = () => {
		const panel = dropdownView.panelView.element!;

		if (!panel.hasAttribute('popover')) {
			return;
		}

		buttonObserver?.disconnect();
		panelObserver?.disconnect();
		if (frame !== undefined) {
			cancelAnimationFrame(frame);
			frame = undefined;
		}
		dropdownView.stopListening(document, 'scroll', repositionOnScroll);
		dropdownView.stopListening(window, 'resize', reposition);
		if (window.visualViewport) {
			dropdownView.stopListening(window.visualViewport, 'scroll', reposition);
			dropdownView.stopListening(window.visualViewport, 'resize', reposition);
		}
		// A panel removed from the document has already left the top layer.
		if (panel.isConnected) {
			panel.hidePopover();
		}
		panel.removeAttribute('popover');
		clearStyle(panel, [...Object.keys(TOP_LAYER_STYLE), ...PLACEMENT_STYLE_KEYS]);
		openPanels.delete(panel);
		// A tooltip shown above this panel goes back to its place once no lifted panel is left.
		[...tooltipBalloons.keys()].forEach(liftTooltip);
	};

	let released = false;
	const listen = () => {
		if (!released) {
			// After DropdownView's own handler, which render() registers, has shown the panel and set its
			// position, and before createDropdown() moves focus into it ('low'): focusing the panel while it is
			// still clipped would scroll the clipping container.
			dropdownView.on('change:isOpen', onOpenChange, { priority: 'normal' });
		}
	};
	const release = () => {
		released = true;
		// Otherwise the panel would stay visible in its old place, clipped again.
		dropdownView.isOpen = false;
		dropdownView.off('change:isOpen', onOpenChange);
		if (dropdownView.isRendered) {
			lower();
		}
		lifted.delete(dropdownView);
	};

	lifted.set(dropdownView, release);

	if (dropdownView.isRendered) {
		listen();
	} else {
		dropdownView.once('render', listen, { priority: 'lowest' });
	}

	return release;
}

/**
 * Shows the shared tooltip balloon in the top layer while a lifted panel is
 * open, so tooltips of toolbar buttons are not drawn behind that panel.
 *
 * Editors share the balloon. Each one calls this and later the returned
 * function, so the balloon is let go once the last of them is destroyed.
 */
export function liftTooltipsAboveLiftedPanels(balloon: BalloonPanelView): () => void {
	let registration = tooltipBalloons.get(balloon);

	if (!registration) {
		const onVisibleChange = () => liftTooltip(balloon);

		balloon.on('change:isVisible', onVisibleChange);
		registration = {
			users: 0,
			release: () => {
				balloon.off('change:isVisible', onVisibleChange);
				tooltipBalloons.delete(balloon);
				lowerTooltip(balloon);
			},
		};
		tooltipBalloons.set(balloon, registration);
	}

	const current = registration;
	let released = false;

	current.users += 1;

	return () => {
		if (!released) {
			released = true;
			current.users -= 1;
			if (current.users === 0) {
				current.release();
			}
		}
	};
}

function lowerTooltip(balloon: BalloonPanelView) {
	const element = balloon.element;

	if (element?.hasAttribute('popover')) {
		if (element.isConnected) {
			element.hidePopover();
		}
		element.removeAttribute('popover');
		clearStyle(element, [...Object.keys(TOOLTIP_STYLE), 'translate']);
	}
}

function liftTooltip(balloon: BalloonPanelView) {
	const element = balloon.element;

	if (!element || typeof element.showPopover !== 'function') {
		return;
	}

	lowerTooltip(balloon);

	if (balloon.isVisible && element.isConnected && [...openPanels].some(panel => panel.isConnected)) {
		const before = element.getBoundingClientRect();

		element.setAttribute('popover', 'manual');
		Object.assign(element.style, TOOLTIP_STYLE);
		element.showPopover();

		// The balloon's top and left are relative to its positioned ancestor, such as a dialog the host
		// moved the body collection into. In the top layer they are relative to the document instead.
		const after = element.getBoundingClientRect();

		element.style.translate = `${before.left - after.left}px ${before.top - after.top}px`;
	}
}

function canLift(panel: HTMLElement) {
	return typeof panel.showPopover === 'function' && typeof IntersectionObserver === 'function';
}

function clearStyle(element: HTMLElement, keys: string[]) {
	Object.assign(element.style, Object.fromEntries(keys.map(key => [key, ''])));

	if (!element.getAttribute('style')) {
		element.removeAttribute('style');
	}
}

function place(dropdownView: DropdownView, anchor?: () => HTMLElement) {
	const panel = dropdownView.panelView.element!;
	const buttonElement = dropdownView.buttonView.element!;
	const button = buttonElement.getBoundingClientRect();
	const area = visibleArea();

	// Before measuring: in the top layer, the panel's min-width of 100% refers to the viewport, and the
	// popover's own insets combine with those of the panel position, both stretching the panel.
	Object.assign(panel.style, { minWidth: `${button.width}px`, left: '0px', right: 'auto', bottom: 'auto' });

	const box = (anchor?.() ?? buttonElement).getBoundingClientRect();
	const width = panel.offsetWidth;
	const height = panel.scrollHeight + panel.offsetHeight - panel.clientHeight;
	const below = area.bottom - button.bottom - VIEWPORT_MARGIN;
	const above = button.top - area.top - VIEWPORT_MARGIN;
	const upwards = height > below && above > below;
	const room = Math.max(upwards ? above : below, 0);
	const side = horizontalSide(dropdownView, !!anchor, box, width, area);
	const left = side === 'e' ? box.left : box.right - width;

	dropdownView.panelView.position = `${upwards ? 'n' : 's'}${side}` as const;
	Object.assign(panel.style, {
		top: `${upwards ? button.top - Math.min(height, room) : button.bottom}px`,
		left: `${Math.max(area.left + VIEWPORT_MARGIN, Math.min(left, area.right - VIEWPORT_MARGIN - width))}px`,
		maxHeight: height > room ? `${room}px` : '',
		overflowY: height > room ? 'auto' : 'visible',
	});
}

// The part of the page the user sees, in the coordinates of fixed elements. Smaller than the window while
// pinch-zoomed.
function visibleArea(): Area {
	const { clientWidth, clientHeight } = document.documentElement;
	const viewport = window.visualViewport;

	if (!viewport) {
		return { left: 0, top: 0, right: clientWidth, bottom: clientHeight };
	}

	return {
		left: viewport.offsetLeft,
		top: viewport.offsetTop,
		right: viewport.offsetLeft + Math.min(viewport.width, clientWidth),
		bottom: viewport.offsetTop + Math.min(viewport.height, clientHeight),
	};
}

// 'e' opens the panel from the box's left edge towards the right, 'w' from its right edge towards the left.
function horizontalSide(dropdownView: DropdownView, anchored: boolean, box: DOMRect, width: number, area: Area): Side {
	const rtl = dropdownView.locale?.uiLanguageDirection === 'rtl';
	const end: Side = rtl ? 'e' : 'w';
	const start: Side = rtl ? 'w' : 'e';
	const requested = dropdownView.panelPosition.slice(-1);

	if (anchored) {
		return end;
	}

	if (requested === 'e' || requested === 'w') {
		return requested;
	}

	const fits = (side: Side) => side === 'e' ?
		box.left + width <= area.right - VIEWPORT_MARGIN :
		box.right - width >= area.left + VIEWPORT_MARGIN;

	return fits(start) || !fits(end) ? start : end;
}
