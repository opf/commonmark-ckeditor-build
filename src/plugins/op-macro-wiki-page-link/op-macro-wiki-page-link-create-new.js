import { Plugin } from "@ckeditor/ckeditor5-core";
import { ButtonView } from "@ckeditor/ckeditor5-ui";

import { getOPPath, getOPService } from "../op-context/op-context";
import { insertWikiPageLink } from "./insert-wiki-page-link";

export default class OpMacroWikiPageLinkCreateNew extends Plugin {
	static get pluginName() {
		return 'OpMacroWikiPageLinkCreateNew';
	}

	static get buttonName() {
		return 'createNewWikiPageLink';
	}

	get label() {
		return window.I18n.t('js.editor.macro.wikis.create_new');
	}

	closeDialogHandler = this.handleCloseDialog.bind(this)

	init() {
		const editor = this.editor;

		editor.ui.componentFactory.add(OpMacroWikiPageLinkCreateNew.buttonName, locale => {
			const view = new ButtonView(locale);
			view.set({ label: this.label, withText: true, });
			view.on('execute', () => { this.runModalDialog(editor); });
			return view;
		})
	}

	runModalDialog(editor) {
		document.addEventListener('dialog:close', this.closeDialogHandler);

		const turboRequests = getOPService(editor, 'turboRequests');
		const path = getOPPath(editor).inlineNewWikiPageDialog();

		void turboRequests.request(path, { method: 'GET' });
	}

	handleCloseDialog(event) {
		if (event.detail.additional?.action !== 'close_dialog_create_and_inline') {
			// A previous step was closed, not the final stage of the dialog we expect.
			return;
		}

		document.removeEventListener('dialog:close', this.closeDialogHandler);
		const { providerId, pageIdentifier } = event.detail.additional;
		insertWikiPageLink(this.editor, providerId, pageIdentifier);
	}
}
