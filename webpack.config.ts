import webpack from 'webpack'

export default {
    devtool: "inline-source-map",
    entry: "./src/main.ts",
    target: 'node',
    mode: 'production',
    output: {
        filename: "main.js"
    },
    resolve: {
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: [".ts", ".tsx", ".js"]
    },
    module: {
        rules: [
            // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
            { test: /\.tsx?$/, loader: "ts-loader" }
        ]
    }
} as webpack.Configuration