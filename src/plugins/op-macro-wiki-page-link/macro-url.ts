import type { Editor } from '@ckeditor/ckeditor5-core';
import { getOPPath } from "../op-context/op-context";

export function macroUrl(editor: Editor, providerId: string, pageIdentifier: string, frameId: string) {
	return getOPPath(editor).wikiPageLinkMacro(providerId, pageIdentifier, frameId)
}
