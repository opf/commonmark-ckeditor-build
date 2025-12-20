export function workPackageMentions(prefix) {
  return function (query) {
    let editor = this;
    const url = window.OpenProject.urlRoot + `/work_packages/auto_complete.json`;
    let base = window.OpenProject.urlRoot + `/work_packages/`;

    if (editor.config.get("disabledMentions").includes("work_package")) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const params = new URLSearchParams({ q: query, scope: "all" });
      fetch(`${url}?${params.toString()}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
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
