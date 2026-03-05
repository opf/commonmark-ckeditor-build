/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import CommonMarkDataProcessor from './commonmarkdataprocessor';
import OpenProjectGFMDataProcessor from './op-gfm-data-processor';

interface CommonMarkEditorConfig {
	get(path:string):unknown;
}

interface CommonMarkEditor {
	data:{
		processor:unknown;
	};
	config?:CommonMarkEditorConfig;
	editing:{
		view:{
			document:unknown;
		};
	};
}

function useExperimentalGfmProcessor(editor:CommonMarkEditor):boolean {
	return editor.config?.get('openProject.useExperimentalGfmDataProcessor') === true;
}

// Simple plugin which loads the data processor.
export default function CommonMarkPlugin(editor:CommonMarkEditor) {
	editor.data.processor = useExperimentalGfmProcessor(editor)
		? new OpenProjectGFMDataProcessor(editor.editing.view.document as never)
		: new CommonMarkDataProcessor(editor.editing.view.document);
}
