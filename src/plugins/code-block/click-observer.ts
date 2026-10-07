import { DomEventObserver } from '@ckeditor/ckeditor5-engine';

export default class DoubleClickObserver extends DomEventObserver {
	constructor( view ) {
		super( view );

		this.domEventType = 'dblclick';
	}

	onDomEvent( domEvent ) {
		this.fire( domEvent.type, domEvent );
	}
}
