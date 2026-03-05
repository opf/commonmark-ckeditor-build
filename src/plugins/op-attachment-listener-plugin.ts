import { Plugin } from '@ckeditor/ckeditor5-core';
import type {Editor} from '@ckeditor/ckeditor5-core';
import Selection from '@ckeditor/ckeditor5-engine/src/model/selection';

interface ImageModelElement {
	name:string;
	getAttribute(key:string):string | null;
}

export default class OPAttachmentListenerPlugin extends Plugin {
	static get pluginName() {
		return 'OPAttachmentListener';
	}

	init() {
		const editor = this.editor as Editor;

		editor.model.on('op:attachment-removed', (_, urls) => {
			this.removeDeletedImage(urls)
		});
	}

	removeDeletedImage(urls:string[]) {
		const editor = this.editor as Editor;
		const root = editor.model.document.getRoot();
		if (!root) {
			return;
		}

		for (const child of Array.from(root.getChildren())) {
			const modelChild = child as Partial<ImageModelElement>;
			if (typeof modelChild.name !== 'string' || typeof modelChild.getAttribute !== 'function') {
				continue;
			}

			const sourceUrl = modelChild.getAttribute('src');

			if (modelChild.name === 'image' && typeof sourceUrl === 'string' && urls.includes(sourceUrl)) {
				const selection = new Selection(child, 'on');

				editor.model.deleteContent(selection);
			}
		}

	}
}
