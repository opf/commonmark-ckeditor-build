/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module mention/mentionui
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import Collection from '@ckeditor/ckeditor5-utils/src/collection';
import BalloonPanelView from '@ckeditor/ckeditor5-ui/src/panel/balloon/balloonpanelview';
import clickOutsideHandler from '@ckeditor/ckeditor5-ui/src/bindings/clickoutsidehandler';
import { keyCodes } from '@ckeditor/ckeditor5-utils/src/keyboard';
import Rect from '@ckeditor/ckeditor5-utils/src/dom/rect';
import CKEditorError from '@ckeditor/ckeditor5-utils/src/ckeditorerror';

import TextWatcher from './textwatcher';

import MentionsView from './ui/mentionsview';
import DomWrapperView from './ui/domwrapperview';
import MentionListItemView from './ui/mentionlistitemview';

const VERTICAL_SPACING = 3;

/**
 * The mention UI feature.
 *
 * @extends module:core/plugin~Plugin
 */
export default class MentionUI extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'MentionUI';
	}

	/**
	 * @inheritDoc
	 */
	constructor( editor ) {
		super( editor );

		/**
		 * The balloon panel view, containing the mention view.
		 *
		 * @type {module:ui/panel/balloon/balloonpanelview~BalloonPanelView}
		 */
		this.panelView = this._creatPanelView();

		/**
		 * The mentions view.
		 *
		 * @type {module:mention/ui/mentionsview~MentionsView}
		 * @private
		 */
		this._mentionsView = this._createMentionView();

		/**
		 * Stores mentions feeds configurations.
		 *
		 * @type {Map<String, Object>}
		 * @private
		 */
		this._mentionsConfigurations = new Map();

		editor.config.define( 'mention', { feeds: [] } );
	}

	/**
	 * @inheritDoc
	 */
	init() {
		// Key listener that handles navigation in mention view.
		this.editor.editing.view.document.on( 'keydown', ( evt, data ) => {
			if ( isHandledKey( data.keyCode ) && this.panelView.isVisible ) {
				data.preventDefault();
				evt.stop(); // Required for enter overriding.

				if ( data.keyCode == keyCodes.arrowdown ) {
					this._mentionsView.selectNext();
				}

				if ( data.keyCode == keyCodes.arrowup ) {
					this._mentionsView.selectPrevious();
				}

				if ( data.keyCode == keyCodes.enter || data.keyCode == keyCodes.tab || data.keyCode == keyCodes.space ) {
					this._mentionsView.executeSelected();
				}

				if ( data.keyCode == keyCodes.esc ) {
					this._hidePanelAndRemoveMarker();
				}
			}
		}, { priority: 'highest' } ); // Required to override enter.

		// Close the #panelView upon clicking outside of the plugin UI.
		clickOutsideHandler( {
			emitter: this.panelView,
			contextElements: [ this.panelView.element ],
			activator: () => this.panelView.isVisible,
			callback: () => this._hidePanelAndRemoveMarker()
		} );

		const feeds = this.editor.config.get( 'mention.feeds' );
		this.feeds = {};

		for ( const mentionDescription of feeds ) {
			const feed = mentionDescription.feed;

			const marker = mentionDescription.marker;

			if ( !marker || marker.length != 1 ) {
				/**
				 * The marker must be a single character.
				 *
				 * Correct markers: `'@'`, `'#'`.
				 *
				 * Incorrect markers: `'$$'`, `'[@'`.
				 *
				 * See {@link module:mention/mention~MentionConfig}.
				 *
				 * @error mentionconfig-incorrect-marker
				 */
				throw new CKEditorError( 'mentionconfig-incorrect-marker: The marker must be provided and be a single character.' );
			}

			const minimumCharacters = mentionDescription.minimumCharacters || 0;
			const allowedPrefixes = mentionDescription.allowedPrefixes || [];
			const feedCallback = typeof feed == 'function' ? feed.bind(this) : createFeedCallback( feed );
			const watcher = this._setupTextWatcherForFeed( marker, allowedPrefixes, minimumCharacters );
			const itemRenderer = mentionDescription.itemRenderer;

			const definition = { watcher, marker, feedCallback, allowedPrefixes, itemRenderer };

			this._mentionsConfigurations.set( marker, definition );
		}
	}

	/**
	 * @inheritDoc
	 */
	destroy() {
		super.destroy();

		// Destroy created UI components as they are not automatically destroyed (see ckeditor5#1341).
		this.panelView.destroy();
	}

	/**
	 * Creates the {@link #panelView}.
	 *
	 * @private
	 * @returns {module:ui/panel/balloon/balloonpanelview~BalloonPanelView}
	 */
	_creatPanelView() {
		const panelView = new BalloonPanelView( this.editor.locale );

		panelView.withArrow = false;
		panelView.render();

		this.editor.ui.view.body.add( panelView );

		return panelView;
	}

	/**
	 * Creates the {@link #_mentionsView}.
	 *
	 * @private
	 * @returns {module:mention/ui/mentionsview~MentionsView}
	 */
	_createMentionView() {
		const locale = this.editor.locale;

		const mentionsView = new MentionsView( locale );

		this._items = new Collection();

		this.panelView.content.add( mentionsView );

		mentionsView.items.bindTo( this._items ).using( data => {
			const { item, marker } = data;

			const listItemView = new MentionListItemView( locale );

			const view = this._renderItem( item, marker );
			view.delegate( 'execute' ).to( listItemView );

			listItemView.children.add( view );
			listItemView.item = item;
			listItemView.marker = marker;

			listItemView.on( 'execute', () => {
				mentionsView.fire( 'execute', {
					item,
					marker
				} );
			} );

			return listItemView;
		} );

		mentionsView.on( 'execute', ( evt, data ) => {
			const editor = this.editor;
			const model = editor.model;

			const item = data.item;
			const marker = data.marker;

			const watcher = this._getWatcher( marker );

			const text = watcher.last;

			const config = this._mentionsConfigurations.get(marker);

			const textMatcher = createTextMatcher( marker, config.allowedPrefixes );
			const matched = textMatcher( text );

			// Determine the text we want to insert
			const insert = matched.prefix + item.text;
			// Determine length of text to remove
			const totalLength = matched.total.length;

			// Create a range on matched text.
			const end = model.createPositionAt( model.document.selection.focus );
			const start = end.getShiftedBy( -totalLength );
			const range = model.createRange( start, end );

			this._hidePanelAndRemoveMarker();

			editor.execute( 'mention', {
				mention: item,
				text: insert,
				marker,
				range
			} );

			editor.editing.view.focus();
		} );

		return mentionsView;
	}

	/**
	 * Returns item renderer for marker.
	 *
	 * @private
	 * @param {String} marker
	 * @returns {Function|null}
	 */
	_getItemRenderer( marker ) {
		const { itemRenderer } = this._mentionsConfigurations.get( marker );

		return itemRenderer;
	}

	/**
	 * Returns a promise that resolves with autocomplete items for given text.
	 *
	 * @param {String} marker
	 * @param {String} feedText
	 * @return {Promise<module:mention/mention~MentionFeedItem>}
	 * @private
	 */
	_getFeed( marker, feedText ) {
		const { feedCallback } = this._mentionsConfigurations.get( marker );

		return Promise.resolve().then( () => feedCallback( feedText ) );
	}

	/**
	 * Registers a text watcher for marker.
	 *
	 * @private
	 * @param {String} marker
	 * @param {Number} minimumCharacters
	 * @returns {module:mention/textwatcher~TextWatcher}
	 */
	_setupTextWatcherForFeed( marker, allowedPrefixes, minimumCharacters ) {
		const editor = this.editor;

		const watcher = new TextWatcher( editor, createTestCallback( marker, allowedPrefixes, minimumCharacters ), createTextMatcher( marker, allowedPrefixes ) );

		watcher.on( 'matched', ( evt, data ) => {
			const matched = data.matched;

			const selection = editor.model.document.selection;

			const hasMention = selection.hasAttribute( 'mention' );
			const nodeBefore = selection.focus.nodeBefore;

			if ( hasMention || nodeBefore && nodeBefore.is( 'text' ) && nodeBefore.hasAttribute( 'mention' ) ) {
				return;
			}

			const { feedText, marker } = matched;

			const matchedTextLength = marker.length + feedText.length;

			// create marker range
			const start = selection.focus.getShiftedBy( -matchedTextLength );
			const end = selection.focus.getShiftedBy( -feedText.length );

			const markerRange = editor.model.createRange( start, end );

			let mentionMarker;

			if ( editor.model.markers.has( 'mention' ) ) {
				mentionMarker = editor.model.markers.get( 'mention' );
			} else {
				mentionMarker = editor.model.change( writer => writer.addMarker( 'mention', {
					range: markerRange,
					usingOperation: false,
					affectsData: false
				} ) );
			}

			this._getFeed( marker, feedText )
				.then( feed => {
					this._items.clear();

					for ( const feedItem of feed ) {
						const item = typeof feedItem != 'object' ? { id: feedItem, text: feedItem } : feedItem;

						this._items.add( { item, marker } );
					}

					if ( this._items.length ) {
						this._showPanel( mentionMarker );
					} else {
						this._hidePanelAndRemoveMarker();
					}
				} );
		} );

		watcher.on( 'unmatched', () => {
			this._hidePanelAndRemoveMarker();
		} );

		return watcher;
	}

	/**
	 * Returns registered text watcher for marker.
	 *
	 * @private
	 * @param {String} marker
	 * @returns {module:mention/textwatcher~TextWatcher}
	 */
	_getWatcher( marker ) {
		const { watcher } = this._mentionsConfigurations.get( marker );

		return watcher;
	}

	/**
	 * Shows the {@link #panelView}. If panel is already visible it will reposition it.
	 *
	 * @private
	 */
	_showPanel( markerMarker ) {
		this.panelView.pin( this._getBalloonPanelPositionData( markerMarker, this.panelView.position ) );
		this.panelView.show();
		this._mentionsView.selectFirst();
	}

	/**
	 * Hides the {@link #panelView} and remove 'mention' marker from markers collection.
	 *
	 * @private
	 */
	_hidePanelAndRemoveMarker() {
		if ( this.editor.model.markers.has( 'mention' ) ) {
			this.editor.model.change( writer => writer.removeMarker( 'mention' ) );
		}

		this.panelView.unpin();
		// Make last matched position on panel view undefined so the #_getBalloonPanelPositionData() will return all positions on next call.
		this.panelView.position = undefined;
		this.panelView.hide();
	}

	/**
	 * Renders a single item in the autocomplete list.
	 *
	 * @private
	 * @param {module:mention/mention~MentionFeedItem} item
	 * @param {String} marker
	 * @returns {module:ui/button/buttonview~ButtonView|module:mention/ui/domwrapperview~DomWrapperView}
	 */
	_renderItem( item, marker ) {
		const editor = this.editor;

		let view;
		let label = item.id;

		const renderer = this._getItemRenderer( marker );

		if ( renderer ) {
			const renderResult = renderer( item );

			if ( typeof renderResult != 'string' ) {
				view = new DomWrapperView( editor.locale, renderResult );
			} else {
				label = renderResult;
			}
		}

		if ( !view ) {
			const buttonView = new ButtonView( editor.locale );

			buttonView.label = label;
			buttonView.withText = true;

			view = buttonView;
		}

		return view;
	}

	/**
	 * Creates position options object used to position the balloon panel.
	 *
	 * @param {module:engine/model/markercollection~Marker} mentionMarker
	 * @param {String|undefined} positionName Name of last matched position name.
	 * @returns {module:utils/dom/position~Options}
	 * @private
	 */
	_getBalloonPanelPositionData( mentionMarker, positionName ) {
		const editing = this.editor.editing;
		const domConverter = editing.view.domConverter;
		const mapper = editing.mapper;

		return {
			target: () => {
				const viewRange = mapper.toViewRange( mentionMarker.getRange() );

				const rangeRects = Rect.getDomRangeRects( domConverter.viewRangeToDom( viewRange ) );

				return rangeRects.pop();
			},
			limiter: () => {
				const view = this.editor.editing.view;
				const viewDocument = view.document;
				const editableElement = viewDocument.selection.editableElement;

				if ( editableElement ) {
					return view.domConverter.mapViewToDom( editableElement.root );
				}

				return null;
			},
			positions: getBalloonPanelPositions( positionName ),
			fitInViewport: true
		};
	}
}

