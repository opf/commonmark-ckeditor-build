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

describe('OpenProject GFM spike parity', () => {
  it('keeps macro markup compatible', () => {
    const markdown = '<macro class="child_pages"></macro>';
    const { legacyOut, gfmOut } = roundTripViaView(markdown);

    expect(gfmOut).toEqual(legacyOut);
  });

  it('keeps mention markup compatible', () => {
    const markdown = '<mention class="mention" data-id="5" data-type="user" data-text="@admin">@admin</mention>';
    const { legacyOut, gfmOut } = roundTripViaView(markdown);

    expect(gfmOut).toEqual(legacyOut);
  });

  it('keeps page-break markdown token compatible', () => {
    const markdown = '<br style="page-break-after:always;">';
    const { legacyOut, gfmOut } = roundTripViaView(markdown);

    expect(gfmOut).toEqual(legacyOut);
  });
});
