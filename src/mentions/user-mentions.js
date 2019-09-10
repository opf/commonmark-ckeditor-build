import { getOPResource, getOPPath } from "../plugins/op-context/op-context";

export function userMentions(queryText) {
	 let editor = this;
	 let resource = getOPResource(editor);

	 // Unsupported context does not allow mentioning
	 if (!(resource && resource._type === 'WorkPackage')) {
		return [];
	 }

	const project_id = resource.project.idFromLink;
	const url = getOPPath(editor).api.v3.principals(project_id, queryText);
	let base = window.OpenProject.urlRoot + `/users/`;

	return new Promise((resolve, reject) => {
		jQuery
			.getJSON(url, collection => {
				resolve(collection._embedded.elements.map(user => {
					const type = user._type.toLowerCase();
					const displayText = `${type}#${user.id}`;
					const id = `@${user.id}`;
					return { type: 'user', id: id, text: displayText, name: user.name, link: base + user.id };
				}));
			});
		})
}
