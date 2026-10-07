/**
 * @file registers the history_log toolbar button and binds functionality to it.
 */
import {Plugin} from "@ckeditor/ckeditor5-core";
import type {Editor} from "@ckeditor/ckeditor5-core";
import {addListToDropdown, createDropdown} from "@ckeditor/ckeditor5-ui";
import type {ListDropdownItemDefinition} from "@ckeditor/ckeditor5-ui";
import {Collection} from "@ckeditor/ckeditor5-utils";
import {loadFromLocalStorage} from "./storage";
import {countWords, generateHash} from "./utils";

import imageIcon from "./../../icons/revisions.svg";
import {getOPI18n, getOPService} from "../op-context/op-context";
import {OP_CONTENT_REVISION_KEY} from "./op-content-revisions";

export default class OpContentRevisionsUI extends Plugin {

  init() {
    const editor = this.editor;
    const i18n = getOPI18n(editor);

    editor.ui.componentFactory.add("opContentRevisions", locale => {
      const dropdownView = createDropdown(locale);
      const collection = new Collection<ListDropdownItemDefinition>();

      // Create a dropdown with a list inside the panel.
      addListToDropdown(dropdownView, collection, {
        role: "menu",
        ariaLabel: i18n.t('js.editor.revisions'),
      });

      // Create dropdown model.
      dropdownView.buttonView.set({
        label: i18n.t('js.editor.revisions'),
        icon: imageIcon,
        tooltip: true,
      });

      // Populate the dropdown with the history when the button is clicked.
      this.listenTo(dropdownView.buttonView, "execute", async () => {
        collection.clear();
        addAvailableRevisions(editor, collection);
      });

      dropdownView.on("execute", (evt) => {
        // The source is the list item's model, which carries the timestamp set below.
        const { timestamp } = evt.source as { timestamp?: number };

        if (timestamp) {
          editor.execute("opContentRevisionApply", timestamp);
        }
      });

      return dropdownView;
    });
  }

}

function addAvailableRevisions(editor: Editor, collection: Collection<ListDropdownItemDefinition>) {
  // The revisions plugin defines the key in its constructor.
  const key = editor.config.get(OP_CONTENT_REVISION_KEY)!;
  const record = loadFromLocalStorage(key);
  const i18n = getOPI18n(editor);
  const timezoneService = getOPService(editor, "timezone");

  // TODO(OP-18993): arrays have no `count`, so the second condition is always false.
  if (!record?.items || (record.items as unknown as { count: number }).count <= 0) {
    const def = {
      type: "button",
      model: {
        label: i18n.t('js.editor.no_revisions'),
        withText: true,
      },
    // CKEditor types `model` as a UIModel; a plain object with the same properties is passed.
    } as unknown as ListDropdownItemDefinition;

    collection.add(def);
    return;
  }

  const currentContent = editor.getData();
  const currentHash = generateHash(currentContent);

  for (let index = record.items.length; index > 0; ) {
    index--;

    const data = record.items[index];
    // TODO(OP-18993): core declares this parameter as a datetime string; a numeric timestamp is passed.
    const time = timezoneService.formattedRelativeDateTime(data.timestamp as unknown as string);
    const words = i18n.t("js.units.word", { count: countWords(data.content) });
    const matches = data.hash === currentHash ? `${i18n.t('js.label_current')} - ` : "";
    const label = `${matches}${time} (${words})`;

    const def = {
      type: "button",
      model: {
        timestamp: data.timestamp,
        label,
        withText: true,
      },
    // CKEditor types `model` as a UIModel; a plain object with the same properties is passed.
    } as unknown as ListDropdownItemDefinition;

    collection.add(def);
  }
}
