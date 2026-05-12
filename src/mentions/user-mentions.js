import {
	getOPResource,
	getOPPath,
	getPluginContext,
} from "../plugins/op-context/op-context";
import { get } from '@rails/request.js';

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

	const url = getOPPath(editor).api.v3.principals(resource, queryText);
	const pluginContext = getPluginContext(editor);
	const base = window.OpenProject.urlRoot;

	return new Promise((resolve, reject) => {
		get(url, { responseKind: 'json', query: { select: 'elements/_type,elements/id,elements/name' } })
			.then(response => response.json)
			.then(collection => {
				resolve(_.uniqBy(collection._embedded.elements, (el) => el.id).map(mention => {
					const type = mention._type.toLowerCase();
					const text = `@${mention.name}`;
					const id = `@${mention.id}`;
					const typeSegment = pluginContext.services.apiV3Service[`${type}s`].segment;
					const link = `${base}/${typeSegment}/${mention.id}`;

					return {type, id, text, link, dataId: mention.id, name: mention.name};
				}));
			})
			.catch(error => {
				console.error('Error fetching user mentions:', error);
				reject(error);
			});
	});
}
