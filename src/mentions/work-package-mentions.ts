import { get } from '@rails/request.js';
import type {Editor} from "@ckeditor/ckeditor5-core";

export function workPackageMentions(prefix:string) {
  return function (this:Editor, query:string) {
    const editor = this;
    const url = window.OpenProject.urlRoot + `/work_packages/auto_complete.json`;
    const base = window.OpenProject.urlRoot + `/work_packages/`;

    const disabledMentions = editor.config.get("disabledMentions") as string[] | undefined;
    if (disabledMentions?.includes("work_package")) {
      return [];
    }

    return new Promise((resolve, reject) => {
      get(url, { responseKind: 'json', query: { q: query, scope: "all" } })
        .then(response => response.json)
        .then(collection => {
          resolve(collection.map(wp => {
            const id = `${prefix}${wp.id}`;
            const idNumber = wp.id;

            return { id, idNumber, type: "work_package", text: id, name: wp.to_s, link: base + wp.id };
          }));
        })
        .catch(error => {
          console.error('Error fetching work package mentions:', error);
          reject(error);
        });
    });
  };
}
