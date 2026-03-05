import {FileDialogButtonView} from '@ckeditor/ckeditor5-ui';
import type {Editor} from '@ckeditor/ckeditor5-core';

interface ToggleableView {
	isEnabled:boolean;
}

type ToolbarItem = FileDialogButtonView | ToggleableView;

interface EditorUIViewWithToolbar {
	toolbar?:{
		items:Iterable<ToolbarItem>;
	};
}

interface ToolbarEditor extends Editor {
	__currentlyDisabled?:ToggleableView[];
}

export function getToolbarItems(editor:ToolbarEditor):ToolbarItem[] {
	editor.__currentlyDisabled = editor.__currentlyDisabled || [];
	const editorUIView = editor.ui.view as EditorUIViewWithToolbar;

	if (!editorUIView.toolbar) {
		return [];
	}

	return Array.from(editorUIView.toolbar.items);
}

export function disableItems(editor:ToolbarEditor, except:ToolbarItem | null) {
	getToolbarItems(editor).forEach((item) => {
		let toDisable:ToggleableView | null = null;

		if (item instanceof FileDialogButtonView) {
			toDisable = item.buttonView as ToggleableView;
		} else if (item !== except && typeof item === 'object' && item !== null && 'isEnabled' in item) {
			toDisable = item as ToggleableView;
		}

		if (toDisable?.isEnabled) {
			toDisable.isEnabled = false;
		} else if (toDisable) {
			editor.__currentlyDisabled.push(toDisable);
		}
	});
}

export function enableItems(editor:ToolbarEditor) {
	getToolbarItems(editor).forEach((item) => {
		let toEnable:ToggleableView | null = null;

		if (item instanceof FileDialogButtonView) {
			toEnable = item.buttonView as ToggleableView;
		} else if (typeof item === 'object' && item !== null && 'isEnabled' in item) {
			toEnable = item as ToggleableView;
		}

		if (!toEnable) {
			return;
		}

		if (editor.__currentlyDisabled.indexOf(toEnable) < 0) {
			toEnable.isEnabled = true
		}
	});

	editor.__currentlyDisabled = [];
}
