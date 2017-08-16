const join = require('path').join;
const resolve = require('path').resolve;
const webpack = require('webpack');
const OpenBrowserPlugin = require('open-browser-webpack-plugin');

const PATHS = {
	src: join(__dirname, 'src'),
	build: join(__dirname, 'build')
};

module.exports = {
	entry: {
		src: './src/index.js'
	},
	output: {
		path: __dirname,
		filename: './build/bundle.js'
	},
	module: {
		loaders: [
			{
				test: /\.scss$/,
				loaders: ['style-loader', 'css-loader', 'sass-loader'],
				include: PATHS.src,
			},
			{
				test: /\.(jpe?g|gif|png)$/,
     			loader: 'file-loader?emitFile=false&name=[path][name].[ext]'
    		},
    		{
				test: /\.js$/,
				loaders: ['babel-loader'],
				include: PATHS.src,
				exclude: /node_modules/
			},
			{
				test: /\.(eot|svg|ttf|woff|woff2)$/,
				loader: 'file-loader?name=public/fonts/[name].[ext]'
			}
		]
	},
	devServer: {
		inline: true,

		// display only errors to reduce the amount of output
		stats: 'errors-only',

		// parse host and port from env so this is easy
		// to customize
		host: '0.0.0.0',
		port: '3000',
		watchOptions: {
			aggregateTimeout: 300,
			poll: true
		}
	},
	plugins: [
		new OpenBrowserPlugin({ url: 'http://localhost:3000/'}),
	]
};
