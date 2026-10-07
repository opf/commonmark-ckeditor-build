import { DomEventObserver } from '@ckeditor/ckeditor5-engine';
import type { BubblingEvent, EditingView, ViewDocumentDomEventData } from '@ckeditor/ckeditor5-engine';

// The event this observer fires on the view document.
export type ViewDocumentDoubleClickEvent = BubblingEvent<{
	name: 'dblclick';
	args: [data: ViewDocumentDomEventData<MouseEvent>];
}>;

export default class DoubleClickObserver extends DomEventObserver<'dblclick'> {
	declare domEventType: 'dblclick';

	constructor( view: EditingView ) {
		super( view );

		this.domEventType = 'dblclick';
	}

	onDomEvent( domEvent: MouseEvent ) {
		this.fire( domEvent.type, domEvent );
	}
}
