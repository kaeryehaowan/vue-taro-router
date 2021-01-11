
const path = require('path');

module.exports = {
    entry: path.resolve(__dirname,'src','index.js'),
    output: {
        filename: 'bundle.js',
        libraryTarget: "umd"
    },
    module: {
        rules: [
            { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" },
        ],
        // unknownContextCritical: false,
    },
    resolve: {
        modules: [ "node_modules","src" ],
        extensions: [ '.js',  '.json']
    },
    // mode: 'development'
    mode: 'production'
};
