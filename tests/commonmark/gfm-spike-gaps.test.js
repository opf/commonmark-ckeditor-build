import CommonMarkDataProcessor from '../../src/commonmark/commonmarkdataprocessor';
import OpenProjectGFMDataProcessor from '../../src/commonmark/op-gfm-data-processor';
import { StylesProcessor, ViewDocument } from '@ckeditor/ckeditor5-engine';

function createProcessors() {
  const viewDocument = new ViewDocument(new StylesProcessor());

  return {
    legacy: new CommonMarkDataProcessor(viewDocument),
    gfm: new OpenProjectGFMDataProcessor(viewDocument),
  };
}

function roundTripViaView(markdown) {
  const { legacy, gfm } = createProcessors();
  const viewFragment = legacy.toView(markdown);

  return {
    legacyOut: legacy.toData(viewFragment),
    gfmOut: gfm.toData(viewFragment),
  };
}

describe('OpenProject GFM spike known gaps', () => {
  it('still differs on table markdown-vs-html round-trip strategy', () => {
    const markdown =
      '| Heading 1 | Heading 2\n' +
      '| --- | ---\n' +
      '| Cell 1 | Cell 2\n';

    const { legacyOut, gfmOut } = roundTripViaView(markdown);

    expect(gfmOut).not.toEqual(legacyOut);
    expect(legacyOut).toContain('<table>');
  });
});
