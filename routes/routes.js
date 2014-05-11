var path = require("path"), basePath = path.dirname(require.main.filename);

var express = require("express");
var router = express.Router();
var tforster = require(path.join(basePath, "/modules/tforster.js"));

byDefault = function (req, res) {
   res.render("index", {
      pageData: tforster.pageData
   })
}

updateMoves = function (req, res) {
   var code = req.query.code;
   console.log(code);
   tforster.GetMovesAccessToken(code);
   res.json("{'moves':" + code + "}");
}

router.get("/", byDefault);
router.get("/moves/auth", updateMoves);

module.exports = router;