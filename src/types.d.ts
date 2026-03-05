declare module "*.svg" {
  const value: string;
  export default value;
}

declare const jQuery: any;
declare const I18n: any;
declare const _: any;

interface Window {
  OPConstrainedEditor: any;
  OPClassicEditor: any;
  OPEditorWatchdog: any;
  OpenProject: any;
  I18n: any;
}
