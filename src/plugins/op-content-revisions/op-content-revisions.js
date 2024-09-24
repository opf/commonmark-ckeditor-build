import {Plugin} from "ckeditor5/src/core";
import OpContentRevisionsUI from "./ui";
import {loadFromLocalStorage} from "./storage";
import OpContentRevisionsCommand from "./command";
import {getOPFieldName, getOPResource} from "../op-context/op-context";
import {Autosave} from "@ckeditor/ckeditor5-autosave";

export const OP_CONTENT_REVISION_KEY = "opContentRevisionKey";
export const OP_CONTENT_REVISION_PREFIX = "op_ckeditor_rev";

export default class OpContentRevisions extends Plugin {

  static get requires() {
    return [Autosave, OpContentRevisionsUI];
  }

  static get pluginName() {
    return "OpContentRevisions";
  }

  constructor(editor) {
    super(editor);

    // Define a storage key for this instance
    const revisionKey = this.createLocalStorageKey(editor);
    editor.config.define(OP_CONTENT_REVISION_KEY, revisionKey);
  }

  /**
   * @inheritDoc
   */
  init() {
    const editor = this.editor;

    editor.commands.add("opContentRevisionApply", new OpContentRevisionsCommand(editor));

    // Remove expired revisions for all saved drafts
    editor.once("ready", () => {
      const now = Date.now();

      // disable beforeunload hook, we have our own
      editor.plugins.get("Autosave")._domEmitter.stopListening(window, "beforeunload");

      Object
        .keys(localStorage)
        .forEach((key) => {
          if (key.startsWith(OP_CONTENT_REVISION_PREFIX)) {
            const record = loadFromLocalStorage(key);

            // Remove data that is older than 8 hours
            if (record?.updatedAt && (now - record.updatedAt) >= 28800000) {
              localStorage.removeItem(key);
            }
          }
        });
    });
  }

  /**
   * Create a storage key from the given resource, if available.
   * Fall back to using the current URL path.
   */
  createLocalStorageKey(editor) {
    const resource = getOPResource(editor);
    const field = getOPFieldName(editor);

    let segment = "";

    if (resource?.href) {
      segment = resource.href;
    } else {
      segment = location.pathname;
    }

    if (field) {
      segment += `_${field}`;
    }


    return `${OP_CONTENT_REVISION_PREFIX}_${segment}`;
  }
}
