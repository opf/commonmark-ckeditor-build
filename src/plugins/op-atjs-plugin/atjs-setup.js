export function setupAtJs(editor, url) {
	editor.model.document.once('change', () => {
		let editable = jQuery(editor.element).closest('op-ckeditor-form').find('.ck-editor__editable');

		editable.atwho({
			at: '#',
			startWithSpace: false,
			searchKey: 'id_subject',
			displayTpl: '<li data-value="${atwho-at}${id}">${id}</li>',
			insertTpl: "${atwho-at}${id}",
			limit: 10,
			callbacks: {
				/*
                 Readd the 'span.atwho-query' used for positioning the dropdown.
                 The ckeditor will have removed the span added by at.js.
                 The functionality mimics at.js' behaviour. It additionally stores the information in the at.js instance
                 for later retrieval (#beforeInsert) when we again need to reconstruct the span.
                */
				remoteFilter: function (query, callback) {
					let that = this;

					jQuery.getJSON(url, {q: query, scope: 'all'}, function (data) {
						if (data) {
							addConcatenatedIdSubject(data);

							that.query.el = reconstructRangeFromCurrentPosition.call(that, query);

							if (jQuery(editable).is(':visible')) {
								callback(data);
							}
							else {
								// discard the results if the textarea is no longer visible,
								// i.e. nobody cares for the results
								callback([]);
							}
						}
					});
				},
				/*
                  Override default sorting to not sort as that is already done in the backend
                */
				sorter: function (query, items, search_key) {
					return items;
				},
				/*
                  Readd the 'span.atwho-query' used for positioning the dropdown.
                  The ckeditor will have removed the span added by us in the remoteFilter callback again.
                  We rely on the information used in the remoteFilter callback to reconstruct the correct range we than surround with the span
                  but cannot use the exact same range as ranges keep track of changes to the dom. As the span gets removed by ckeditor, the span
                  is no longer part of the dom and the range points to an unattached fragement.
                  For unknown reasons, the range's start- and end-container also buble up one level which is why we need to take their first
                  child element, a text node, again.
                */
				beforeInsert: function (value, $li, e) {
					this.query.el = reconstructRangeFromCurrentProperties.call(this);

					return value;

				}
			},
			functionOverrides: {
				/*
				  Override the insert function. This is basically a copy of at.js' insert function with the focus
				  functionality removed.
				  The default insert function set the focus to the beginning of the editor field as it focused the contenteditable editor.
				  This is undesirable if there is an embedded contenteditable e.g. the tds of a table in which the string is inserted. The focus should
				  stay in that td.
				*/
				insert: function (content, $li) {
					let data, range, suffix, suffixNode;
					suffix = (suffix = this.getOpt('suffix')) === "" ? suffix : suffix || "\u00A0";
					data = $li.data('item-data');
					this.query.el.removeClass('atwho-query').addClass('atwho-inserted').html(content).attr('data-atwho-at-query', "" + data['atwho-at'] + this.query.text).attr('contenteditable', "false");
					if (range = this._getRange()) {
						if (this.query.el.length) {
							range.setEndAfter(this.query.el[0]);
						}
						range.collapse(false);
						range.insertNode(suffixNode = this.app.document.createTextNode("" + suffix));
						this._setRange('after', suffixNode, range);
					}
					return this.$inputor.change();
				}
			}
		});

		// disable enter when atwho is displayed, reenable it once atwho is done
		jQuery(editor.ui.view.element).on('shown.atwho', () => {
			editor.commands.get("enter").isAtJsOpen = true;
		});
		jQuery(editor.ui.view.element).on('hidden.atwho', () => {
			editor.commands.get("enter").isAtJsOpen = false;
		});

		let addConcatenatedIdSubject = function (data) {
			for (let i = data.length - 1; i >= 0; i--) {
				data[i]['id_subject'] = data[i]['id'].toString() + ' ' + data[i]['subject'];
			}
		};

		let reconstructRangeFromCurrentPosition = function (query) {
			let $query = newAtJsSpan(this.app.document);
			let range = this._getRange();
			let index = range.startOffset - this.at.length - query.length;

			range.setStart(range.startContainer, index);

			this.currentRangeProperties = {current: range, start: index, end: range.endOffset};

			range.surroundContents($query.get(0));

			return $query;
		};

		let reconstructRangeFromCurrentProperties = function () {
			let $query = newAtJsSpan(this.app.document);
			let currentRange = this.currentRangeProperties.current;
			let range = currentRange.cloneRange();
			let startTextNode = currentRange.startContainer.childNodes[0];
			let endTextNode = currentRange.endContainer.childNodes[0];

			range.setStart(startTextNode, this.currentRangeProperties.start);
			range.setEnd(endTextNode, this.currentRangeProperties.end);
			range.surroundContents($query.get(0));

			return $query;
		};

		let newAtJsSpan = function (doc) {
			return jQuery('<span/>', doc).addClass('atwho-query');
		}
	});
}
