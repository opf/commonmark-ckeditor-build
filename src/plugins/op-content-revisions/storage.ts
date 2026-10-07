import * as LZString from "lz-string";
import {generateHash} from "./utils";
import {OP_CONTENT_REVISION_KEY} from "./op-content-revisions";
import {getOPService} from "../op-context/op-context";

export function loadFromLocalStorage(storageKey) {
  const compressed = localStorage.getItem(storageKey);

  if (!compressed) {
    return null;
  }

  try {
    return JSON.parse(LZString.decompress(compressed));
  } catch (e) {
    console.error("Failed to load CKEditor revisions from localStorage: " + e.toString());
    return null;
  }
}

export async function saveInLocalStorage(editor) {
  const timestamp = Date.now();
  const key = editor.config.get(OP_CONTENT_REVISION_KEY);
  const content = await editor.getData();

  // Do not try to save if content is undefined
  if (!content) {
    console.warn("Trying to save snapshot but data is not defined.");
  }

  const item = {
    timestamp,
    hash: generateHash(content),
    content,
  };

  const record = loadFromLocalStorage(key);
  const items = record?.items || [];

  // Unless there is a entry with a matching hash, append new save
  const match = items.find(saved => item.hash === saved.hash);
  if (!match) {
    items.push(item);
  }

  try {
    const compressed = LZString.compress(JSON.stringify({ items, updatedAt: timestamp}));

    localStorage.setItem(key, compressed);
  } catch (e) {
    const notifications = getOPService(editor, "notifications");
    notifications.addError("Failed to save CKEditor data to localStorage: " + e.toString());
  }

  return true;
}
