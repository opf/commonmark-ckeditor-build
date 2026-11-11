import {Plugin} from "@ckeditor/ckeditor5-core";
import type {Editor} from "@ckeditor/ckeditor5-core";
import OpContentRevisionsUI from "./ui";
import {scheduleRevisionCleanup} from "./storage";
import OpContentRevisionsCommand from "./command";
import {getOPFieldName, getOPResource, getOPService} from "../op-context/op-context";
import {Autosave} from "@ckeditor/ckeditor5-autosave";

export const OP_CONTENT_REVISION_KEY = "opContentRevisionKey";
export const OP_CONTENT_REVISION_PREFIX = "op_ckeditor_rev";
export const STORAGE_KEY_OVERRIDE = "storageKey";

export default class OpContentRevisions extends Plugin {

  static get requires() {
    return [Autosave, OpContentRevisionsUI];
  }

  static get pluginName() {
    return "OpContentRevisions";
  }

  constructor(editor: Editor) {
    super(editor);

    // Define a storage key for this instance
    const revisionKey = this.getStorageKey(editor);
    editor.config.define(OP_CONTENT_REVISION_KEY, revisionKey);
  }

  /**
   * @inheritDoc
   */
  init() {
    const editor = this.editor;

    editor.commands.add("opContentRevisionApply", new OpContentRevisionsCommand(editor));

    editor.once("ready", () => {
      // disable beforeunload hook, we have our own
      // @ts-expect-error _domEmitter is private; Autosave offers no public way to drop its beforeunload listener.
      editor.plugins.get("Autosave")._domEmitter.stopListening(window, "beforeunload");

      scheduleRevisionCleanup(revisionKeyPrefix(editor));
    });
  }

  /**
   * Get the storage key for the current editor instance.
   * If a StorageKey is defined in the editor configuration,
   * use that instead of the default key.
   */
  getStorageKey(editor: Editor) {
    const storageKey = editor.config.get(STORAGE_KEY_OVERRIDE);

	if (storageKey) {
	  return `${revisionKeyPrefix(editor)}${storageKey}`;
	}

    return this.createLocalStorageKey(editor)
  }

  /**
   * Create a storage key from the given resource, if available.
   * Fall back to using the current URL path.
   */
  createLocalStorageKey(editor: Editor) {
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

    return `${revisionKeyPrefix(editor)}${segment}`;
  }
}

export function revisionKeyPrefix(editor: Editor) {
  const userId = getOPService(editor, "currentUser").userId;

  return `${OP_CONTENT_REVISION_PREFIX}_u${userId}_`;
}
