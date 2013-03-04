var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/test001");
BlogPostProvider = function () { };

var BlogPostTypes = {
   POST: 0, PHOTO: 1, TEXT: 2, VIDEO: 3, QUOTE: 4, AUDIO: 5, TWEET: 6, INSTAGRAM: 7, LINK: 8
}

var Schema = mongoose.Schema;
var BlogPost = new Schema({
   "type": { type: BlogPostTypes, required: true },
   "slug": { type: String, required: false },
   "date": { type: Date, required: true },
   "published": { type: Boolean, required: true },
   "description": { type: String, required: false },
   "tags": { type: [String], required: false },
   "category": { type: String, required: true },
   "attachments": { type: [String], required: false },
   "title": { type: String, required: false }

})
BlogPostProvider.prototype.BlogPostModel = mongoose.model("BlogPost", BlogPost);




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

//Save
BlogPostProvider.prototype.Save = function (Post, Callback) {
   var p = Post;
   Post.save(function (err, Post) {
      if (err) {
         console.log("ERR:", err, p);
         Callback(err);
      } else {
         Callback(Post);
      }
   });
}


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