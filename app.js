"strict mode"

var express = require("express")
   , http = require("http")
   , path = require('path')
   , url = require("url")
   , Poet = require("poet")
   , tumblr = require("tumblr.js");

var settings = {}
   , port = parseInt(3000)
   , app = express();

var poet = Poet(app, {
   posts: './_posts/',
   postsPerPage: 5,
   metaFormat: 'json'
});


poet.addRoute('/blog/:post', function (req, res, next) {
   var post = poet.helpers.getPost(req.params.post);
   if (post) {
      // Do some fancy logging here
      res.render('post', { post: post });
   } else {
      res.send(404);
   }
}).init();

poet.watch(function () {
   // watcher reloaded
}).init().then(function () {
   // Ready to go!
});

app.get('/rss', function (req, res) {
   // Only get the latest posts
   var posts = poet.helpers.getPosts(0, 5);
   res.setHeader('Content-Type', 'application/rss+xml');
   res.render('rss', { posts: posts });
});


/** tumblr
*/
var client = tumblr.createClient({

});

var pageData = {};
pageData.tumblr = { };

client.posts('techsmarts.tumblr.com', { limit: 3 }, function (err, data) {
   pageData.tumblr.techsmarts = data;
});

client.posts('digitalsmarts.tumblr.com', { limit: 3 }, function (err, data) {
   pageData.tumblr.digitalsmarts = data;
});


poet.init().then(function () {
   // ready to go!
});

app.configure(function () {
   app.set('port', port);

   app.use(express.favicon());
   app.use(express.logger('dev'));
   app.use(express.bodyParser());
   app.use(express.methodOverride());
   app.set('view engine', 'jade');
   app.set('views', __dirname + '/views');
   app.use(app.router);
   app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
   app.use(express.errorHandler());
});


app.get('/', function (req, res) {
   res.render('index', {
      pageData:pageData
   }
)
});

//app.get("/api/v1/films", films.getTopNFilms);
//app.get("/api/v1/films/:username([a-z]+)", films.getFilmsByUserName);
//app.get("/api/v1/films/:id([a-fA-F0-9]{24})", films.getFilmById);
//app.post("/api/v1/films/", films.saveFilm);

http.createServer(app).listen(app.get('port'), function () {
   console.log("Express server listening on port " + app.get('port'));
});