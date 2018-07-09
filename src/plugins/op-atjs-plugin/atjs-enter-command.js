import EnterCommand from "@ckeditor/ckeditor5-enter/src/entercommand"

export default class AtJsEnterCommand extends EnterCommand {

	execute() {
		if (!this.atJsOpen) {
			super.execute()
		}
	}

	get isAtJsOpen() {
		return this.atJsOpen;
	}

	set isAtJsOpen(value) {
		this.atJsOpen = value;
	}
}
