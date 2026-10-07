import type { Editor } from '@ckeditor/ckeditor5-core';
import OpMacroWikiPageLinkPlugin from "./op-macro-wiki-page-link-plugin";

export function insertWikiPageLink(editor: Editor, providerId: string | undefined, pageIdentifier: string | undefined) {
	if (!providerId || !pageIdentifier) {
		return;
	}

	const model = editor.model;

	model.change(writer => {
		const linkElement = writer.createElement(
			OpMacroWikiPageLinkPlugin.modelElementName,
			{ providerId, pageIdentifier }
		);

		model.insertContent(linkElement, model.document.selection);
	});
}

