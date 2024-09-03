import {Command} from "ckeditor5/src/core";
import {loadFromLocalStorage} from "./storage";
import {OP_CONTENT_REVISION_KEY} from "./op-content-revisions";

export default class OpContentRevisionsCommand extends Command {

  async execute (timestamp) {
    const editor = this.editor;
    const key = editor.config.get(OP_CONTENT_REVISION_KEY);

    const record = await loadFromLocalStorage(key);
    if (!record) {
      console.error(`Trying to load revision ${timestamp} but no record present.`)
      return;
    }

    const item = record.items.find(item => item.timestamp === timestamp);
    if (item) {
      editor.setData(item.content);
      setTimeout(() => {
        editor.editing.view.focus();
      });
    }
  }
}
