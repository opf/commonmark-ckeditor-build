import { get } from '@rails/request.js';

export function workPackageMentions(prefix) {
  return function (query) {
    let editor = this;
    const url = window.OpenProject.urlRoot + `/work_packages/auto_complete.json`;
    let base = window.OpenProject.urlRoot + `/work_packages/`;

    if (editor.config.get("disabledMentions").includes("work_package")) {
      return [];
    }

    return new Promise((resolve, reject) => {
      get(url, { responseKind: 'json', query: { q: query, scope: "all" } })
        .then(response => response.json)
        .then(collection => {
          resolve(collection.map(wp => {
            const displayId = wp.displayId || wp.id;
            const id = `${prefix}${displayId}`;

            return {
              id,
              dataId: wp.id,
              dataDisplayId: displayId,
              type: "work_package",
              text: id,
              name: wp.to_s,
              link: base + displayId,
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
