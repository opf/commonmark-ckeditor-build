import { Plugin } from '@ckeditor/ckeditor5-core';

import '../../theme/mermaid.css';
import MermaidEditing from './mermaid_editing';
import MermaidToolbar from './mermaid_toolbar';
import MermaidUI from './mermaid_ui';

/**
 * The Mermaid diagram feature: a `<mermaid>` block widget with a source textarea and a rendered
 * preview, switchable between source / split / preview modes.
 *
 * The mermaid library itself is not a dependency - the host supplies it through
 * `config.mermaid.lazyLoad`, so the diagram renderer is only fetched when a diagram is shown.
 *
 * Derived from CKSource's `@ckeditor/ckeditor5-mermaid`; see `LICENSE.md` and `README.md` next to
 * this file.
 */
export default class Mermaid extends Plugin {

	static get requires() {
		return [ MermaidEditing, MermaidToolbar, MermaidUI ];
	}

	static get pluginName() {
		return 'Mermaid';
	}

}
