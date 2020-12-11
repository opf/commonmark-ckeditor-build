/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import WidgetToolbarRepository from '@ckeditor/ckeditor5-widget/src/widgettoolbarrepository';
import { isWidget } from '@ckeditor/ckeditor5-widget/src/utils';

function isTableWidget( viewElement ) {
	return !!viewElement.getCustomProperty( 'table' ) && isWidget( viewElement );
}

function findAncestor( parentName, positionOrElement ) {
	let parent = positionOrElement.parent;

	while ( parent ) {
		if ( parent.name === parentName ) {
			return parent;
		}

		parent = parent.parent;
	}
}

export function getTableWidgetAncestor( selection ) {
	const parentTable = findAncestor( 'table', selection.getFirstPosition() );

	if ( parentTable && isTableWidget( parentTable.parent.parent ) ) {
		return parentTable.parent.parent;
	}

	return null;
}


export default class OpTableToolbar extends Plugin {
	static get requires() {
		return [ WidgetToolbarRepository ];
	}

	static get pluginName() {
		return 'TableToolbar';
	}

	afterInit() {
		const editor = this.editor;
		const t = editor.t;
		const widgetToolbarRepository = editor.plugins.get( WidgetToolbarRepository );

		const tableContentToolbarItems = editor.config.get( 'table.contentToolbar' );

		const tableToolbarItems = editor.config.get( 'table.tableToolbar' );

		if ( tableContentToolbarItems ) {
			widgetToolbarRepository.register( 'tableContent', {
				ariaLabel: t( 'Table toolbar' ),
				items: tableContentToolbarItems,
				getRelatedElement: getTableWidgetAncestor,
			} );
		}

		if ( tableToolbarItems ) {
			widgetToolbarRepository.register( 'table', {
				ariaLabel: t( 'Table toolbar' ),
				items: tableToolbarItems,
				getRelatedElement: getTableWidgetAncestor,
			} );
		}
	}
}
