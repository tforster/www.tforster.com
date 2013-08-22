var fs = require("fs");
var cssFile = "c:/github/tforster.com/public/css/twitter.css";
var controlFile = "c:/github/tforster.com/public/css/css-rules.txt";
var outFile = "c:/github/tforster.com/public/css/twitter2.css";
var controlArray = []


main();

function main() {
   var cssData = ReadFile(cssFile);
   var controlDataArray = ReadFile(controlFile).toString().split("\r\n");
   controlDataArray.forEach(function (line, index) {
      controlDataArray[index] += " {";
   });
   
   cssData.toString().split("\n").forEach(function (cssLine) {
      cssLine = trim(cssLine);
      //console.log("CSS: ", cssLine);
      var hit = controlDataArray.some(function (controlLine) {
         return (cssLine.indexOf(controlLine) > -1);        
      });
      if (  !hit) {
         console.log(cssLine, "\n");
         fs.appendFileSync(outFile, cssLine.toString() + "\n");
      }
   //   console.log(line);
   });
}


function trim(string) {
   return string.replace(/^\s+|\s+$/g, '');
}


function ReadFile(filename) {
   return fs.readFileSync(filename)
}