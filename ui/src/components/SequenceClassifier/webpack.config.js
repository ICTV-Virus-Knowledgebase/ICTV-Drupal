
const path = require("path");
const tsLoader = require("ts-loader");

module.exports = {
   mode: "production",
   target: "web",
   entry: {
      "ICTV_SequenceClassifier": [
         path.resolve(__dirname, "./") + "/index.ts"
      ]
   },
   externals: {
      datatables: "datatables.net-dt",
      jquery: 'jQuery'
   },
   module: {
      rules: [
         // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
         {
            test: /\.tsx?$/,
            use: "ts-loader",
            exclude: /node_modules/
         }
      ]
   },
   resolve: {
      extensions: [".ts", ".tsx", ".d.ts", ".js"]
   },

   output: {
      path: path.resolve(__dirname, "../../../dist"),
      filename: "[name].js",
      library: "[name]",
      libraryTarget: "global"
   }
}