import { Plugin } from '@ckeditor/ckeditor5-core';
import type { ModelElement } from '@ckeditor/ckeditor5-engine';

export default class OPAttachmentListenerPlugin extends Plugin {
	static get pluginName() {
		return 'OPAttachmentListener';
	}

	init() {
		let editor = this.editor;

		editor.model.on('op:attachment-removed', (_, urls: string[]) => {
			this.removeDeletedImage(urls)
		});
	}

	removeDeletedImage(urls: string[]) {
		let root = this.editor.model.document.getRoot();

		for (const child of Array.from(root!.getChildren())) {
			// Text nodes have no name, so the comparison is false for them.
			if ((child as ModelElement).name === 'image' && urls.indexOf(child.getAttribute('src') as string) > -1) {
				const selection = this.editor.model.createSelection( child, 'on' );

				this.editor.model.deleteContent(selection);
			}
		}

	}
}
