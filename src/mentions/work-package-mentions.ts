import type { Editor } from '@ckeditor/ckeditor5-core';
import { get } from '@rails/request.js';
import type { OpMentionFeedItem } from '../op-types';

// An entry of core's work package autocompleter response.
interface AutocompleteWorkPackage {
	id: number;
	displayId?: string;
	to_s: string;
}

export function workPackageMentions(prefix: string) {
  return function (this: Editor, query: string) {
    let editor = this;
    const urlRoot = window.OpenProject.urlRoot;
    const url = `${urlRoot}/work_packages/auto_complete.json`;

    if (editor.config.get("disabledMentions")!.includes("work_package")) {
      return [];
    }

    return new Promise<OpMentionFeedItem[]>((resolve, reject) => {
      get(url, { responseKind: 'json', query: { q: query, scope: "all" } })
        .then(response => response.json as Promise<AutocompleteWorkPackage[]>)
        .then(collection => {
          resolve(collection.map(wp => {
            const displayId = wp.displayId || wp.id;
            const markerText = `${prefix}${displayId}`;

            // CKEditor's mention feed requires `id` to start with the
            // marker prefix; it's the model attribute and gates insertion.
            return {
              id: markerText,
              dataId: wp.id,
              dataDisplayId: displayId,
              type: "work_package",
              text: markerText,
              name: wp.to_s,
              link: `${urlRoot}/work_packages/${displayId}`,
            };
          }));
        })
        .catch(error => {
          console.error('Error fetching work package mentions:', error);
          reject(error);
        });
    });
  };
}
