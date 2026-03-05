declare module "*.svg" {
  const value: string;
  export default value;
}

declare const jQuery: any;
declare const I18n: any;
declare const _: any;

declare global {
  interface Window {
    OPConstrainedEditor: any;
    OPClassicEditor: any;
    OPEditorWatchdog: any;
  }
}

export {};
