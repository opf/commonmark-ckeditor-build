/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Editor } from '@ckeditor/ckeditor5-core';
import type { DataProcessor } from '@ckeditor/ckeditor5-engine';
import CommonMarkDataProcessor from './commonmarkdataprocessor';

// Simple plugin which loads the data processor.
export default function CommonMarkPlugin(editor: Editor) {
	// TODO(OP-18993): the processor lacks registerRawContentMatcher() and
	// useFillerType(), which the DataProcessor interface requires.
	editor.data.processor = new CommonMarkDataProcessor(editor) as unknown as DataProcessor;
}

