import { getOPResource, getOPPath } from "../plugins/op-context/op-context";

export function workPackageMentions(query) {
	const url = window.OpenProject.urlRoot + `/work_packages/auto_complete.json`;
	let base = window.OpenProject.urlRoot + `/work_packages/`;

	return new Promise((resolve, reject) => {
		jQuery
			.getJSON(url, {q: query, scope: 'all'}, collection => {
				resolve(collection.map(wp => {
					const id = `#${wp.id}`;
					return { type: 'work_package', id: id, text: id, name: wp.to_s, link: base + wp.id };
				}));
			});
		})
}
