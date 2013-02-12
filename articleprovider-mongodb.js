var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

var databaseName = "node-blog";
var databaseHost = "localhost";
var databasePort = 27017;
var databaseCollection = "posts";


ArticleProvider = function (host, port) {
   this.db = new Db(databaseName, new Server(host, port, { auto_reconnect: true }, {}));
   this.db.open(function () { });
};


//getCollection
ArticleProvider.prototype.getCollection = function (callback) {
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
ArticleProvider.prototype.findAll = function (callback) {
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


ArticleProvider.prototype.ResultToPost = function (result) {
   var post = {};
   post.id = result._id;
   post.title = result.slug;
   post.slug = result.slug;
   post.description = result.description;
   post.date = result.date;
   post.published = result.state == "published";
   post.category = result.blog_name;
   post.type = result.type;
   post.tags = result.tags;
   post.attribution = "";

   switch (result.type) {
      case "link":
         post.title = result.title;
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
         post.title = result.title;
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
ArticleProvider.prototype.findTopN = function (n, callback) {
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
                     posts.push(ArticleProvider.prototype.ResultToPost(obj));
                  });
               }
               else {
                  posts.push(ArticleProvider.prototype.ResultToPost(result));
               }
               callback(null, posts);
            }

         });
      }
   });
}


//findById
ArticleProvider.prototype.findById = function (id, callback) {
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
ArticleProvider.prototype.save = function (articles, callback) {
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



ArticleProvider.prototype.addCommentToArticle = function (articleId, comment, callback) {
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

exports.ArticleProvider = ArticleProvider;