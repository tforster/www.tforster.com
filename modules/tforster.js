var path = require("path"), basePath = path.dirname(require.main.filename);
var url = require("url"),
   Twitter = require("twitter-js-client").Twitter,
   tumblr = require("tumblr.js"),
   movesApi = require("moves-api").MovesApi,
   cronJob = require("cron").CronJob,
   http = require("http"),
   https = require("https");


tforster = function (options) {
   var thisModule = this;
   this.options = options;

   this.pageData = {
      tumblr: {},
      twitter: {},
      moves: {},
      blog: {},
      instagram: {}
   }

   this.init = function (options) {
      this.options = options;
      FetchTwitter();
      FetchTumblr();
      FetchPosts();
      //FetchMoves();
      FetchProjects();
      FetchInstagram();

      new cronJob("*/15 * * * *", function () {
         FetchTwitter();
         FetchTumblr();
         FetchPosts();
         FetchProjects();
         FetchInstagram();
      }, null, true);

      // Poll Moves at 2am every day. Moves say they update at midnight, 2 hours earlier.
      //new cronJob("0 2 * * *", function () {
      //   FetchMoves();
      //}, null, true);
   }


   function FetchInstagram() {
      thisModule.pageData.instagram.posts = [];

      var options = {
         hostname: "api.instagram.com",
         port: 443,
         path: "/v1/users/" + thisModule.options.instagramCreds.userId + "/media/recent/?client_id=" + thisModule.options.instagramCreds.clientId,
         method: "GET"
      };
      var data = "";
      var req = https.request(options, function (res) {
         res.on("data", function (d) {
            data += d;
         });

         res.on("end", function () {
            thisModule.pageData.instagram.posts = JSON.parse(data).data.slice(0, 2);
            console.log("instagram: loaded");
         });
      });
      req.end();

      req.on("error", function (err) {
         console.error("instagram: error", err);
      });
   }
   
   // Blog
   function FetchPosts() {
      thisModule.pageData.blog.posts = [];
      var options = {
         host: thisModule.options.blogUrl,
         port: 80,
         path: "/json",
         method: "GET"
      };

      var body = "";
      var req = http.request(options, function (resp) {

         resp.on("data", function (data) {
            body += data;
         });

         resp.on("error", function (e) {
            console.error("Got error: " + e.message);
         });

         resp.on("end", function () {
            thisModule.pageData.blog.posts = JSON.parse(body).posts;
            console.log("posts: loaded");
         });
      });
      req.on("error", function (err) {
         console.error("posts: error", err);
      });
      req.end();
   }


   function FetchProjects() {
      thisModule.pageData.blog.projects = []
      var options = {
         host: thisModule.options.blogUrl,
         port: 80,
         path: "/json/random",
         method: "GET"
      };

      var body = "";
      var req = http.request(options, function (resp) {

         resp.on("data", function (data) {
            body += data;
         });

         resp.on("error", function (e) {
            console.error("Got error: " + e.message);
         });

         resp.on("end", function () {
            thisModule.pageData.blog.projects = JSON.parse(body).posts;
            console.log("projects: loaded");
         });
      });
      req.on("error", function (err) {
         console.error("projects: error", err);
      });
      req.end();
   }


   function FetchTwitter() {
      var twitter = new Twitter(thisModule.options.twitterCreds);
      var params = { screen_name: "tforster", count: "3" };
      twitter.getUserTimeline(params, function (err) {
         if (err) {
            console.error("twitter: error", err);
         }
      }, function (data) {
         thisModule.pageData.twitter = data;
         console.log("twitter: loaded");
      });
   }


   function FetchTumblr() {
      var client = tumblr.createClient(thisModule.options.tumblrCreds);
      client.posts("techsmarts.tumblr.com", { limit: 3 }, function (err, data) {
         if (err) {
            console.error("techsmarts: error", err);
            data = {
               posts: []
            };
         }
         thisModule.pageData.tumblr.techsmarts = data;
         console.log("techsmarts: loaded");
      });

      client.posts("digitalsmarts.tumblr.com", { limit: 3 }, function (err, data) {
         if (err) {
            console.error("digitalsmarts: error", err);
            data = {
               posts: []
            }
         }
         thisModule.pageData.tumblr.digitalsmarts = data;
         console.log("digitalsmarts: loaded");
      });
   }


   
   this.GetMovesAccessToken = function(code) {
      var moves = new movesApi(thisModule.options.movesCreds);
      if (code === undefined) {
         var url = moves.generateAuthUrl(["activity", "location"]);
         console.log("Moves: You need to reauthenticate Moves API:\n\n" + url + "\n\n");         
      }
      else {
         moves.getAccessToken(code, function (err, accessToken) {
            if (err) {
               console.error("Moves: Error (token receipt)", err);
            }
            else {
               console.log("accessToken: ", accessToken);
               moves.options.accessToken = accessToken;
               var nconf = require("nconf");
               nconf.file({file: path.join(basePath, "config.secure.json")});
               nconf.set("movesCreds:accessToken", accessToken);
               nconf.save();

               moves.getProfile(function (err, profile) {
                  FetchMoves();
               });
            }
         });
      }
   }

   
   function FetchMoves() {
      var moves = new movesApi(thisModule.options.movesCreds);
      var startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate = startDate.getFullYear() + "" + (("0" + parseInt(startDate.getMonth() + 1).toString()).substr(0)) + startDate.getDate()
      var endDate = new Date();
      endDate.setDate(endDate.getDate() - 1);
      endDate = endDate.getFullYear() + "" + (("0" + parseInt(endDate.getMonth() + 1).toString()).substr(0)) + endDate.getDate()

      moves.getProfile(function (err, profile) {
         if (err) {
            thisModule.GetMovesAccessToken();
         }
         else { 
            moves.getStoryline({ from: startDate, to: endDate, trackPoints: false }, function (err, data) {
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
                  thisModule.pageData.moves = physicalActivities;
                  console.log("moves: loaded");
               }
               else {
                  console.error("moves: error", err)
               }
            });   
         }
      });

      
   }

}

module.exports = new tforster();