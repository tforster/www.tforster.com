var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/test001");
BlogPostProvider = function () { };

var BlogPostTypes = {
   POST: 0, PHOTO: 1, TEXT: 2, VIDEO: 3, QUOTE: 4, AUDIO: 5, TWEET: 6, INSTAGRAM: 7, LINK: 8
}

var Schema = mongoose.Schema;
var BlogPost = new Schema({
   "type": { type: BlogPostTypes, required: false },
   "slug": { type: String, required: false },
   "date": { type: Date, required: false },
   "timestamp": { type: Number, required: false },
   "published": { type: Boolean, required: false },
   "description": { type: String, required: false },
   "tags": { type: [String], required: false },
   "category": { type: String, required: false },
   "attachments": { type: [String], required: false },
   "title": { type: String, required: false },
   "tumblrId": { type: Number, required: false }


   //"tumblr_url": { type:String, required: false},     // tumblr.post_url 
   //"slug": { type: String, required: false },         // tumblr.slug
   //"type": { type: String, required: true },          // tumblr.type: link, quote, text, audio, video, photo, tweet, instagram
   //"title": { type: String, required: false },        // tumblr.title - relates to type:link 
   //"date": { type: Date, required: false },           // tumblr.date
   //"timestamp": { type: Date, required: false },      // tumblr.timestamp
   //"state": { type: String, required: false },        // tumblr.state: "published"

   //"tags": { type: [String], required: false },       // tumblr.tags   
   //"url": { type: String, required: false },          // tumblr.url: "http://earthsky.org/space/asteroid-2012-da14-will-pass-very-close-to-earth-in-2013" - relates to type:link
   //"description": { type: String, required: false },  // tumblr.description
   //"text": { type: String, required: false },         // tumblr.text - relates to type:quote
   //"source": { type: String, required: false },       // tumblr.source - relates to type:quote
   //"source_url": { type: String, required: false },   // tumblr.source_url - relates to type:quote, video
   //"source_title": { type: String, required: false }, // tumblr.source_title - relates to type:quote, video
   //"caption": { type: String, required: false},       // tumblr.caption - relates to type:video
   //"category": { type: String, required: true }          // for import map to "blog_name"
})
BlogPostProvider.prototype.BlogPostModel = mongoose.model("BlogPost", BlogPost);






//getCollection
BlogPostProvider.prototype.getCollection = function (callback) {
   this.db.collection(databaseCollection, function (error, article_collection) {
      if (error) {
         callback(error);
      }
      else {
         callback(null, article_collection);
      }
   });
};


//findAll
BlogPostProvider.prototype.findAll = function (callback) {
   this.getCollection(function (error, article_collection) {
      if (error) {
         callback(error);
      }
      else {
         article_collection.find().toArray(function (error, results) {
            if (error) {
               callback(error);
            }
            else {
               callback(null, results);
            }
         });
      }
   });
};


BlogPostProvider.prototype.ResultToPost = function (result) {
   var post = {};
   post.id = result._id;
   post.slug = (undefined !== result.slug) ? result.slug : "";
   post.title = post.slug;
   post.description = result.description;
   post.date = result.date;
   post.published = result.state == "published";
   post.category = result.blog_name;
   post.type = result.type;
   post.tags = result.tags;
   post.attribution = "";

   switch (result.type) {
      case "link":
         post.title = (result.title !== undefined) ? result.title : "";
         post.content = "<a href=\"" + result.url + "\">" + result.url + "</a>";
         break;
      case "photo":
         post.description = result.caption;
         var photo = result.photos[0].original_size;
         post.content = "<a href=\"" + result.link_url + "\"><img src=\"" + photo.url + "\"/></a>";
         break;
      case "video":
         var video = result.player[result.player.length - 1];
         post.content = video.embed_code;
         post.description = result.caption;
         break;
      case "quote":
         post.content = "<blockquote><p>" + result.text + "</p><small>" + result.source + "</small></blockquote>";
         break;
      case "text":
         post.title = (result.title !== undefined) ? result.title : "";
         post.content = result.body;
         break;
      case "audio":
         break;
      default:
         break;
   }

   return post;
}

//findTop n order by date desc
BlogPostProvider.prototype.findTopN = function (n, callback) {
   this.getCollection(function (error, article_collection) {
      if (error) {
         callback(error);
      }
      else {
         article_collection.find().sort({ date: -1 }).limit(n).toArray(function (error, result) {
            if (error) {
               callback(error);
            }
            else {
               var posts = new Array();
               if (Array.isArray(result)) {
                  result.forEach(function (obj, i) {
                     posts.push(BlogPostProvider.prototype.ResultToPost(obj));
                  });
               }
               else {
                  posts.push(BlogPostProvider.prototype.ResultToPost(result));
               }
               callback(null, posts);
            }

         });
      }
   });
}


//findById
BlogPostProvider.prototype.findById = function (id, callback) {
   this.getCollection(function (error, article_collection) {
      if (error) {
         callback(error);
      }
      else {
         article_collection.findOne({ _id: article_collection.db.bson_serializer.ObjectID.createFromHexString(id) }, function (error, result) {
            if (error) {
               callback(error);
            }
            else {
               callback(null, result);
            }
         });
      }
   });
};

//save
BlogPostProvider.prototype.save = function (articles, callback) {
   this.getCollection(function (error, article_collection) {
      if (error) {
         callback(error);
      }
      else {
         if (typeof (articles.length) == "undefined") {
            articles = [articles];
         }
         for (var i = 0; i < articles.length; i++) {
            article = articles[i];
            article.created_at = new Date();
            if (article.comments === undefined) {
               article.comments = [];
            }
            for (var j = 0; j < article.comments.length; j++) {
               article.comments[j].created_at = new Date();
            }
         }

         article_collection.insert(articles, function () {
            callback(null, articles);
         });
      }
   });
};



BlogPostProvider.prototype.addCommentToArticle = function (articleId, comment, callback) {
   this.getCollection(function (error, article_collection) {
      if (error) {
         callback(error);
      }
      else {
         article_collection.update(
           { _id: article_collection.db.bson_serializer.ObjectID.createFromHexString(articleId) },
           { "$push": { comments: comment } },
           function (error, article) {
              if (error) {
                 callback(error);
              }
              else {
                 callback(null, article);
              }
           });
      }
   });
};

exports.BlogPostProvider = BlogPostProvider;