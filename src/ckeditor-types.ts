import type { Editor, EditorConfig, PluginConstructor } from '@ckeditor/ckeditor5-core';
import type EditorWatchdog from '@ckeditor/ckeditor5-watchdog/src/editorwatchdog';
import type { WatchdogState } from '@ckeditor/ckeditor5-watchdog/src/watchdog';
import type { CKEditorError } from '@ckeditor/ckeditor5-utils';

export interface CKEditorEvent {
  stop: () => void;
}

export interface CKEditorListenOptions {
  priority?: string;
}

export interface CKEditorDomEventData {
  altKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  keyCode: number;
}

export type ICKEditorInstance = Editor;

export interface ICKEditorStatic {
  create(el: HTMLElement, config?: EditorConfig): Promise<ICKEditorInstance>;
  createCustomized(el: string | HTMLElement, config?: EditorConfig): Promise<ICKEditorInstance>;
  builtinPlugins: PluginConstructor<Editor>[];
  defaultConfig?: EditorConfig;
}

export type ICKEditorState = WatchdogState;

export type ICKEditorError = CKEditorError;

export type ICKEditorWatchdog = typeof EditorWatchdog;

export type ICKEditorMentionType = "user" | "work_package";

type OpenProjectContextValue = string | number | boolean | null | undefined | string[];

export interface ICKEditorContext {
  resource?: {
    canAddAttachments?: boolean;
    [key: string]: OpenProjectContextValue;
  };
  field?: string;
  removePlugins?: string[];
  macros?: false | string[];
  options?: {
    rtl?: boolean;
  };
  previewContext?: string;
  disabledMentions?: ICKEditorMentionType[];
  storageKey?: string;
}
