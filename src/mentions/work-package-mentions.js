export function workPackageMentions(prefix) {
  return function (query) {
    let editor = this;
    const url = window.OpenProject.urlRoot + `/work_packages/auto_complete.json`;
    let base = window.OpenProject.urlRoot + `/work_packages/`;

    if (editor.config.get("disabledMentions").includes("work_package")) {
      return [];
    }

    return new Promise((resolve, _reject) => {
      jQuery.getJSON(url, { q: query, scope: "all" }, collection => {
        resolve(collection.map(wp => {
          const id = `${prefix}${wp.id}`;
          const idNumber = wp.id;

          return { id, idNumber, type: "work_package", text: id, name: wp.to_s, link: base + wp.id };
        }));
      });
    });
  };
}
