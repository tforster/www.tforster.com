/*
 * Edit these variables to suit your environment
*/
var express = require("express");
var http = require("http");
var BlogPostProvider = require("BlogPostProvider").BlogPostProvider;
var blogPostProvider = new BlogPostProvider();

var blogs = ["tforster.tumblr.com"];// , "digitalsmarts.tumblr.com", "techsmarts.tumblr.com"];
var apiKey = "Gd6OkMVTar81KSY76EUAoWrzN8UJbq4xyY2nonn82x7nsx5amV";
var databaseName = "node-blog";
var databaseHost = "localhost";
var databasePort = 27017;
var databaseCollection = "posts";

var Posts = new Array();
var currentBlog = 0;
var start = new Date();

CallAndLoad(0, blogs[0]);

function CallAndLoad(offset, blog) {
   console.log("blog:", blog);
   var fs = require("fs");
   var http = require("http");

   var options = {
      host: "api.tumblr.com",
      path: "/v2/blog/" + blog + "/posts/?api_key=" + apiKey + "&offset=" + offset,
      method: "GET",
      headers: { "Content-Type": "application/json" }
   }

   var req = http.request(options, function (response) {
      var data = "";

      response.setEncoding("utf8");
      response.on("data", function (chunk) {
         data += chunk;
      });

      response.on("end", function () {
         var json = JSON.parse(data);
         if (json.response.posts.length == 0) {
            // Fetch the next blog
            if (currentBlog < blogs.length - 1) {
               currentBlog++;
               CallAndLoad(0, blogs[currentBlog]);
            }
            else {
               // We've got all the blogs and posts, time to sort by date. This was done when I was saving to disk only and had not added MongoDB support
               //function compare(a, b) {
               //   if (a.date > b.date)
               //      return -1;
               //   if (a.date < b.date)
               //      return 1;
               //   return 0;
               //}
               //Posts.sort(compare);

               //fs.writeFileSync("posts.json", JSON.stringify(Posts), "utf8");
               //console.log("Imported, merged, sorted and wrote to disk " + Posts.length + " posts from " + blogs.length + " blogs in " + ((new Date() - start) / 1000).toString() + " seconds.");
               //var retval = InsertIntoMongo(Posts);
               Posts.forEach(function (post) {
                  console.log(post.id, post.tags, post.title == undefined, post.title === null, typeof (post.title));
                  if (typeof (post.title) === "undefined") {
                     post.title = "x";
                  }

                  var blogPost;
                  switch (post.type) {
                     case "link":
                        post.attachments = new Array(post.url);
                        if (post.description == "") {
                           post.description = post.title;
                        }
                        break;
                     case "photo":
                        post.attachments = new Array(post.photos[0].original_size.url);
                        post.description = post.caption;
                        break;
                     case "video":
                        post.attachments = new Array(post.player[0].embed_code);
                        post.description = post.caption;
                        break;
                     case "text":
                        post.description = post.body;
                        break;
                     case "quote":
                        post.attachments = new Array(post.source_url);
                        post.description = post.text;
                        break;
                     case "audio":
                        break;
                     default:
                        break;

                  }

                  if(typeof(post.title)==="undefined" || post.title==null){
                     post.title = "x";
                  }
                  

                  blogPost = new blogPostProvider.BlogPostModel({
                     title: post.title,
                     type: post.type,
                     slug: post.slug,
                     date: post.date,
                     timestamp: post.timestamp,
                     published: (post.state === "published"),
                     tags: post.tags,
                     description: post.description,
                     category: post.blog_name,
                     attachments: post.attachments,
                     tumblrId: post.id

                  });
                  blogPost.save(function (err) {
                     if (!err) {
                        //console.log("added");
                     } else {
                        console.log("Error (", post.id, "): ", err);
                     }
                  });
               });


            }
         }
         else {
            // Get the individual posts from the response object and stuff into our global Posts array
            for (var j = 0; j < json.response.posts.length; j++) {
               Posts.push(json.response.posts[j]);
            }
            offset += json.response.posts.length;
            // Fetch more posts
            CallAndLoad(offset, blog);
         }
      });

   });

   req.on("error", function (e) {
      console.log("Got error: " + e.message);
   });

   req.end();
}


function InsertIntoMongo(posts) {
   var mongodb = require("mongodb").Db;
   var Server = require('mongodb').Server;

   var db = new mongodb(databaseName, new Server(databaseHost, databasePort, { auto_reconnect: false, poolSize: 4 }), { w: 0, native_parser: false });

   db.open(function (err, db) {
      if (err) {
         console.log(err.message);
      }
      db.collection(databaseCollection, function (err, collection) {
         collection.insert(posts, { w: 1 }, function (err, result) { });
      });
      db.close();
      console.log("Created database, collection and imported " + posts.length + " posts in " + ((new Date() - start) / 1000).toString() + " seconds.");
   });

   return true;
}