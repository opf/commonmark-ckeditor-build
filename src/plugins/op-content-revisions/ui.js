/**
 * @file registers the history_log toolbar button and binds functionality to it.
 */
import {Plugin} from "ckeditor5/src/core";
import {addListToDropdown, createDropdown, Notification} from "ckeditor5/src/ui";
import {Collection} from "ckeditor5/src/utils";
import {loadFromLocalStorage} from "./storage";
import {countWords} from "./utils";

import imageIcon from "./../../icons/revisions.svg";
import {getOPI18n, getOPService} from "../op-context/op-context";
import {OP_CONTENT_REVISION_KEY} from "./op-content-revisions";

export default class OpContentRevisionsUI extends Plugin {

  init() {
    const editor = this.editor;
    const i18n = getOPI18n(editor);

    editor.ui.componentFactory.add("opContentRevisions", locale => {
      const dropdownView = createDropdown(locale);
      const collection = new Collection();

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
        const { timestamp } = evt.source;

        if (timestamp) {
          editor.execute("opContentRevisionApply", timestamp);
        }
      });

      return dropdownView;
    });
  }

}

function addAvailableRevisions(editor, collection) {
  const key = editor.config.get(OP_CONTENT_REVISION_KEY);
  const record = loadFromLocalStorage(key);
  const i18n = getOPI18n(editor);
  const timezoneService = getOPService(editor, "timezone");

  if (!record?.items || record.items.count <= 0) {
    const def = {
      type: "button",
      model: {
        label: i18n.t('js.editor.no_revisions'),
        withText: true,
      },
    };

    collection.add(def);
    return;
  }

  for (let index = record.items.length; index > 0; ) {
    index--;

    const data = record.items[index];
    const time = timezoneService.formattedRelativeDateTime(data.timestamp);
    const words = i18n.t("js.units.word", { count: countWords(data.content) });
    const label = `${time} (${words})`;

    const def = {
      type: "button",
      model: {
        timestamp: data.timestamp,
        label,
        withText: true,
      },
    };

    collection.add(def);
  }
}
