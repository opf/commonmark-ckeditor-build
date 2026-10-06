// These SVG file imports are handled by webpack's raw-text loader,
// so each icon holds the source SVG.
import insertMermaidIcon from '../../icons/mermaid-insert.svg';
import previewModeIcon from '../../icons/mermaid-preview-mode.svg';
import splitModeIcon from '../../icons/mermaid-split-mode.svg';
import sourceModeIcon from '../../icons/mermaid-source-mode.svg';
import infoIcon from '../../icons/mermaid-info.svg';

import { Plugin } from '@ckeditor/ckeditor5-core';
import { addListToDropdown, ButtonView, createDropdown, SplitButtonView, ViewModel } from '@ckeditor/ckeditor5-ui';
import { Collection } from '@ckeditor/ckeditor5-utils';

import { INSERT_MERMAID_COMMAND } from './insert_mermaid_command';

const MERMAID_DOCS_URL = 'https://mermaid.js.org/intro/';

export default class MermaidUI extends Plugin {

	static get pluginName() {
		return 'MermaidUI';
	}

	init() {
		this._addButtons();
	}

	_addButtons() {
		const editor = this.editor;
		const t = editor.t;

		this._addInsertMermaidButton();
		this._addMermaidInfoButton();
		this._createToolbarButton( 'mermaidPreview', t( 'Preview' ), previewModeIcon );
		this._createToolbarButton( 'mermaidSourceView', t( 'Source view' ), sourceModeIcon );
		this._createToolbarButton( 'mermaidSplitView', t( 'Split view' ), splitModeIcon );
	}

	/**
	 * Adds the button inserting a diagram. With `mermaid.samples` configured it becomes a split
	 * button whose dropdown lists those templates, the main action still inserting a blank diagram.
	 */
	_addInsertMermaidButton() {
		const editor = this.editor;
		const t = editor.t;
		const samples = editor.config.get( 'mermaid.samples' ) ?? [];

		editor.ui.componentFactory.add( 'mermaid', locale => {
			const command = editor.commands.get( INSERT_MERMAID_COMMAND );
			const buttonProperties = {
				label: t( 'Mermaid diagram' ),
				icon: insertMermaidIcon,
				tooltip: true
			};

			if ( !samples.length ) {
				const buttonView = new ButtonView( locale );

				buttonView.set( buttonProperties );
				buttonView.bind( 'isEnabled' ).to( command, 'isEnabled' );
				buttonView.on( 'execute', () => this._insertDiagram() );

				return buttonView;
			}

			const dropdownView = createDropdown( locale, SplitButtonView );

			dropdownView.buttonView.set( buttonProperties );
			dropdownView.buttonView.on( 'execute', () => this._insertDiagram() );

			addListToDropdown( dropdownView, this._getSampleDropdownItems( samples ) );

			// `createDropdown` already binds the split button's `isEnabled` to the
			// dropdown, so binding the dropdown alone disables both parts.
			dropdownView.bind( 'isEnabled' ).to( command, 'isEnabled' );
			dropdownView.on( 'execute', evt => {
				this._insertDiagram( { source: evt.source?.commandParam } );
			} );

			return dropdownView;
		} );
	}

	/**
	 * Inserts a diagram - blank by default, or pre-filled with the given template source - and
	 * moves the focus into its editing view.
	 */
	_insertDiagram( options = {} ) {
		const editor = this.editor;
		const view = editor.editing.view;

		const mermaidItem = editor.execute( INSERT_MERMAID_COMMAND, options );
		const mermaidItemViewElement = editor.editing.mapper.toViewElement( mermaidItem );

		view.scrollToTheSelection();
		view.focus();

		if ( mermaidItemViewElement ) {
			const mermaidItemDomElement = view.domConverter.viewToDom( mermaidItemViewElement );

			mermaidItemDomElement?.querySelector( '.ck-mermaid__editing-view' )?.focus();
		}
	}

	_getSampleDropdownItems( samples ) {
		const itemDefinitions = new Collection();

		for ( const sample of samples ) {
			itemDefinitions.add( {
				type: 'button',
				model: new ViewModel( {
					commandParam: sample.content,
					label: sample.name,
					role: 'menuitem',
					withText: true
				} )
			} );
		}

		return itemDefinitions;
	}

	_addMermaidInfoButton() {
		const editor = this.editor;
		const t = editor.t;

		editor.ui.componentFactory.add( 'mermaidInfo', locale => {
			const buttonView = new ButtonView( locale );

			buttonView.set( {
				label: t( 'Read more about Mermaid diagram syntax' ),
				icon: infoIcon,
				tooltip: true
			} );

			buttonView.on( 'execute', () => {
				const openHelp = editor.config.get( 'mermaid.openHelp' );

				if ( openHelp ) {
					openHelp();
				} else {
					window.open( MERMAID_DOCS_URL, '_blank', 'noopener' );
				}
			} );

			return buttonView;
		} );
	}

	/**
	 * Adds one of the display mode buttons shown in the widget's balloon toolbar.
	 * `label` arrives already translated - see `_addButtons()`.
	 */
	_createToolbarButton( name, label, icon ) {
		const editor = this.editor;

		editor.ui.componentFactory.add( name, locale => {
			const buttonView = new ButtonView( locale );
			const command = editor.commands.get( `${ name }Command` );

			buttonView.set( {
				label,
				icon,
				tooltip: true
			} );

			buttonView.bind( 'isOn', 'isEnabled' ).to( command, 'value', 'isEnabled' );

			command.listenTo( buttonView, 'execute', () => {
				editor.execute( `${ name }Command` );
				editor.editing.view.scrollToTheSelection();
				editor.editing.view.focus();
			} );

			return buttonView;
		} );
	}
}
