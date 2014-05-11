"strict mode"
var path = require("path");
var basePath = path.dirname(require.main.filename);
var express = require("express"),
   nconf = require("nconf"),
   http = require("http"),
   ejs = require("ejs");
   

   // Get options from config.json and command line
nconf.file({
   file: path.join(basePath, "config.json")
}).file("errors", {
   file: path.join(basePath, "config.secure.json")
}).file("secure", {
   file: path.join(basePath, "config.errors.json")
}).argv();
var options = nconf.get();

var tforster = require(path.join(basePath, "/modules/tforster.js"));
tforster.init(options);

routes = require("./routes/routes.js");

// Express setup 
var app = express();
app.set("views", basePath + "/views");
app.engine(".html", require("ejs").__express);
//app.engine(".jade", require("jade").__express);
app.set("view options", { layout: false });
app.set("view engine", "html");
//app.set("view engine", "jade");
app.use(express.static(path.join(basePath, options.directories.static)));

app.use("/", routes);

// 404 route
//app.use(function (req, res, next) {
//   var err = new Error("Not Found");
//   err.status = 404;
//   next(err);
//});

// development error handler will print stacktrace
//if (options.debug) {
//   app.use(function (err, req, res, next) {
//      res.status(err.status || 500);
//      res.render("error", {
//         message: err.message,
//         error: err
//      });
//   });
//}

// production error handler, no stacktraces leaked to user
//app.use(function (err, req, res, next) {
//   res.status(err.status || 500);
//   res.render("error", {
//      message: err.message,
//      error: {}
//   });
//});

http.createServer(app).listen(options.port, function () {
   console.log("%s is listening on port %s", options.name, options.port);
});