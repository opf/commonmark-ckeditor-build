import {
	getOPResource,
	getOPPath,
	getPluginContext,
} from "../plugins/op-context/op-context";

export function userMentions(queryText) {
	const editor = this;
	let resource = getOPResource(editor);

	if (resource && resource._type === 'Activity::Comment') {
		const workPackage = resource.$embedded.workPackage;
		if (workPackage) {
			resource = workPackage;
		}
	}

	// Unsupported context does not allow mentioning
	if (!(resource && resource._type === 'WorkPackage')) {
		return [];
	}

	if (editor.config.get('disabledMentions').includes('user')) {
		return [];
	}

	const url = getOPPath(editor).api.v3.principals(resource, queryText) + '&select=elements/_type,elements/id,elements/name';
	const pluginContext = getPluginContext(editor);
	const base = window.OpenProject.urlRoot;

	return new Promise((resolve, _reject) => {
		jQuery.getJSON(url, collection => {
			resolve(_.uniqBy(collection._embedded.elements, (el) => el.id).map(mention => {
				const type = mention._type.toLowerCase();
				const text = `@${mention.name}`;
				const id = `@${mention.id}`;
				const idNumber = mention.id;
				const typeSegment = pluginContext.services.apiV3Service[`${type}s`].segment;
				const link = `${base}/${typeSegment}/${idNumber}`;

				return {type, id, text, link, idNumber, name: mention.name};
			}));
		});
	})
}
