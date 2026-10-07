/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/* eslint-env node */


const path = require( 'path' );
const webpack = require( 'webpack' );
const { bundler, styles } = require( '@ckeditor/ckeditor5-dev-utils' );
const TerserPlugin = require( 'terser-webpack-plugin' );

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const core = process.env.OPENPROJECT_CORE;

if (!core) {
	throw new Error("Expected OPENPROJECT_CORE to be present, but wasn't.");
}

module.exports = {
	devtool: 'source-map',
	performance: { hints: false },

	entry: path.resolve( __dirname, 'src', 'op-ckeditor.ts' ),

	mode: mode,

	resolve: {
		extensions: [ '.ts', '.js', '.json' ]
	},

	output: {
		library: 'OPEditor',
		path: path.resolve(core, 'frontend/src/vendor/ckeditor/' ),
		filename: 'ckeditor.js',
		libraryTarget: 'umd',
		libraryExport: 'default',
	},

	optimization: {
		minimizer: [
			new TerserPlugin( {
				terserOptions: {
					output: {
						// Preserve CKEditor 5 license comments.
						comments: /^!/
					}
				},
				extractComments: false
			} )
		]
	},


	plugins: [
		new webpack.BannerPlugin( {
			banner: bundler.getLicenseBanner(),
			raw: true
		} )
	],

	module: {
		rules: [
			{
				test: /\.ts$/,
				loader: 'ts-loader',
				options: {
					// Type checking runs separately (npm run typecheck).
					transpileOnly: true,
					compilerOptions: {
						noEmit: false,
						sourceMap: true
					}
				}
			},
			{
				test: /\.svg$/,
				use: [ 'raw-loader' ]
			},
			{
				test: /\.css$/,
				use: [
					{
						loader: 'style-loader',
						options: {
							injectType: 'singletonStyleTag',
							attributes: {
								'data-cke': true
							}
						}
					},
					'css-loader',
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: styles.getPostCssConfig( {
								minify: true
							} )
						}
					}
				]
			}
		]
	}
};
