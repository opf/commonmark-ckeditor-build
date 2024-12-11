import {FileDialogButtonView} from '@ckeditor/ckeditor5-ui';

export function getToolbarItems(editor) {
	editor.__currentlyDisabled = editor.__currentlyDisabled || [];

	if (!editor.ui.view.toolbar) {
		return [];
	}

	return editor.ui.view.toolbar.items._items;
}

export function disableItems(editor, except) {
	jQuery.each(getToolbarItems(editor), function (index, item) {
		let toDisable = item;

		if (item instanceof FileDialogButtonView) {
			toDisable = item.buttonView;
		} else if (item === except || !Object.prototype.hasOwnProperty.call(item, 'isEnabled')) {
			toDisable = null;
		}

		if (!toDisable) {
			// do nothing
		} else if (toDisable.isEnabled) {
			toDisable.isEnabled = false;
		} else {
			editor.__currentlyDisabled.push(toDisable);
		}
	});
}

export function enableItems(editor) {
	jQuery.each(getToolbarItems(editor), function (index, item) {
		let toEnable = item;

		if (item instanceof FileDialogButtonView) {
			toEnable = item.buttonView;
		}

		if (editor.__currentlyDisabled.indexOf(toEnable) < 0) {
			toEnable.isEnabled = true
		}
	});

	editor.__currentlyDisabled = [];
}
