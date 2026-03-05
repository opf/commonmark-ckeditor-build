import * as LZString from "lz-string";
import type {Editor} from "@ckeditor/ckeditor5-core";
import {generateHash} from "./utils";
import {OP_CONTENT_REVISION_KEY} from "./op-content-revisions";
import {getOPService} from "../op-context/op-context";

interface RevisionItem {
  timestamp:number;
  hash:number;
  content:string;
}

interface RevisionRecord {
  items:RevisionItem[];
  updatedAt:number;
}

interface NotificationService {
  addError(message:string):void;
}

function errorToString(error:Error):string {
  return error.toString();
}

export function loadFromLocalStorage(storageKey:string):RevisionRecord|null {
  const compressed = localStorage.getItem(storageKey);

  if (!compressed) {
    return null;
  }

  try {
    const decompressed = LZString.decompress(compressed);
    if (!decompressed) {
      return null;
    }

    return JSON.parse(decompressed) as RevisionRecord;
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    console.error("Failed to load CKEditor revisions from localStorage: " + errorToString(error));
    return null;
  }
}

export async function saveInLocalStorage(editor:Editor):Promise<boolean> {
  const timestamp = Date.now();
  const key = editor.config.get(OP_CONTENT_REVISION_KEY) as string;
  const content = editor.getData();

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
  const match = items.find((saved:RevisionItem) => item.hash === saved.hash);
  if (!match) {
    items.push(item);
  }

  try {
    const compressed = LZString.compress(JSON.stringify({ items, updatedAt: timestamp}));

    localStorage.setItem(key, compressed);
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    const notifications = getOPService(editor, "notifications") as NotificationService;
    notifications.addError("Failed to save CKEditor data to localStorage: " + errorToString(error));
  }

  return true;
}
