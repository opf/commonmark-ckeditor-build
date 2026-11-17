import type { DropdownView } from '@ckeditor/ckeditor5-ui';

const VIEWPORT_MARGIN = 8;
// Replaces the panel's absolute position, which scrolls with the page in the top layer, and the popover's own
// margin, overflow and color. Inline, so no stylesheet of the host has to know about lifted panels.
const TOP_LAYER_STYLE = { position: 'fixed', margin: '0', overflow: 'visible', color: 'inherit' };
const lifted = new WeakSet<DropdownView>();

/**
 * Opens the dropdown's panel in the top layer, so no clipping or stacking
 * ancestor of the editor (widget boxes, split panes, sticky toolbars of other
 * editors) can hide it. The panel keeps its place in the DOM, so focus
 * tracking, keyboard handling and clicks outside behave as before.
 *
 * The panel opens below the button, or above it when there is more room there,
 * and is aligned to the end of `anchor` (the button by default).
 */
export function liftPanelToTopLayer(dropdownView: DropdownView, anchor?: () => HTMLElement) {
	if (lifted.has(dropdownView)) {
		return;
	}

	lifted.add(dropdownView);

	const reposition = () => place(dropdownView, anchor);
	let buttonObserver: IntersectionObserver | undefined;

	// Runs after the dropdown has made its panel visible and picked a position.
	dropdownView.on('change:isOpen', (evt, name, isOpen) => {
		const panel = dropdownView.panelView.element!;

		if (isOpen && canLift(panel)) {
			panel.setAttribute('popover', 'manual');
			Object.assign(panel.style, TOP_LAYER_STYLE);
			panel.showPopover();
			place(dropdownView, anchor);
			// Unlike before, the panel is no longer clipped together with the button.
			buttonObserver = new IntersectionObserver(([entry]) => {
				if (!entry.isIntersecting) {
					dropdownView.isOpen = false;
				}
			});
			buttonObserver.observe(dropdownView.buttonView.element!);
			dropdownView.listenTo(document, 'scroll', reposition, { useCapture: true, usePassive: true });
			dropdownView.listenTo(window, 'resize', reposition);
		} else if (!isOpen && panel.hasAttribute('popover')) {
			buttonObserver?.disconnect();
			dropdownView.stopListening(document, 'scroll', reposition);
			dropdownView.stopListening(window, 'resize', reposition);
			panel.hidePopover();
			panel.removeAttribute('popover');
			panel.removeAttribute('style');
		}
	}, { priority: 'low' });
}

function canLift(panel: HTMLElement) {
	// A dropdown inside a lifted panel, such as one grouped into "Show more items", opens within it.
	return typeof panel.showPopover === 'function' && typeof IntersectionObserver === 'function' &&
		!panel.parentElement?.closest('.ck-dropdown__panel[popover]');
}

function place(dropdownView: DropdownView, anchor?: () => HTMLElement) {
	const panel = dropdownView.panelView.element!;
	const buttonElement = dropdownView.buttonView.element!;
	const button = buttonElement.getBoundingClientRect();
	const { clientWidth, clientHeight } = document.documentElement;

	// Before measuring: in the top layer, the panel's min-width of 100% refers to the viewport, and the
	// popover's own insets combine with those of the panel position, both stretching the panel.
	Object.assign(panel.style, { minWidth: `${button.width}px`, left: '0px', right: 'auto', bottom: 'auto' });

	const rtl = dropdownView.locale?.uiLanguageDirection === 'rtl';
	const box = (anchor?.() ?? buttonElement).getBoundingClientRect();
	const width = panel.offsetWidth;
	const height = panel.scrollHeight + panel.offsetHeight - panel.clientHeight;
	const below = clientHeight - button.bottom - VIEWPORT_MARGIN;
	const above = button.top - VIEWPORT_MARGIN;
	const upwards = height > below && above > below;
	const room = Math.max(upwards ? above : below, 0);
	const left = rtl ? box.left : box.right - width;

	dropdownView.panelView.position = `${upwards ? 'n' : 's'}${rtl ? 'e' : 'w'}` as const;
	Object.assign(panel.style, {
		top: `${upwards ? button.top - Math.min(height, room) : button.bottom}px`,
		left: `${Math.max(VIEWPORT_MARGIN, Math.min(left, clientWidth - VIEWPORT_MARGIN - width))}px`,
		maxHeight: height > room ? `${room}px` : '',
		overflowY: height > room ? 'auto' : 'visible',
	});
}

