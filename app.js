var express = require("express");
var http = require("http");
var mongoose = require("mongoose");
var url = require("url");
var Utils = require("./Utils").Utils;
var utils = new Utils();

mongoose.connect("mongodb://localhost/test001");
BlogPostModel = function () { };

//var BlogPostTypes = {
//   POST: 0, PHOTO: 1, TEXT: 2, VIDEO: 3, QUOTE: 4, AUDIO: 5, TWEET: 6, INSTAGRAM: 7, LINK: 8
//}

var Schema = mongoose.Schema;
var BlogPost = new Schema({
   "type": { type: String, required: true },
   "slug": { type: String, required: false },
   "date": { type: Date, required: true },
   "published": { type: Boolean, required: true },
   "description": { type: String, required: false },
   "tags": { type: [String], required: false },
   "category": { type: String, required: true },
   "attachments": { type: [String], required: false },
   "title": { type: String, required: false }
})
BlogPostModel = mongoose.model("BlogPost", BlogPost);


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


// Get an array of Posts with optional paging/filtering support
app.get("/Posts", function (req, res) {
   var url_parts = url.parse(req.url, true);
   var query = url_parts.query;

   var page = utils.exists(query.page, 20);           // Page size defaults to 20
   var offset = utils.exists(query.offset, 0);        // Offset starts at 0
   var dateOrder = utils.exists(query.order, -1);     // Default sort is by date descending (e.g. most recent first)
   var type = utils.exists(query.type, null);         //
   var category = utils.exists(query.category, "");   // Normally we return all categories unless a single category is specified
   var tags = utils.exists(query.tags, []);           // 

   var findObj = {};
   if (type) {
      findObj.type = type;
   }

   // To-do: Implement additional capabilities for tags and category. Use .where().equals and .where().in etc
   if (tags) { }
   if (category) { }

   BlogPostModel.find(findObj).limit(20).sort({ "date": dateOrder }).skip(offset * page).limit(page).exec(function (err, posts) {
      if (err) {
         return res.send('error', { status: 500 });
      }
      else {
         return res.send('allposts', { posts: posts });
      }
   });
});





// Get a single Post by id (where MongoDB Ids are assumed to be 24 character GUIDs but haven't been able to confirm)
app.get(/Posts\/([0-9a-fA-F]{24})/, function (req, res) {
   console.log("ID:", req.params);
   BlogPostModel.findOne({ "_id": req.params[0] }, function (err, Post) {
      if (err) {
         console.log(err);
         return res.send('error', { status: 500 });
      }
      else {
         return res.send('allposts', { Post: Post });
      }
   });
});


// Get a single Post by slug
app.get(/Posts\/([-\w\d]+)/, function (req, res) {
   console.log("Slug:", req.params);
   BlogPostModel.findOne({ "slug": req.params[0] }, function (err, Post) {
      if (err) {
         console.log(err);
         return res.send('error', { status: 500 });
      }
      else {
         return res.send('allposts', { Post: Post });
      }
   });
});







// To-do: Need some decent validation to confirm the received object is a BlogPostModel
// To-do: Need auth
app.post("/Posts", function (req, res) {
   var blogPost = new BlogPostModel(req.body);

   blogPost.save(function (err) {
      if (!err) {
         return console.log("created");
      } else {
         return console.log(err);
      }
   });
   return res.send("ok");
});


server.listen(3000);
console.log("Express server listening on port %d in %s mode", server.address().port, app.settings.env);