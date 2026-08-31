/**
 * @file registers the AI actions toolbar dropdown and hands the selected
 * action over to the core application.
 *
 * The plugin is deliberately thin: which actions exist, whether any are
 * available, and everything that happens after the user picks one (request,
 * loading state, diff preview, accept/reject) is owned by the core-side
 * service. The dropdown stays hidden until the service reports at least one
 * action, so instances without an assistant render no AI entry point at all.
 */
import { Plugin } from '@ckeditor/ckeditor5-core';
import { addListToDropdown, createDropdown } from '@ckeditor/ckeditor5-ui';
import { Collection } from '@ckeditor/ckeditor5-utils';

import sparkleIcon from './../icons/sparkle.svg';
import { getOPFieldName, getOPI18n, getOPResource, getPluginContext } from './op-context/op-context';

export default class OpAiActionsPlugin extends Plugin {
	static get pluginName() {
		return 'OPAiActions';
	}

	init() {
		const editor = this.editor;
		const service = aiActionsService(editor);

		// Cores that do not provide the service get no AI entry point.
		if (!service) {
			return;
		}

		editor.ui.componentFactory.add('opAiActions', locale => {
			const i18n = getOPI18n(editor);
			const dropdownView = createDropdown(locale);
			const collection = new Collection();

			dropdownView.set('class', 'op-ai-actions ck-hidden');

			addListToDropdown(dropdownView, collection, {
				role: 'menu',
				ariaLabel: i18n.t('js.editor.ai_actions.caption'),
			});

			dropdownView.buttonView.set({
				label: i18n.t('js.editor.ai_actions.caption'),
				icon: sparkleIcon,
				withText: true,
				tooltip: false,
			});

			service
				.actionsFor(getOPResource(editor), getOPFieldName(editor))
				.then(actions => {
					if (!actions || actions.length === 0) {
						return;
					}

					for (const action of actions) {
						collection.add({
							type: 'button',
							model: {
								action,
								label: action.label,
								withText: true,
							},
						});
					}

					dropdownView.set('class', 'op-ai-actions');
				})
				.catch(() => undefined);

			dropdownView.on('execute', evt => {
				const { action } = evt.source;

				if (action) {
					service.run(action, editor, getOPResource(editor));
				}
			});

			return dropdownView;
		});
	}
}

function aiActionsService(editor) {
	const context = getPluginContext(editor);
	return context && context.services && context.services.aiActions;
}