// Returns balloon positions data callbacks.
//
// @returns {Array.<module:utils/dom/position~Position>}
function getBalloonPanelPositions( positionName ) {
	const positions = {
		// Positions panel to the south of caret rect.
		'caret_se': targetRect => {
			return {
				top: targetRect.bottom + VERTICAL_SPACING,
				left: targetRect.right,
				name: 'caret_se'
			};
		},

		// Positions panel to the north of caret rect.
		'caret_ne': ( targetRect, balloonRect ) => {
			return {
				top: targetRect.top - balloonRect.height - VERTICAL_SPACING,
				left: targetRect.right,
				name: 'caret_ne'
			};
		},

		// Positions panel to the south of caret rect.
		'caret_sw': ( targetRect, balloonRect ) => {
			return {
				top: targetRect.bottom + VERTICAL_SPACING,
				left: targetRect.right - balloonRect.width,
				name: 'caret_sw'
			};
		},

		// Positions panel to the north of caret rect.
		'caret_nw': ( targetRect, balloonRect ) => {
			return {
				top: targetRect.top - balloonRect.height - VERTICAL_SPACING,
				left: targetRect.right - balloonRect.width,
				name: 'caret_nw'
			};
		}
	};

	// Return only last position if it was matched to prevent panel from jumping after first match.
	if ( positions.hasOwnProperty( positionName ) ) {
		return [
			positions[ positionName ]
		];
	}

	// As default return all positions callbacks.
	return [
		positions.caret_se,
		positions.caret_ne,
		positions.caret_sw,
		positions.caret_nw
	];
}

