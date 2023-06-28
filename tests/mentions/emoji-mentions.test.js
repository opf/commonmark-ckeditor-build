import { emojiMentions } from "../../src/mentions/emoji-mentions.js";

describe('emojiMentions', () => {
	test('it matches a full emoji name', () => {
		return emojiMentions('thumbs_up').then(data => {
			expect(data.length).toBe(1);
			expect(data[0]).toEqual({id: ":thumbs_up:", name: "thumbs_up", text: "👍", type: "emoji"});
		});
	});

	test('it orders by score when there are multiple options', () => {
		return emojiMentions('star').then(data => {
			expect(data.length).toBe(14);
			expect(data[0]).toEqual({id: ":star:", name: "star", text: "⭐", type: "emoji"});
		});
	});
});
