import OpMacroWikiPageLinkPlugin from "./op-macro-wiki-page-link-plugin";

export function insertWikiPageLink(editor, providerId, pageIdentifier) {
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

