import {
	getOPResource,
	getOPPath,
	getPluginContext,
} from "../plugins/op-context/op-context";
import { get } from '@rails/request.js';
import type {Editor} from "@ckeditor/ckeditor5-core";

interface MentionablePrincipal {
	_type:string;
	id:string|number;
	name:string;
}

export function userMentions(this:Editor, queryText:string) {
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

	const disabledMentions = editor.config.get('disabledMentions') as string[] | undefined;
	if (disabledMentions?.includes('user')) {
		return [];
	}

	const url = getOPPath(editor).api.v3.principals(resource, queryText);
	const pluginContext = getPluginContext(editor);
	const base = window.OpenProject.urlRoot;

	return new Promise((resolve, reject) => {
		get(url, { responseKind: 'json', query: { select: 'elements/_type,elements/id,elements/name' } })
			.then(response => response.json)
			.then(collection => {
				const mentions = _.uniqBy(
					(collection._embedded.elements || []) as MentionablePrincipal[],
					(el:MentionablePrincipal) => el.id
				).map((mention:MentionablePrincipal) => {
					const type = mention._type.toLowerCase();
					const text = `@${mention.name}`;
					const id = `@${mention.id}`;
					const idNumber = mention.id;
					const typeSegment = pluginContext.services.apiV3Service[`${type}s`].segment;
					const link = `${base}/${typeSegment}/${idNumber}`;

					return {type, id, text, link, idNumber, name: mention.name};
				});

				resolve(mentions);
			})
			.catch(error => {
				console.error('Error fetching user mentions:', error);
				reject(error);
			});
	});
}
