/*
 * Edit these variables to suit your environment
*/
var BlogPostProvider = require("./BlogPostProvider").BlogPostProvider;
var blogPostProvider = new BlogPostProvider();
var Utils = require("./Utils").Utils;
var utils = new Utils();


var blogs = ["tforster.tumblr.com", "digitalsmarts.tumblr.com", "techsmarts.tumblr.com"];
var apiKey = "Gd6OkMVTar81KSY76EUAoWrzN8UJbq4xyY2nonn82x7nsx5amV";
var databaseCollection = "posts";

var Posts = [];
var currentBlog = 0;
var start = new Date();

var fs = require("fs");

var obj = JSON.parse(fs.readFileSync("posts.json", "utf8"));
ProcessPosts(obj);

//CallAndLoad(0, blogs[0]);

function CallAndLoad(offset, blog, posts) {
   if (!posts) {
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
            if (json.response.posts.length === 0) {
               // Fetch the next blog
               if (currentBlog < blogs.length - 1) {
                  currentBlog++;
                  CallAndLoad(0, blogs[currentBlog]);
               }
               else {
                  fs.writeFileSync("posts.json", JSON.stringify(Posts), "utf8");
                  ProcessPosts(Posts);



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

}
function ProcessPosts(Posts) {
   Posts.forEach(function (post) {

      post.title = utils.exists(post.title, "");
      
      //"type": { type: BlogPostTypes, required: true },
      //"slug": { type: String, required: true },
      //"date": { type: Date, required: true },
      //"timestamp": { type: Number, required: true },
      //"published": { type: Boolean, required: true },
      //"description": { type: String, required: true },
      //"tags": { type: [String], required: false },
      //"category": { type: String, required: true },
      //"attachments": { type: [String], required: false },
      //"title": { type: String, required: true }
      
      post.link_url = (post.link_url || post.feed_item);
      if (post.link_url) {
         console.log(post.link_url);
         var instagram = post.link_url.match(/instagr\.am/ig);
         if (instagram !== null && instagram[0]) {
            post.type = "instagram";
         }

         
         var flickr = post.link_url.match(/www\.flickr\.com/ig);
         if (flickr !== null && flickr[0]) {
            post.type = "flickr";
         }
      }
      switch (post.type) {
         case "instagram":
            post.title = post.slug.replace(/-/g, " ");
            post.description = "<div class=\"post instagram\">" + post.caption.replace("(Taken with <a href=\"http://instagram.com\" target=\"_blank\">Instagram</a>)", "") + "<a href=\"" + post.link_url + "\"><img class=\"\" src=\"" + post.photos[0].original_size.url + "\"/></a></div>";
            post.attachments = new Array(post.link_url); // link to instagram
            break;

         case "flickr":
            post.title = post.slug.replace(/-/g, " ");

            // Looks like old flickr might have a different schema
            if (!post.link_url) {
               post.link_url = post.feed_item;
            }

            post.description = "<div class=\"post flickr\">" + post.caption + "<a href=\"" + post.link_url + "\"><img class=\"\" src=\"" + post.photos[0].original_size.url + "\"/></a></div>";
            post.attachments = new Array(post.link_url); // link to flickr
            break;

         case "link":
            post.description = utils.exists(post.description, "");
            post.attachments = [post.url];
            break;

         case "photo":
            post.title = post.slug.replace(/-/g, " ");
            post.description = utils.exists(post.caption, "");

            var via = post.title.indexOf(" via");
            if (via > -1) {
               post.title = post.title.substr(0, via);
            }

            var taken = post.title.indexOf(" taken with");
            if (taken > -1) {
               post.title = post.title.substr(0, taken);
            }

            var dsc = post.title.match(/dsc\w*/gi);
            if (dsc !== null && dsc[0]) {
               if (post.title.length === dsc[0].length) {
                  post.title = dsc[0];
                  description = ""; // override so we don't get just DSCN in our description
               }
               else {
                  post.title = post.title.replace(/dsc\w*/gi, "");
               }
            }

            

            post.description = "<div class=\"post photo\">" + post.description + "<a href=\"" + post.link_url + "\"><img src=\"" + post.photos[0].original_size.url + "\" /></a></div>";
            post.attachments = new Array(post.link_url);
            break;

         case "video":
            post.title = post.slug.replace(/-/g, " ");
            post.attachments = new Array(post.player[0].embed_code);
            post.description = "<div class=\"post video\">" + utils.exists(post.caption, "") + post.player[0].embed_code + "</div>";
            
            break;

         case "text":
            post.title = post.slug.replace(/-/g, " ");
            post.description = "<div class=\"post description\">" + utils.exists(post.body, "") + "</div>";
            post.attachements = [];
            break;

         case "quote":
            post.title = post.slug.replace(/-/g, " ");
            post.attachments = new Array(utils.exists(post.source_url, "no source"));
            post.description = post.text;
            break;

         case "audio":
            break;
         default:
            break;
      }

      post.slug = utils.Sluggify(post.title);

      post.published = (post.state === "published");
      post.tags = post.tags;
      post.category = post.blog_name;

      var blogPost = new blogPostProvider.BlogPostModel({
         type: post.type,
         title: post.title,
         slug: post.slug,
         date: post.date,
         published: post.published,
         description: post.description,
         tags: post.tags,
         category: post.category,
         attachments: post.attachments,
         tumblrId: utils.exists(post.id, "tumblrId missing")
      });
      //console.log(blogPost);
      blogPostProvider.Save(blogPost, function (result) {
         if (!result) {
            console.log("Error:", result);
         }
         else {
            //console.log(result);

         }
      });

      //blogPost.blogPostProvider.save();
      //blogPost.save(function (err) {
      //   if (!err) {
      //      //console.log("added");
      //   } else {
      //      console.log("Error (", post.id, "): ", err);
      //   }
      //});
   });
}

