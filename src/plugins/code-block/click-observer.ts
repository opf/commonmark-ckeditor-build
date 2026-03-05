import { DomEventObserver } from '@ckeditor/ckeditor5-engine';

export default class DoubleClickObserver extends DomEventObserver<'dblclick'> {
	public readonly domEventType = 'dblclick';

	onDomEvent( domEvent:MouseEvent ) {
		this.fire( domEvent.type, domEvent );
	}
}
