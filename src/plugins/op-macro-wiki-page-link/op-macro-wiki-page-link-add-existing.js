import { Plugin } from "@ckeditor/ckeditor5-core";
import { ButtonView } from "@ckeditor/ckeditor5-ui";

import { getOPPath, getOPService } from "../op-context/op-context";
import { insertWikiPageLink } from "./insert-wiki-page-link";

export default class OpMacroWikiPageLinkAddExisting extends Plugin {
	static get pluginName() {
		return 'OpMacroWikiPageLinkAddExisting';
	}

	static get buttonName() {
		return 'insertExistingWikiPageLink';
	}

	get label() {
		return window.I18n.t('js.editor.macro.wikis.add_existing');
	}

	closeDialogHandler = this.handleCloseDialog.bind(this)

	init() {
		const editor = this.editor;

		editor.ui.componentFactory.add(OpMacroWikiPageLinkAddExisting.buttonName, locale => {
			const view = new ButtonView(locale);
			view.set({ label: this.label, withText: true, });
			view.on('execute', () => { this.runModalDialog(editor); });
			return view;
		})
	}

	runModalDialog(editor) {
		document.addEventListener('dialog:close', this.closeDialogHandler);

		const turboRequests = getOPService(editor, 'turboRequests');
		const path = getOPPath(editor).openExistingWikiPageDialog();

		void turboRequests.request(path, { method: 'GET' });
	}

	handleCloseDialog(event) {
		if (event.detail.additional?.action !== 'close_existing_page_dialog') {
			// A previous step was closed, not the final stage of the dialog we expect.
			return;
		}

		document.removeEventListener('dialog:close', this.closeDialogHandler);
		const { providerId, pageIdentifier } = event.detail.additional;
		insertWikiPageLink(this.editor, providerId, pageIdentifier);
	}
}
