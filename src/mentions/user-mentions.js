import {getOPResource, getOPPath, getPluginContext} from "../plugins/op-context/op-context";

export function userMentions(queryText) {
	 let editor = this;
	 let resource = getOPResource(editor);

	 // Unsupported context does not allow mentioning
	 if (!(resource && resource._type === 'WorkPackage')) {
		return [];
	 }

	const project_id = resource.project.idFromLink;
	const url = getOPPath(editor).api.v3.principals(project_id, queryText);
	const pluginContext = getPluginContext(editor);
	const base = window.OpenProject.urlRoot;

	return new Promise((resolve, reject) => {
		jQuery
			.getJSON(url, collection => {
				resolve(collection._embedded.elements.map(mention => {
					const type = mention._type.toLowerCase();
					const text = `@${mention.name}`;
					const id = `@${mention.id}`;
					const typesPathMap = {
						user: pluginContext.services.apiV3Service[`${type}s`].segment,
						group: `admin/${pluginContext.services.apiV3Service[`${type}s`].segment}`,
					}
					const typeSegment = typesPathMap[type];
					const link = `${base}/${typeSegment}/${mention.id}`;

					return { type, id, text, link, name: mention.name };
				}));
			});
		})
}
