var path = require("path"), basePath = path.dirname(require.main.filename);

var express = require("express");
var router = express.Router();
var tforster = require(path.join(basePath, "/modules/tforster.js"));

byDefault = function (req, res) {
   res.render("index", {
      pageData: tforster.pageData
   })
}

router.get("/", byDefault);

module.exports = router;