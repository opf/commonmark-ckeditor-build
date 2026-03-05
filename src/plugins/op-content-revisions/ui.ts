/**
 * @file registers the history_log toolbar button and binds functionality to it.
 */
import {Plugin} from "ckeditor5/src/core";
import {addListToDropdown, createDropdown} from "ckeditor5/src/ui";
import {Collection} from "ckeditor5/src/utils";
import type {Editor} from "@ckeditor/ckeditor5-core";
import { ViewModel } from "@ckeditor/ckeditor5-ui";
import type {ListDropdownButtonDefinition, ListDropdownItemDefinition} from "@ckeditor/ckeditor5-ui";
import {loadFromLocalStorage} from "./storage";
import {countWords, generateHash} from "./utils";

import imageIcon from "./../../icons/revisions.svg";
import {getOPI18n, getOPService} from "../op-context/op-context";
import {OP_CONTENT_REVISION_KEY} from "./op-content-revisions";

interface ExecuteEventSource {
  timestamp?:number;
}

interface ExecuteEvent {
  source:ExecuteEventSource;
}

interface TimezoneService {
  formattedRelativeDateTime(timestamp:number):string;
}

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

      dropdownView.on("execute", (evt:ExecuteEvent) => {
        const { timestamp } = evt.source;

        if (timestamp) {
          editor.execute("opContentRevisionApply", timestamp);
        }
      });

      return dropdownView;
    });
  }

}

function addAvailableRevisions(editor:Editor, collection:Collection<ListDropdownItemDefinition>) {
  const key = editor.config.get(OP_CONTENT_REVISION_KEY) as string;
  const record = loadFromLocalStorage(key);
  const i18n = getOPI18n(editor);
  const timezoneService = getOPService(editor, "timezone") as TimezoneService;

  if (!record?.items || record.items.length <= 0) {
    const def:ListDropdownButtonDefinition = {
      type: "button",
      model: new ViewModel({
        label: i18n.t('js.editor.no_revisions'),
        withText: true,
      }),
    };

    collection.add(def);
    return;
  }

  const currentContent = editor.getData();
  const currentHash = generateHash(currentContent);

  for (let index = record.items.length; index > 0; ) {
    index--;

    const data = record.items[index];
    const time = timezoneService.formattedRelativeDateTime(data.timestamp);
    const words = i18n.t("js.units.word", { count: countWords(data.content) });
    const matches = data.hash === currentHash ? `${i18n.t('js.label_current')} - ` : "";
    const label = `${matches}${time} (${words})`;

    const def:ListDropdownButtonDefinition = {
      type: "button",
      model: new ViewModel({
        timestamp: data.timestamp,
        label,
        withText: true,
      }),
    };

    collection.add(def);
  }
}
