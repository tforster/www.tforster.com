"strict mode"

var express = require("express")
   , http = require("http")
   , path = require("path")
   , url = require("url")
   , Poet = require("poet")
   , Config = require("./config.json")
   , Twitter = require("twitter-js-client").Twitter
   , tumblr = require("tumblr.js")
   , movesApi = require("moves-api").MovesApi
   , cronJob = require("cron").CronJob;

var settings = {}
   , port = parseInt(3000)
   , app = express();

var pageData = {};
pageData.tumblr = {};
pageData.twitter = {};
pageData.moves = {};

var poet = Poet(app, {
   posts: "./_posts/",
   postsPerPage: 5,
   metaFormat: "json"
});


// Update Twitter, Tumblr and Moves asap
FetchTwitter();
FetchTumblr();
FetchMoves();


// Poll Twitter and Tumblr every 5 minutes
new cronJob("15 * * * * *", function () {
   FetchTwitter();
   FetchTumblr();
}, null, true, "America/Toronto");


// Poll Moves at approximately 2am every day. Moves say they update at midnight, 2 hours earlier.
new cronJob("59 1 * * * *", function () {
   FetchMoves();
}, null, true, "America/Toronto");


poet.addRoute("/blog/:post", function (req, res, next) {
   var post = poet.helpers.getPost(req.params.post);
   if (post) {
      // Do some fancy logging here
      res.render("post", { post: post });
   } else {
      res.send(404);
   }
}).init();


poet.watch(function () {
   console.log("poet watcher reloaded");
}).init().then(function () {
   console.log("poet watcher initialized");
});


app.get("/rss", function (req, res) {
   // Only get the latest posts
   var posts = poet.helpers.getPosts(0, 5);
   res.setHeader("Content-Type", "application/rss+xml");
   res.render("rss", { posts: posts });
});


/** twitter
*/
function FetchTwitter() {
   var twitter = new Twitter(Config.twitterCreds);
   var params = { screen_name: "tforster", count: "3" };
   twitter.getUserTimeline(params, function (err) {
      if (err) {
         console.log(err);
      }
   }, function (data) {
      pageData.twitter = data;
      console.log("Loaded: twitter");
   });

   //twitter.getMentionsTimeline();
   //twitter.getHomeTimeline();
   //twitter.getReTweetsOfMe();
   //twitter.getTweet();
}


function FetchTumblr() {
   var client = tumblr.createClient(Config.tumblrCreds);
   client.posts("techsmarts.tumblr.com", { limit: 3 }, function (err, data) {
      if (err) {
         console.log("techsmarts error: ", err);
         data = {
            posts: []
         };
      }
      pageData.tumblr.techsmarts = data;
      console.log("Loaded: techsmarts.tumblr.com");
   });

   client.posts("digitalsmarts.tumblr.com", { limit: 3 }, function (err, data) {
      if (err) {
         console.log("digitalsmarts error: ", err);
         data = {
            posts: []
         }
      }
      pageData.tumblr.digitalsmarts = data;
      console.log("Loaded: digitalsmarts.tumblr.com");
   });
}


//GetMovesAccessToken();
function GetMovesAccessToken(code_from_redirect) {
   var moves = new movesApi(Config.movesCreds);
   if (code_from_redirect === undefined) {
      var url = moves.generateAuthUrl();
      console.log("movesurl: ", url);
   }
   else {
      moves.getAccessToken(code_from_redirect, function (err, accessToken) {
         if (err) {
            console.log("moves err: ", err);
         }
         else {
            console.log("accessToken: ", accessToken);
            moves.options.accessToken = accessToken;
            moves.getProfile(function (err, profile) {
               console.log("profile:", profile);
            });
         }
      });
   }
}


function FetchMoves() {
   var moves = new movesApi(Config.movesCreds);

   moves.getProfile(function (err, profile) {
      if (err) {
         console.log("moves err: ", err);
      }
      console.log("profile:", profile);
   });

   moves.getStoryline({ from: "20130818", to: "20130824", trackPoints: false }, function (err, data) {
      var physicalActivities = {
         walking: {
            distance: 0,
            time: 0,
            calories: 0
         },
         cycling: {
            distance: 0,
            time: 0,
            calories: 0
         },
         running: {
            distance: 0,
            time: 0,
            calories: 0
         }
      }
      if (!err) {
         data.forEach(function (movesDay, index) {
            movesDay.segments.forEach(function (segment, index) {
               //console.log(movesDay);
               if (segment.activities) {
                  segment.activities.forEach(function (activity, index) {
                     switch (activity.activity) {
                        case "wlk":
                           physicalActivities.walking.distance += parseInt(activity.distance);
                           physicalActivities.walking.time += parseInt(activity.duration);
                           physicalActivities.walking.calories += parseInt(activity.calories);
                           break;
                        case "cyc":
                           physicalActivities.cycling.distance += parseInt(activity.distance);
                           physicalActivities.cycling.time += parseInt(activity.duration);
                           physicalActivities.cycling.calories += parseInt(activity.calories);
                           break;
                        case "run":
                           physicalActivities.running.distance += parseInt(activity.distance);
                           physicalActivities.running.time += parseInt(activity.duration);
                           physicalActivities.running.calories += parseInt(activity.calories);
                           break;
                        case "trp":
                           break;
                        default:
                     }
                  });
               }
            });
         });
         pageData.moves = physicalActivities;
         console.log("Loaded: Moves");
      }
      else {
         console.log("moves err: ", err)
      }
   });
}


/** poet
*/
poet.init().then(function () {
   console.log("poet initialized");
});


app.configure(function () {
   if (Config.port) {
      app.set("port", parseInt(Config.port));
   }
   app.use(express.favicon());
   app.use(express.logger("dev"));
   app.use(express.bodyParser());
   app.use(express.methodOverride());
   app.set("view engine", "jade");
   app.set("views", __dirname + "/views");
   app.use(app.router);
   app.use(express.static(path.join(__dirname, "public")));
});


app.get("/", function (req, res) {
   res.render("index", {
      pageData: pageData
   })
});


http.createServer(app).listen(app.get("port"), function () {
   console.log("Express server listening on port " + app.get("port"));
});