/*
 * # blogs.js
 * 
 * Implements client side blog functionality
 * - - -
 */

tforster.blog = function () { }

/* ##prototype.serialize
 * 
 * Serializes the HTML form data to a JSON object
 * 
 * returns: Blog post object
 * 
 * parameters: none
 * - - - 
 */
tforster.blog.prototype.serialize = function () {
   var post = {
      _id: document.getElementById("_id").value,
      category: document.getElementById("category").value,
      title: document.getElementById("title").value,
      date: document.getElementById("date").value,
      tags: ((document.getElementById("tags").value.trim() !== "") ? document.getElementById("tags").value.split(",") : []),
      content: document.getElementById("content").value,
      permalink: document.getElementById("permalink").value,
      published: document.getElementById("published").checked
   }
   console.log("serialize", post);
   return post;
}

/* ##prototype.permalinkHandler
 * 
 * Simple handler to auto-suggest permalinks for new posts based on title
 * 
 * returns: Nothing. 
 * 
 * parameters: 
 * - - - 
 */
tforster.blog.prototype.permalinkHandler = function () {
   document.getElementById("permalink").value = document.getElementById("title").value.replace(/[^a-z0-9]+/gi, '-').replace(/^-*|-*$/g, '').toLowerCase();
}

/* ##prototype.deserialize
 * 
 * Deserializes a JSON post object to HTML form data
 * 
 * returns: Nothing. It updates the markup instead
 * 
 * parameters: 
 * - **post**: A blog post object
 * - - - 
 */
tforster.blog.prototype.deserialize = function (post) {
   post = post || {
      _id: null,
      category: 0,
      title: "New Post",         
      date: new Date(),
      tags: [],
      content: "",
      permalink: "",
      published: false
   }
   document.getElementById("_id").value = post._id;
 
   // Bind a simple permalink default function if a permalink has not been created yet; disable permalink for saved posts
   var titleElement = document.getElementById("title");   
   if (post._id === null) {
      titleElement.addEventListener("change", this.permalinkHandler, false);
      document.getElementById("permalink").disabled = false;
   }
   else {
      titleElement.removeEventListener("change", this.permalinkHandler, false);
      document.getElementById("permalink").disabled = true;
   }
      
   var selectedIndex = 0;
   for (var i = 0; i < document.getElementById("category").options.length; i++) {
      if (document.getElementById("category").options[i].value === post.category) {
         selectedIndex = i;
      }
   }
   document.getElementById("category").selectedIndex = selectedIndex;
   
   document.getElementById("title").value = post.title;
   document.getElementById("date").value = post.date;
   console.log(post.date);
   
   post.tags = (post.tags.length ? post.tags.join(",") : "");
   document.getElementById("tags").value = post.tags;
   
   document.getElementById("content").value = post.content;
   document.getElementById("permalink").value = post.permalink;
   document.getElementById("published").checked = post.published || false;
}


/* ##prototype.save
 * 
 * Saves existing and blog records. E.g. it encompasses inserts and udpates
 * 
 * returns: Nothing. But it does update the DOM
 * 
 * parameters: 
 * - **e**: The event that triggered the update. Should always be the save button
 * - - - 
 */
tforster.blog.prototype.update = function (e) {
   var self = tforster.blog.prototype;
   e.preventDefault();
   
   // Serialize whatever is in the current form
   console.log("todo: add basic field validation here");
   var post = self.serialize();
   
   tforster.xhr("post", "/api/blog", post, function (err, result) {
      if (!err) {
         // Was this an update or insert?
         if (post._id) {
            var rows = self.listView.getElementsByTagName("tr");
            
            // look for the row to update
            for (var r = 0; r < rows.length; r++) {
               if (result.post._id === JSON.parse(rows[r].dataset.post)._id) {
                  var tds = rows[r].getElementsByTagName("td");
                  tds[0].innerHTML = result.post.permalink;
                  tds[1].innerHTML = result.post.date;
                  tds[2].innerHTML = result.post.title;
                  tds[3].innerHTML = result.post.category;
                  tds[4].innerHTML = result.post.updated;
                  tds[5].getElementsByTagName("input")[0].checked = result.post.published;
                  
                  rows[r].dataset.post = JSON.stringify(result.post);
               }
            }
         }
         else {
            // It is an insert so append a blog row to the table
            self.listView.appendChild(new tforster.blog.prototype.listViewRow(result.post));
         }
      }
      else {
         console.error(err);
      }
   });
}


