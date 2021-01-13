import { getOPResource, getOPPath } from "../plugins/op-context/op-context";

export function workPackageMentions(query) {
	const url = window.OpenProject.urlRoot + `/work_packages/auto_complete.json`;
	let base = window.OpenProject.urlRoot + `/work_packages/`;

	return new Promise((resolve, reject) => {
		jQuery
			.getJSON(url, {q: query, scope: 'all'}, collection => {
				resolve(collection.map(wp => {
					const id = `#${wp.id}`;
					const idNumber = wp.id;

					return { id, idNumber, type: 'work_package', text: id, name: wp.to_s, link: base + wp.id };
				}));
			});
		})
}
