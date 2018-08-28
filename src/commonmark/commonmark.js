/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import CommonMarkDataProcessor from './commonmarkdataprocessor';

// Simple plugin which loads the data processor.
// eslint-disable-next-line no-unused-vars
export default function CommonMarkPlugin( editor ) {
	editor.data.processor = new CommonMarkDataProcessor();
}

