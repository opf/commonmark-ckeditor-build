import DomEventObserver from "@ckeditor/ckeditor5-engine/src/view/observer/domeventobserver";

export default class ClickObserver extends DomEventObserver {
	constructor( view ) {
		super( view );

		this.domEventType = 'click';
	}

	onDomEvent( domEvent ) {
		this.fire( domEvent.type, domEvent );
	}
}
