var express = require("express");
var http = require("http");
var BlogPostProvider = require("./BlogPostProvider").BlogPostProvider;
var app = express();
var server = http.createServer(app);

app.configure(function () {
   app.use(express.bodyParser());
   app.use(express.methodOverride());
   app.use(app.router);
   app.use(express.static(__dirname + "/public"));
});

app.configure("development", function () {
   app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure("production", function () {
   app.use(express.errorHandler());
});

var blogPostProvider = new BlogPostProvider();


app.post("/api/products", function (req, res) {
   var blogPost;
   console.log("POST: ");
   console.log(req.body);
   blogPost = new blogPostProvider.BlogPostModel({
      title: "My Title",
      description: "My Description",
      type: "link"
   });
   blogPost.save(function (err) {
      if (!err) {
         return console.log("created");
      } else {
         return console.log(err);
      }
   });
   return res.send(blogPost);
});

app.get("/api/products", function (req, res) {
   // to-do: auto-parse for topN, sort dir, etc
   return blogPostProvider.BlogPostModel.find(function (err, BlogPost) {
      if (!err) {
         return res.send(BlogPost);
      } else {
         return console.log(err);
      }
   });
});


//app.get("/", function (req, res) {
//   articleProvider.findTopN(5, function (error, posts) {

//      res.render("index.jade", {
//         session: true,
//         meta: {},
//         title: "Blog",
//         posts: posts
//      });
//   })
//});




//app.get("/blog/", function (req, res) {

//   articleProvider.findTopN(125, function (error, posts) {

//      res.render("blog_list.jade", {
//         session: true,
//         meta: {},
//         title: "Blog",
//         posts: posts
//      });
//   })
//});








//app.get("/blog/new", function (req, res) {
//   res.render("blog_new.jade", {

//      title: "New Post"

//   });
//});


//app.post("/blog/new", function (req, res) {
//   articleProvider.save({
//      title: req.param("title"),
//      body: req.param("body")
//   }, function (error, docs) {
//      res.redirect("/")
//   });
//});


//app.get("/blog/:id", function (req, res) {
//   articleProvider.findById(req.params.id, function (error, article) {
//      res.render("blog_show.jade", {
//         session: {},
//         meta: {},
//         title: article.title,
//         article: article
//      });
//   });
//});



//app.post("/blog/addComment", function (req, res) {
//   articleProvider.addCommentToArticle(req.param("_id"), {
//      person: req.param("person"),
//      comment: req.param("comment"),
//      created_at: new Date()
//   }, function (error, docs) {
//      res.redirect("/blog/" + req.param("_id"))
//   });
//});


server.listen(3000);
console.log("Express server listening on port %d in %s mode", server.address().port, app.settings.env);