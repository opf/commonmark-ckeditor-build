// The slice of an editor these helpers touch. It is declared structurally because
// `toolbar` only exists on some UI views, `_items` is private in CKEditor's
// ViewCollection, and `__currentlyDisabled` is bookkeeping this file adds.
interface ToolbarItem {
	isEnabled?: boolean;
}

interface EditorWithToolbar {
	__currentlyDisabled?: ToolbarItem[];
	ui: {
		view: {
			toolbar?: {
				items: {
					_items: ToolbarItem[];
				};
			};
		};
	};
}

export function getToolbarItems(editor: EditorWithToolbar) {
	editor.__currentlyDisabled = editor.__currentlyDisabled || [];

	if (!editor.ui.view.toolbar) {
		return [];
	}

	return editor.ui.view.toolbar.items._items;
}

export function disableItems(editor: EditorWithToolbar, except?: ToolbarItem) {
	getToolbarItems(editor).forEach((item) => {
		if (item === except || !Object.prototype.hasOwnProperty.call(item, 'isEnabled')) {
			return;
		}

		if (item.isEnabled) {
			item.isEnabled = false;
		} else {
			editor.__currentlyDisabled!.push(item);
		}
	});
}

export function enableItems(editor: EditorWithToolbar) {
	getToolbarItems(editor).forEach((item) => {
		if (Object.prototype.hasOwnProperty.call(item, 'isEnabled')
			&& editor.__currentlyDisabled!.indexOf(item) < 0) {
			item.isEnabled = true;
		}
	});

	editor.__currentlyDisabled = [];
}
