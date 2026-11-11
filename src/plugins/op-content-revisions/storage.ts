import type { Editor } from "@ckeditor/ckeditor5-core";
import * as LZString from "lz-string";
import {generateHash} from "./utils";
import {OP_CONTENT_REVISION_KEY, OP_CONTENT_REVISION_PREFIX, revisionKeyPrefix} from "./op-content-revisions";
import {getOPService} from "../op-context/op-context";

const REVISION_MAX_AGE = 8 * 60 * 60 * 1000;
const CLEANUP_DELAY = 1000;

// Unscoped storage keys that core passed before revision keys were prefixed with the user.
const LEGACY_STORAGE_KEYS = [
  /^work_package-\d+-notes-(\d+|new)$/,
  /^forum-topic-\d*-reply-(\d+|new)$/,
  /^meeting-(\d+|new)-agenda-item-(\d+|new)$/,
  /^meeting-agenda-(\d+|new)-outcome-(\d+|new)$/,
];

let cleanupTimer: ReturnType<typeof setTimeout> | undefined;

export interface OpRevision {
  timestamp: number;
  hash: number;
  content: string;
}

export interface OpRevisionRecord {
  items: OpRevision[];
  updatedAt?: number;
}

export function loadFromLocalStorage(storageKey: string): OpRevisionRecord | null {
  const compressed = localStorage.getItem(storageKey);

  if (!compressed) {
    return null;
  }

  try {
    return JSON.parse(LZString.decompress(compressed));
  } catch (e) {
    console.error("Failed to load CKEditor revisions from localStorage: " + (e as Error).toString());
    return null;
  }
}

export async function saveInLocalStorage(editor: Editor) {
  const timestamp = Date.now();
  // The revisions plugin defines the key in its constructor.
  const key = editor.config.get(OP_CONTENT_REVISION_KEY)!;
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
    notifications.addError("Failed to save CKEditor data to localStorage: " + (e as Error).toString());
  }

  scheduleRevisionCleanup(revisionKeyPrefix(editor));

  return true;
}

export function scheduleRevisionCleanup(ownPrefix: string) {
  clearTimeout(cleanupTimer);
  cleanupTimer = setTimeout(() => removeForeignAndExpiredRevisions(ownPrefix), CLEANUP_DELAY);
}

export function removeForeignAndExpiredRevisions(ownPrefix: string, now = Date.now()) {
  Object
    .keys(localStorage)
    .forEach((key) => {
      if (key.startsWith(ownPrefix)) {
        const updatedAt = loadFromLocalStorage(key)?.updatedAt;

        if (!updatedAt || now - updatedAt >= REVISION_MAX_AGE) {
          localStorage.removeItem(key);
        }
      } else if (key.startsWith(OP_CONTENT_REVISION_PREFIX) || LEGACY_STORAGE_KEYS.some((pattern) => pattern.test(key))) {
        localStorage.removeItem(key);
      }
    });
}
