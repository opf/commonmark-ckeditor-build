import { get } from '@rails/request.js';

export function workPackageMentions(prefix) {
  return function (query) {
    let editor = this;
    const urlRoot = window.OpenProject.urlRoot;
    const url = `${urlRoot}/work_packages/auto_complete.json`;

    if (editor.config.get("disabledMentions").includes("work_package")) {
      return [];
    }

    return new Promise((resolve, reject) => {
      get(url, { responseKind: 'json', query: { q: query, scope: "all" } })
        .then(response => response.json)
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
