var fs = require("fs");
var path = require("path");

var configFileName = "cap-configs/" + process.argv[2] + "/capacitor.config.ts";
var sourceConfigFilePath = path.resolve(__dirname, configFileName);
var targetFilePath = path.resolve(__dirname, "capacitor.config.ts");

fs.writeFileSync(targetFilePath, fs.readFileSync(sourceConfigFilePath));
console.log("Using " + configFileName + " for Cap Configuration");
