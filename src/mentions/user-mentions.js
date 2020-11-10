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
	const typeSegment = pluginContext.services.apiV3Service.users.segment;
	const linkBase = `${base}/${typeSegment}/`;


	return new Promise((resolve, reject) => {
		jQuery
			.getJSON(url, collection => {
				resolve(collection._embedded.elements.map(user => {
					const displayText = `@${user.name}`;
					const id = `@${user.id}`;

					return { type: 'user', id: id, text: displayText, name: user.name, link: linkBase + user.id };
				}));
			});
		})
}
