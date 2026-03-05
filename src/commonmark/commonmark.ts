/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import CommonMarkDataProcessor from './commonmarkdataprocessor';

interface CommonMarkEditor {
	data:{
		processor:unknown;
	};
	editing:{
		view:{
			document:unknown;
		};
	};
}

// Simple plugin which loads the data processor.
export default function CommonMarkPlugin(editor:CommonMarkEditor) {
	editor.data.processor = new CommonMarkDataProcessor(editor.editing.view.document);
}