// Creates a regex pattern for marker.
//
// @param {String} marker
// @param {Number} minimumCharacters
// @returns {String}
function createPattern( marker, allowedPrefixes, minimumCharacters ) {
	allowedPrefixes = allowedPrefixes || []
	allowedPrefixes.push('^');
	allowedPrefixes.push(' ');
	const prefixes  = (allowedPrefixes || []).join('|');

	const numberOfCharacters = minimumCharacters == 0 ? '*' : `{${ minimumCharacters },}`;

	return `(${prefixes})(\\${ marker })([_a-zA-Z0-9À-ž]${ numberOfCharacters }?)$`;
}

// Creates a test callback for marker to be used in text watcher instance.
//
// @param {String} marker
// @param {Number} minimumCharacters
// @returns {Function}
function createTestCallback( marker, allowedPrefixes, minimumCharacters ) {
	const regExp = new RegExp( createPattern( marker, allowedPrefixes, minimumCharacters ) );

	return text => regExp.test( text );
}

// Creates a text watcher matcher for marker.
//
// @param {String} marker
// @returns {Function}
function createTextMatcher( marker, allowedPrefixes ) {
	const regExp = new RegExp( createPattern( marker, allowedPrefixes, 0 ) );

	return text => {
		const match = text.match( regExp );

		const marker = match[ 2 ];
		const feedText = match[ 3 ];
		const total = match[0];
		const prefix = match[1];

		return { marker, feedText, total, prefix };
	};
}

// Default feed callback
function createFeedCallback( feedItems ) {
	return feedText => {
		const filteredItems = feedItems
		// Make default mention feed case-insensitive.
			.filter( item => {
				// Item might be defined as object.
				const itemId = typeof item == 'string' ? item : String( item.id );

				// The default feed is case insensitive.
				return itemId.toLowerCase().includes( feedText.toLowerCase() );
			} )
			// Do not return more than 10 items.
			.slice( 0, 10 );

		return Promise.resolve( filteredItems );
	};
}

// Checks if given key code is handled by the mention ui.
//
// @param {Number}
// @returns {Boolean}
function isHandledKey( keyCode ) {
	const handledKeyCodes = [
		keyCodes.arrowup,
		keyCodes.arrowdown,
		keyCodes.enter,
		keyCodes.tab,
		keyCodes.space,
		keyCodes.esc
	];

	return handledKeyCodes.includes( keyCode );
}