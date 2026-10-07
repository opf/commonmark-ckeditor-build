export function getToolbarItems(editor) {
	editor.__currentlyDisabled = editor.__currentlyDisabled || [];

	if (!editor.ui.view.toolbar) {
		return [];
	}

	return editor.ui.view.toolbar.items._items;
}

export function disableItems(editor, except) {
	getToolbarItems(editor).forEach((item) => {
		if (item === except || !Object.prototype.hasOwnProperty.call(item, 'isEnabled')) {
			return;
		}

		if (item.isEnabled) {
			item.isEnabled = false;
		} else {
			editor.__currentlyDisabled.push(item);
		}
	});
}

export function enableItems(editor) {
	getToolbarItems(editor).forEach((item) => {
		if (Object.prototype.hasOwnProperty.call(item, 'isEnabled')
			&& editor.__currentlyDisabled.indexOf(item) < 0) {
			item.isEnabled = true;
		}
	});

	editor.__currentlyDisabled = [];
}
