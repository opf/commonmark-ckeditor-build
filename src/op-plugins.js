
import OPMacroTocPlugin from './plugins/op-macro-toc-plugin';
import OPMacroEmbeddedTable from './plugins/op-macro-embedded-table/embedded-table-plugin';
import OPMacroWpButtonPlugin from './plugins/op-macro-wp-button/op-macro-wp-button-plugin';
import OPWikiIncludePagePlugin from './plugins/op-macro-wiki-include/op-macro-wiki-include-plugin';
import {AtJsPlugin} from './plugins/op-atjs-plugin/atjs-plugin';
import OPLinkingWpPlugin from './plugins/op-linking-wp-plugin';
import OPMentioningPlugin from './plugins/op-mentioning-plugin';
import OpUploadPlugin from './plugins/op-upload-plugin';

// We divide our plugins into separate concerns here
// in order to enable / disable each group by configuration
export const opMacroPlugins = [
	OPMacroTocPlugin,
	OPMacroEmbeddedTable,
	OPMacroWpButtonPlugin,
	OPWikiIncludePagePlugin,
];

export const opMentioningPlugins = [
	AtJsPlugin,
	OPLinkingWpPlugin,
	OPMentioningPlugin,
]

export const opImageUploadPlugins = [
	OpUploadPlugin
]
