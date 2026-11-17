import type { BalloonPanelView, DropdownView } from '@ckeditor/ckeditor5-ui';

type Side = 'e' | 'w';

const VIEWPORT_MARGIN = 8;
// Replaces the panel's absolute position, which scrolls with the page in the top layer, and the popover's own
// margin, overflow and color. Inline, so no stylesheet of the host has to know about lifted panels.
const TOP_LAYER_STYLE = { position: 'fixed', margin: '0', overflow: 'visible', color: 'inherit' };
const PLACEMENT_STYLE_KEYS = ['minWidth', 'top', 'left', 'right', 'bottom', 'maxHeight', 'overflowY'];
// The balloon keeps its own absolute position and inline top and left; these undo the popover's
// centering margin, insets and scroll box.
const TOOLTIP_STYLE = { margin: '0', right: 'auto', bottom: 'auto', overflow: 'visible', color: 'inherit' };
const lifted = new WeakSet<DropdownView>();
const tooltipBalloons = new Set<BalloonPanelView>();
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
 */
export function liftPanelToTopLayer(dropdownView: DropdownView, anchor?: () => HTMLElement) {
	if (lifted.has(dropdownView)) {
		return;
	}

	lifted.add(dropdownView);

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
			buttonObserver = new IntersectionObserver(([entry]) => {
				if (!entry.isIntersecting) {
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
			tooltipBalloons.forEach(liftTooltip);
		} else if (!isOpen && panel.hasAttribute('popover')) {
			buttonObserver?.disconnect();
			panelObserver?.disconnect();
			if (frame !== undefined) {
				cancelAnimationFrame(frame);
				frame = undefined;
			}
			dropdownView.stopListening(document, 'scroll', repositionOnScroll);
			dropdownView.stopListening(window, 'resize', reposition);
			panel.hidePopover();
			panel.removeAttribute('popover');
			clearStyle(panel, [...Object.keys(TOP_LAYER_STYLE), ...PLACEMENT_STYLE_KEYS]);
			openPanels.delete(panel);
		}
	};

	// After DropdownView's own handler, which render() registers, has shown the panel and set its position,
	// and before createDropdown() moves focus into it ('low'): focusing the panel while it is still clipped
	// would scroll the clipping container.
	const listen = () => dropdownView.on('change:isOpen', onOpenChange, { priority: 'normal' });

	if (dropdownView.isRendered) {
		listen();
	} else {
		dropdownView.once('render', listen, { priority: 'lowest' });
	}
}

/**
 * Shows the shared tooltip balloon in the top layer while a lifted panel is
 * open, so tooltips of toolbar buttons are not drawn behind that panel.
 */
export function liftTooltipsAboveLiftedPanels(balloon: BalloonPanelView) {
	if (tooltipBalloons.has(balloon)) {
		return;
	}

	tooltipBalloons.add(balloon);
	balloon.on('change:isVisible', () => liftTooltip(balloon));
}

function liftTooltip(balloon: BalloonPanelView) {
	const element = balloon.element;

	if (!element || typeof element.showPopover !== 'function') {
		return;
	}

	if (element.hasAttribute('popover')) {
		element.hidePopover();
		element.removeAttribute('popover');
		clearStyle(element, [...Object.keys(TOOLTIP_STYLE), 'translate']);
	}

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
	const { clientWidth, clientHeight } = document.documentElement;

	// Before measuring: in the top layer, the panel's min-width of 100% refers to the viewport, and the
	// popover's own insets combine with those of the panel position, both stretching the panel.
	Object.assign(panel.style, { minWidth: `${button.width}px`, left: '0px', right: 'auto', bottom: 'auto' });

	const box = (anchor?.() ?? buttonElement).getBoundingClientRect();
	const width = panel.offsetWidth;
	const height = panel.scrollHeight + panel.offsetHeight - panel.clientHeight;
	const below = clientHeight - button.bottom - VIEWPORT_MARGIN;
	const above = button.top - VIEWPORT_MARGIN;
	const upwards = height > below && above > below;
	const room = Math.max(upwards ? above : below, 0);
	const side = horizontalSide(dropdownView, !!anchor, box, width, clientWidth);
	const left = side === 'e' ? box.left : box.right - width;

	dropdownView.panelView.position = `${upwards ? 'n' : 's'}${side}` as const;
	Object.assign(panel.style, {
		top: `${upwards ? button.top - Math.min(height, room) : button.bottom}px`,
		left: `${Math.max(VIEWPORT_MARGIN, Math.min(left, clientWidth - VIEWPORT_MARGIN - width))}px`,
		maxHeight: height > room ? `${room}px` : '',
		overflowY: height > room ? 'auto' : 'visible',
	});
}

// 'e' opens the panel from the box's left edge towards the right, 'w' from its right edge towards the left.
function horizontalSide(dropdownView: DropdownView, anchored: boolean, box: DOMRect, width: number, clientWidth: number): Side {
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
		box.left + width <= clientWidth - VIEWPORT_MARGIN :
		box.right - width >= VIEWPORT_MARGIN;

	return fits(start) || !fits(end) ? start : end;
}
