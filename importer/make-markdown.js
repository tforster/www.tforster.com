var fs = require("fs");
//console.log(ReadJSONData("./tumblr.json"));
var tumblrPosts = JSON.parse(fs.readFileSync("./importer/tumblr.json", "utf8"));

/*
 Title: Configure node-blog
 Date: 2012-02-07 20:24:14
 Tags: Configuration, Blog
 Category: Configuration
 Sources:
   About node-blog: http://semu.mp/node-blog.html
   node-blog at GitHub: http://github.com/semu/node-blog
*/


tumblrPosts.forEach(function (post) {
   var type = StripReturns(post.type);
   var category = StripReturns(post.blog_name);
   
   var date = StripReturns(post.date);
   var tags = post.tags.join(",");
   var source = "";
   var slug = StripReturns(post.slug);
   var state = StripReturns(post.published);
   var format = StripReturns(post.format);
   var sourceUrl = post.source_url;
   var title = StripReturns(post.title);
   var text = StripReturns(post.text);
   var description = post.description;
   var url = post.url;
   var body = post.body;

   // description cleanup
   description = regexConvert(description);

   // Map the different Tumblr types to our blog output
   switch (type) {
      case "text":
         
         break;
      case "photo":
         body = "photo";
         break;
      case "quote":
         body = "quote";
         break;
      case "link":
         body = description + "\n" + "External Link: [" + url + "](" + url + ")";         
         break;
      case "chat":
         body = "chat";
         break;
      case "audio":
         body = "audio";
         break;
      case "video":
         body = "video";
         break;
      default:

   }
   




   var newPost = "/*\n Title: " + title + "\n Date: " + date + "\n Tags: " + tags + "\n Category: " + category + "\n Sources: \n*/\n" + body;
   fs.writeFileSync("./markdown/" + post.id + "-" + post.slug + ".md", newPost, "utf8");
});


function StripReturns(s) {
   
   if (s != null) {
      return s.replace(/[\n\r]/g, '');
   }
   else {
      return "";
   }
}

function WriteMarkDownFile(filecontents, filename) {
   fs.writeFile(filename, filecontents, function (err) {
      if (err) throw err;
      console.log('It\'s saved!');
   });

}

function regexConvert(input) {
   if ((input == "") || (typeof input === "undefined")) {
      return "";
   }
   console.log("s", s, "s");
   var converted = '';
   var s = input;
   var pat = /\s*(?:<(code)>|<(\?)php)([\s\S]+?)(?:<\/\1>|^\2>)\s*/mi; //[\s\S] = dotall; ? = non-greedy match
   //var pat = /\s*(?:<(code)>)([\s\S]+?)(?:<\/\1>)\s*/mi; //[\s\S] = dotall; ? = non-greedy match
   for (var i; (i = s.search(pat)) !== -1;) {
      //converted += mdConvert(s.substring(0, i));
      var m = s.match(pat)[0];
      var PRETTY_PRINT = true;
      switch (PRETTY_PRINT) {
         case 1:
            converted += m.replace(/^\s*<code>\s*$/gim, '\n\n~~~~ {.prettycode .lang-js}')
            .replace(/^\s*<\/code>\s*$/gim, '~~~~\n\n')
            .replace(/<\/?code>/gim, '`')
            .replace(/^<\?php/im, '\n<?php').replace(/^\?>/im, '?>\n');
            break;
         case 2:
            converted += m.replace(/^\s*<code>\s*/gim, '\n\n<div class="prettyprint">\n<code>')
            .replace(/^\s*<\/code>/gim, '</code>\n</div>\n\n')
            .replace(/^<\?php/im, '\n<?php').replace(/^\?>/im, '?>\n');
            break;
         case 0:
         default:
            converted += '\n\n' + m + '\n\n';
      }
      s = s.substring(i + m.length);
   }
   //converted += mdConvert(s);

   //if (WRAP_GLOBAL_DIV) converted = '<div markdown="1">\n' + converted + '\n</div>';

   return converted;
}