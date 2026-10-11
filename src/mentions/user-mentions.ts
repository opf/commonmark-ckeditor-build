import {
	getOPResource,
	getOPPath,
	getPluginContext,
} from "../plugins/op-context/op-context";
import type { Editor } from '@ckeditor/ckeditor5-core';
import { get } from '@rails/request.js';
import type { OpMentionFeedItem } from '../op-types';

// The part of an APIv3 principals collection that is selected below.
interface PrincipalCollection {
	_embedded: {
		elements: { _type: string; id: number; name: string }[];
	};
}

function uniqBy<T>(items: T[], keyFn: (item: T) => unknown) {
	const seen = new Set();
	return items.filter(item => {
		const key = keyFn(item);
		if (seen.has(key)) {
			return false;
		}
		seen.add(key);
		return true;
	});
}

export function userMentions(this: Editor, queryText: string) {
	const editor = this;
	let resource = getOPResource(editor);

	if (resource && resource._type === 'Activity::Comment') {
		const workPackage = resource.$embedded!.workPackage;
		if (workPackage) {
			resource = workPackage;
		}
	}

	// Unsupported context does not allow mentioning
	if (!(resource && resource._type === 'WorkPackage')) {
		return [];
	}

	if (editor.config.get('disabledMentions')!.includes('user')) {
		return [];
	}

	const url = getOPPath(editor).api.v3.principals(resource, queryText);
	const pluginContext = getPluginContext(editor);
	const base = window.OpenProject.urlRoot;

	return new Promise<OpMentionFeedItem[]>((resolve, reject) => {
		get(url, { responseKind: 'json', query: { select: 'elements/_type,elements/id,elements/name' } })
			.then(response => response.json as Promise<PrincipalCollection>)
			.then(collection => {
				resolve(uniqBy(collection._embedded.elements, (el) => el.id).map(mention => {
					const type = mention._type.toLowerCase();
					const text = `@${mention.name}`;
					const id = `@${mention.id}`;
					const typeSegment = pluginContext!.services.apiV3Service[`${type}s`].segment;
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
