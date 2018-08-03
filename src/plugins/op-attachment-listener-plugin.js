import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Selection from '@ckeditor/ckeditor5-engine/src/model/selection';

export default class OPAttachmentListenerPlugin extends Plugin {
	static get pluginName() {
		return 'OPAttachmentListener';
	}

	init() {
		let editor = this.editor;

		editor.model.on('op:attachment-removed', (_, urls) => {
			this.removeDeletedImage(urls)
		});
	}

	removeDeletedImage(urls) {
		let root = this.editor.model.document.getRoot();

		for (const child of Array.from(root.getChildren())) {
			if (child.name === 'image' && urls.indexOf(child.getAttribute('src')) > -1) {
				const selection = new Selection( child, 'on' );

				this.editor.model.deleteContent(selection);
			}
		}

	}
}