/* ##prototype.listViewRow
 * 
 * Creates a table row c/w delete button and bindings
 * 
 * returns: A tr DOM element
 * 
 * parameters: 
 * - **post**: The post from which to obtain the necessar data
 * - - - 
 */
tforster.blog.prototype.listViewRow = function (post) {
   var tr = document.createElement("tr");
   tr.dataset.post = JSON.stringify(post);
   tr.setAttribute("id", post._id);
   
   var td = document.createElement("td");
   td.innerHTML = post.permalink;
   tr.appendChild(td);
   
   td = document.createElement("td");
   td.innerHTML = post.date;
   tr.appendChild(td);
   
   td = document.createElement("td");
   td.innerHTML = post.title;
   tr.appendChild(td);
   
   td = document.createElement("td");
   td.innerHTML = post.category;
   tr.appendChild(td);
   
   td = document.createElement("td");
   td.innerHTML = post.updated;
   tr.appendChild(td);
   
   td = document.createElement("td");
   var input = document.createElement("input");
   input.type = "checkbox";
   input.checked = post.published;
   input.disabled = true;
   td.appendChild(input);
   tr.appendChild(td);
   
   // Add delete button functionality
   input = document.createElement("input");
   input.type = "button"; // Change from default behaviour of submit
   input.value = "delete";
   input.addEventListener("click", function (e) {
      e.preventDefault();
      var parentRow = e.target.parentNode.parentNode;
      var post = JSON.parse(parentRow.dataset.post);
      
      // Bind the click event to the wrapped call to the delete API      
      tforster.xhr("delete", "/api/blog/" + post._id, {}, function (err, data) {
         if (!err) {
            parentRow.parentNode.removeChild(parentRow);
         }
         else {
            console.error(err);
         }
      });
   });
   
   td = document.createElement("td");
   td.appendChild(input);
   tr.appendChild(td);
   
   // Bind row selection click
   tr.addEventListener("click", function (e) {
      if (event.target.type !== "button") {
         tforster.blog.prototype.deserialize(JSON.parse(e.target.parentNode.dataset.post));
      }
   });
   
   return tr;
}


/* ##prototype.init
 * 
 * Initialize the blogs module
 * 
 * returns: Nothing
 * 
 * parameters: 
 * - **posts**: An array of blog post objects
 * - **element**: The root element to target
 * - - - 
 */
tforster.blog.prototype.init = function (posts, element) {
   var self = this;
   
   // Only initialize if we see element
   if (element) {
      self.listView = {};
      
      // Create a simplified reference to the listview body
      tforster.blog.prototype.listView = document.querySelectorAll(element + " .listView")[0].getElementsByTagName("tbody")[0];
      
      // Create a simplified reference to the detail form
      tforster.blog.prototype.detailView = document.querySelectorAll(element + " .detailView")[0].getElementsByTagName("form")[0];
      
      // Bind the save button      
      document.querySelectorAll("input[data-action='save-form']")[0].addEventListener("click", tforster.blog.prototype.update);
      
      // Bind the new/clear button     
      document.querySelectorAll("button[data-action='clear-form']")[0].addEventListener("click", function () { tforster.blog.prototype.deserialize() }, false);
      
      // Populate the listview
      posts.forEach(function (post, i) {
         tforster.blog.prototype.listView.appendChild(tforster.blog.prototype.listViewRow(post));
      });
   }
}
document.addEventListener("DOMContentLoaded", function () {
   var blog = new tforster.blog();
   blog.init(tforster.blogPosts, ".blog-admin");
});
/* ##xhr
 * 
 * A generic XHR wrapper
 * 
 * returns: nothing
 * 
 * parameters: 
 * - **method**: GET, PUT, POST, DELETE
 * - **endpoint**: The relative URL to execute the request against. Not yet supporting CORS so it has to be same domain
 * - **data**: Data to pass to the server. If no data simply supply an empty {}
 * - **cb**: A callback method
 * - - - 
 */
tforster.xhr = function (method, endpoint, data, cb) {
   var request = new XMLHttpRequest();
   request.open(method, endpoint, true);
   request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
   request.send(JSON.stringify(data));
   request.onload = function () {
      if (request.status >= 200 && request.status < 400) {
         data = JSON.parse(request.responseText);
         if (data.success) {
            cb(null, data);
         }
         else {
            cb(new Error("XHR failed with ", data), null);
         }
      } 
      else {
         cb(new Error("XHR failed with ", request.status), null);
      }
   };
   
   request.onerror = function (err) {
      cb(err, null);
   };
}