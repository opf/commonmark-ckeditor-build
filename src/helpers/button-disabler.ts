import type { Editor } from '@ckeditor/ckeditor5-core';

interface ToolbarItem {
	isEnabled?: boolean;
}

// `__currentlyDisabled` is bookkeeping these helpers keep on the editor.
type EditorWithDisabledItems = Editor & {
	__currentlyDisabled?: ToolbarItem[];
};

export function getToolbarItems(editor: EditorWithDisabledItems) {
	editor.__currentlyDisabled = editor.__currentlyDisabled || [];

	if (!editor.ui.view.toolbar) {
		return [];
	}

	// `_items` is private in CKEditor's ViewCollection.
	return (editor.ui.view.toolbar.items as unknown as { _items: ToolbarItem[] })._items;
}

export function disableItems(editor: EditorWithDisabledItems, except?: ToolbarItem) {
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

export function enableItems(editor: EditorWithDisabledItems) {
	getToolbarItems(editor).forEach((item) => {
		if (Object.prototype.hasOwnProperty.call(item, 'isEnabled')
			&& editor.__currentlyDisabled!.indexOf(item) < 0) {
			item.isEnabled = true;
		}
	});

	editor.__currentlyDisabled = [];
}
