const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin"); // Delete old files
const TerserPlugin = require("terser-webpack-plugin"); // JS minify
const autoprefixer = require("autoprefixer");
const MiniCSSExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("css-minimizer-webpack-plugin");

const isProduction = process.env.NODE_ENV === "production";

const mmdConfig = {
	mode: isProduction ? "production" : "development",
	entry: {
		"user-check": "./src/frontend/user-check.js",
		"user-check.min": "./src/frontend/user-check.js",
		frontend: "./src/frontend/frontend.js",
		"frontend.min": "./src/frontend/frontend.js",
		settings: "./src/settings.js",
		"settings.min": "./src/settings.js",
		admin: "./src/backend/admin/admin.js",
		"admin.min": "./src/backend/admin/admin.js",
		dashboard: "./src/backend/admin/dashboard.js",
		"dashboard.min": "./src/backend/admin/dashboard.js",
		// "post-type": "./src/backend/admin/post-type.js",
		// "post-type.min": "./src/backend/admin/post-type.js",
		// "post-type-list": "./src/backend/admin/post-type-list.js",
		// "post-type-list.min": "./src/backend/admin/post-type-list.js",
		mmd: "./src/frontend/mmd.js",
		"mmd.min": "./src/frontend/mmd.js",
		"user-account": "./src/frontend/user-account.js",
		"user-account.min": "./src/frontend/user-account.js",
		editor: "./src/backend/editor/editor.js",
		"editor.min": "./src/backend/editor/editor.js",
	},
	output: {
		filename: "[name].js", // Uses the name of the file
		path: path.resolve(__dirname, "dist"),
	},
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin({
				// include: /(\.min)\.(js|css)$/,
				exclude: /(?<!\.min)\.(js|css)$/,
				extractComments: false,
			}),
			new OptimizeCSSAssetsPlugin({
				exclude: /(?<!\.min)\.css$/,
			}),
		],
	},
	plugins: [
		new MiniCSSExtractPlugin({
			filename: "[name].css",
		}),
	],
	devtool: isProduction ? false : "cheap-module-source-map", // https://webpack.js.org/configuration/devtool/
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: "babel-loader",
					options: {
						presets: ["@babel/preset-env", "@babel/preset-react"],
					},
				},
			},
			{
				test: /\.css$/,
				use: [
					// "style-loader",
					MiniCSSExtractPlugin.loader,
					"css-loader",
					{
						loader: "postcss-loader",
						options: {
							postcssOptions: {
								plugins: [
									autoprefixer({ overrideBrowserslist: ["last 2 versions"] }),
								],
							},
						},
					},
				],
			},
		],
	},
};

module.exports = [{ ...mmdConfig }];
