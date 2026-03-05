import GFMDataProcessor from '@ckeditor/ckeditor5-markdown-gfm/src/gfmdataprocessor';
import type { ViewDocument, ViewDocumentFragment } from '@ckeditor/ckeditor5-engine';
import { PAGE_BREAK_MARKDOWN } from './utils/page-breaks';

export default class OpenProjectGFMDataProcessor {
  private readonly gfm:GFMDataProcessor;

  constructor(document:ViewDocument) {
    this.gfm = new GFMDataProcessor(document);

    // Preserve OpenProject-specific HTML nodes in markdown output.
    this.gfm.keepHtml('macro' as never);
    this.gfm.keepHtml('mention' as never);
    this.gfm.keepHtml('table');
    this.gfm.keepHtml('figure');
    this.gfm.keepHtml('div');
  }

  toView(data:string):ViewDocumentFragment {
    return this.gfm.toView(data);
  }

  toData(viewFragment:ViewDocumentFragment):string {
    const markdown = this.gfm.toData(viewFragment);

    return markdown
      // Keep legacy OpenProject page-break markdown token.
      .replace(/<div class="page-break"><\/div>/g, PAGE_BREAK_MARKDOWN)
      // Keep legacy macro formatting with a trailing newline before closing tag.
      .replace(/<macro([^>]*)><\/macro>/g, '<macro$1>\\n</macro>');
  }
}
