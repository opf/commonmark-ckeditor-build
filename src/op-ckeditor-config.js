import { userMentions } from "./mentions/user-mentions";
import { workPackageMentions } from "./mentions/work-package-mentions";
import {customItemRenderer} from './mentions/mentions-item-renderer';

export const defaultConfig = {
	heading: {
		options: [
			{ model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
			{ model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
			{ model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
			{ model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
			{ model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
			{ model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' }
		]
	},
	toolbar: {
		// Will be defined by each build
	},
	OPMacroEmbeddedTable: {
		toolbar: [
			'opEditEmbeddedTableQuery',
		]
	},
	OPMacroWpButton: {
		toolbar: [
			'opEditWpMacroButton',
		]
	},
	OPWikiIncludePage: {
		toolbar: [
			'opEditWikiIncludeMacroButton',
		]
	},
	OPCodeBlock: {
		toolbar: [
			'opEditCodeBlock',
		]
	},
	OPChildPages: {
		toolbar: [
			'opEditChildPagesMacroButton',
		]
	},
	image: {
		resizeOptions: [
			{
				name: 'imageResize:original',
				value: null,
				icon: 'original'
			},
			{
				name: 'imageResize:50',
				value: '50',
				icon: 'medium'
			},
			{
				name: 'imageResize:75',
				value: '75',
				icon: 'large'
			}
		],
		toolbar: [
			'toggleImageCaption',
			'imageTextAlternative',
			'|',
			'imageResize:50',
			'imageResize:75',
			'imageResize:original'
		]
	},
	table: {
		contentToolbar: [
			'tableColumn', 'tableRow', 'mergeTableCells',
			'tableProperties', 'tableCellProperties'
		]
	},

	mention: {
		feeds: [
			{
				marker: '@',
				feed: userMentions,
				itemRenderer: customItemRenderer,
				minimumCharacters: 0
			},
			{
				marker: '#',
				feed: workPackageMentions,
				itemRenderer: customItemRenderer,
				minimumCharacters: 1
			},
		]
	},

	language: 'en'
};
