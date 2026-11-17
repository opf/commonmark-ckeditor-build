import { Plugin } from '@ckeditor/ckeditor5-core';
import { DropdownView } from '@ckeditor/ckeditor5-ui';
import type { View, ViewCollection } from '@ckeditor/ckeditor5-ui';

import { liftPanelToTopLayer } from './top-layer-panel';

/**
 * Opens the panels of the toolbar's dropdowns, including "Show more items",
 * in the top layer. See {@link liftPanelToTopLayer}.
 */
export default class OpToolbarPanelsPlugin extends Plugin {
	static get pluginName() {
		return 'OPToolbarPanels' as const;
	}

	init() {
		this.listenTo(this.editor.ui, 'ready', () => {
			const toolbar = this.editor.ui.view.toolbar;

			if (!toolbar) {
				return;
			}

			const toolbarElement = () => toolbar.element!;

			this.liftDropdowns(toolbar.items);
			// "Show more items" joins the children once the toolbar starts grouping. It sits
			// before other buttons, so its panel aligns to the toolbar's end instead.
			this.liftDropdowns(toolbar.children, toolbarElement);
		});
	}

	private liftDropdowns(views: ViewCollection, anchor?: () => HTMLElement) {
		const lift = (view: View) => {
			if (view instanceof DropdownView) {
				liftPanelToTopLayer(view, anchor);
			}
		};

		Array.from(views).forEach(lift);
		this.listenTo<{ name: 'add'; args: [View, number] }>(views, 'add', (evt, view) => lift(view));
	}
}
