import { getOPPath } from "../op-context/op-context";

export function macroUrl(editor, providerId, pageIdentifier, frameId) {
	return getOPPath(editor).wikiPageLinkMacro(providerId, pageIdentifier, frameId)
}
