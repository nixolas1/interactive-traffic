const path = require("path")
const webpack = require("webpack")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const ThreeWebpackPlugin = require('@wildpeaks/three-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const outputFolder = __dirname + "/dist";


module.exports = (env, argv) => {
    const devMode = argv.mode === "development";

    let plugins = [
        new CleanWebpackPlugin([outputFolder]),
        new webpack.HashedModuleIdsPlugin(),
        new ThreeWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: "[name].[contenthash:6].bundle.css",
        }),
        new HtmlWebpackPlugin({
            template: './public/index.html',
            favicon: './public/favicon.png',
        }),
    ];

    if(!devMode) {
        plugins.push(new CopyWebpackPlugin([{ from: 'public', to: '.', ignore: ['index.html'] }], {}))
    }

    return {
        context: __dirname,
        entry: {
            app: "./src/index.js",
        },
        output: {
            path: outputFolder,
            publicPath: '/',
            filename: devMode ? "[name].bundle.js" : "[name].[hash:6].bundle.js",
        },
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    include: [
                        path.join(__dirname, 'src'),
                        path.join(__dirname, './node_modules/ky') // was not downcompiled
                    ],
                    use: {
                        loader: "babel-loader"
                    },
                },
                {
                    test: /\.(glsl|vert|frag)$/,
                    exclude: /node_modules/,
                    loader: 'shader-loader',
                },
                {
                    test: /\.scss$/,
                    exclude: /node_modules/,
                    use: [
                        devMode ? "style-loader" : MiniCssExtractPlugin.loader,
                        {
                            loader: "css-loader",
                            options: {
                                importLoaders: 2, // IMPORTANT! CHANGE ACCORDING TO NUMBER OF OTHER STYLE LOADERS
                                url: false,
                            },
                        },
                        {
                            loader: "postcss-loader",
                        },
                        {
                            loader: "fast-sass-loader",
                        }
                    ],
                },
            ],
        },

        resolve: {
            extensions: [".js", ".jsx"],
            modules: [path.resolve(__dirname, './src'), 'node_modules'],
        },

        plugins: plugins,

        devServer: {
            contentBase: "./public",
            historyApiFallback: true,
        },

        stats: {
            hash: false,
            version: false,
            timings: false,
            children: false,
            errors: true,
        },
    }
};


/*
{
    test: /\.svg$/,
    use: [
        {
            loader: "svg-sprite-loader",
            options: {
                extract: true,
                spriteFilename: "icons.bundle.svg",
            },
        },
        {
            loader: "svgo-loader",
        },
    ],
},*/
