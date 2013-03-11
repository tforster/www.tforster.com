var express = require("express");
var http = require("http");
var MongoStore = require("connect-mongo")(express);
var mongoose = require("mongoose");
var url = require("url");
var Utils = require("./Utils").Utils;

var settings = {};
var utils = new Utils();
var currentUser = {};

var authom = require("authom");

authom.createServer({
   service: "google",
   id: "700990748489.apps.googleusercontent.com",
   secret: "a2K6jInOv6FWNdamRA_5ywFp",
   scope: ""
});

authom.createServer({
   service: "twitter",
   id: "LwjCfHAugMghuYtHLS9Ugw",
   secret: "etam3XHqDSDPceyHti6tRQGoywiISY0vZWfzhQUxGL4"
});

authom.createServer({
   service: "github",
   id: "7af1f396ab0b18268e69",
   secret: "dc0173618ba1b54ad5a54df917699ac2eee6ccef"
});

mongoose.connect("mongodb://localhost/test001");

BlogPostModel = function () { };
UserModel = function () { };
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


var User = new Schema({
   "primaryEmail": { type: String },
   "userName": { type: String },
   "githubId": { type: Number },
   "roles": { type: [String] }
});
UserModel = mongoose.model("User", User);

var app = express();
var server = http.createServer(app);

app.configure("development", function () {
   settings.db = { db: mongoose.connections[0].db }
   settings.session_secret = "076ee61d63aa10a125ea872411e433b9";
   app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure("production", function () {
   app.use(express.errorHandler());
});
app.configure(function () {
   app.use(express.bodyParser());
   app.use(express.methodOverride());
   app.use(express.cookieParser());
   app.use(express.session({
      secret: settings.session_secret,
      expires: new Date(Date.now() + 3600000),
      maxAge: new Date(Date.now() + 3600000),
      store: new MongoStore(settings.db
      )
   }));
   
   app.use(app.router);

   app.use(express.static(__dirname + "/public"));
});





function requireRole(role) {
   return function (req, res, next) {

      if (req.session.user && req.session.user.role === role)
         next();
      else
         res.send(403);
   }
}


authom.on("auth", function (req, res, data) {
   console.log("auth:", data);
   if (data.service === "github") {
      var currentUser = UserModel.find({ "githubId": data.id }, function (d) {
         if (d === null && data.data.login === "tforster") {
            // Autocreate my account and remove this in production
            var user = new UserModel();
            user.primaryEmail = "troy.forster@gmail.com";
            user.userName = "tforster";
            user.githubId = data.id;
            user.roles.push("administrator");
            user.save();

            var sess = new Object();
            sess.sessionId = socket.id;
            sess.userId = data.userId;
            sess.username = data.username;
            sess.role = data.role;
            sessionMgm.add(sess);
         }
      });

   }
   res.send(
   "<html>" +
     "<body>" +
       "<div style='font: 300% sans-serif'>You are " + data.id + " on " + data.service + ".</div>" +
       "<pre><code>" + JSON.stringify(data, null, 2) + "</code></pre>" +
     "</body>" +
   "</html>"
 )
})

authom.on("error", function (req, res, data) {
   console.log("error:", data);
   // called when an error occurs during authentication
})

app.get("/auth/:service", authom.app)




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


app.get(/Auth2/, function (req, res, data) {
   console.log("authed");
   res.send(
"<html>" +
  "<body>" +
    "<div style='font: 300% sans-serif'>You are " + data.id + " on " + data.service + ".</div>" +
    "<pre><code>" + JSON.stringify(data, null, 2) + "</code></pre>" +
  "</body>" +
"</html>"
)
});


// Get a single Post by id (where MongoDB Ids are assumed to be 24 character GUIDs but haven't been able to confirm)
app.get(/Posts\/([0-9a-fA-F]{24})/, requireRole("admin"), function (req, res) {
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