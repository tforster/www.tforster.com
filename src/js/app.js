'use strict'

var config = {
  contentful: {
    accessToken: 'ebfa99618c6da4ae410dd709ec1b7b9c515cbf0cae711b3f78cb67dbea029b61',
    space: 'xyov37w0wvhz'
  }
}

// window.onpopstate = function (e) {
//   if (e.state) {
//     document.getElementById("content").innerHTML = e.state.html;
//     document.title = e.state.pageTitle;
//   }
// };

/**
 * CONSTRUCTOR
 * 
 * @param {object} config 
 */
function Tforster(config) {
  var self = this;
  self.config = config;
  self.routes = [];

  self.use('/', '/index.html', function () {

  });

  self.use('/portfolio', '/portfolio.html', function () {
    var contentType = 'product';
    // minifier does not like template literals
    //var url = `https://cdn.contentful.com/spaces/${config.contentful.space}/entries?access_token=${config.contentful.accessToken}&content_type=${contentType}&include=2`;
    var url = 'https://cdn.contentful.com/spaces/' + config.contentful.space + '/entries?access_token=' + config.contentful.accessToken + '&content_type=' + contentType + '&include=2';
    var request = new Request(url, {
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    });

    fetch(request)
      .then(function (response) {
        return response.json();
      })

      .then(function (data) {
        data.items.forEach(function (product) {
          document.querySelector('#thumbViewPortfolio').appendChild(self.microTemplate('#productThumbnail', product.fields));
        });
      })
  });


  self.use('/portfolio/:id', '/portfolio-product.html', function () {
  });


  self.use('/portfolio-product', '/portfolio-product.html', function (params) {
    var contentType = 'product';
    history.replaceState({}, null, '/portfolio/' + params.id);
    var url = 'https://cdn.contentful.com/spaces/' + config.contentful.space + '/entries?access_token=' + config.contentful.accessToken + '&content_type=' + contentType + '&include=2';
    var request = new Request(url, {
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    });

    fetch(request)
      .then(function (response) {
        return response.json();
      })

      .then(function (data) {
        var products = data.items.filter(function (obj) {
          return obj.fields.slug == params.id;
        });
        if (products) {
          var product = products[0];
          document.querySelector('#product').appendChild(self.microTemplate('#productTemplate', product.fields));
        } else {
          console.error(params.id, 'not found');
        }

      });

  });


  self.use('/hire-me', '/hire-me.html', function () {
  });


  self.use('/404', '/404.html', function () {
  });


  // // Add "selected" class to correct nav item
  // self.toggleNav();

  self.route(window.location);
}

/**
 * Pushes a new route method onto the routes array
 * 
 */
Tforster.prototype.use = function (path, view, cb) {
  this.routes.push({
    path: path,
    view: view,
    cb: cb
  });
}

/**
 * The router for both virual and physical pages
 * 
 */
Tforster.prototype.route = function (windowLocation) {
  var self = this;

  var location = windowLocation.pathname.replace('.html', '');
  var locationSegments = location.split('/').slice(1);
  var routes = this.routes;
  var params = {};
  if (window.location.hash) {
    params = JSON.parse(window.location.hash.replace('#!/', ''));
  }

  // Compares path and location returning true if they match along with any param values
  var processPath = function (pathSegments, locationSegments, params) {
    if (pathSegments.length !== locationSegments.length) {
      return false;
    }

    for (var l = 0; l < pathSegments.length; l++) {
      var isParam = pathSegments[l].match(/^:([\w-]+)/);

      if (!isParam && (pathSegments[l] != locationSegments[l])) {
        return false;
      }
      else {
        if (isParam) {
          params[isParam[1]] = locationSegments[l];
        }
      }
    }
    return true;
  }

  // Iterate the routes looking for a match
  for (var r = 0; r < routes.length; r++) {
    var xparams = params || {}
    var pathSegments = routes[r].path.split('/').slice(1);

    // Look for a match. If we are not already on that view (.html) then redirect to it
    if (processPath(pathSegments, locationSegments, xparams)) {
      var viewMeta = document.querySelector('meta[name="view"]');
      if (viewMeta && viewMeta.content !== routes[r].view) {
        // Load the named view
        window.location.href = routes[r].view + '#!/' + JSON.stringify(xparams);
      } else {
        // In the named view so start processing view specific Javascript
        history.replaceState({}, null, location);
        routes[r].cb.call(routes[r], xparams);
        self.globalBindings();
      }
    }
  }
  //window.location.href = '/404.html';
}


Tforster.prototype.globalBindings = function () {

  // Micro-interaction: menu bar when scrolling
  window.addEventListener('scroll', function () {
    var navbar = document.getElementById("myNavbar");
    // if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
    //   navbar.className = "w3-bar" + " w3-card-2" + " w3-animate-top" + " w3-white";
    // } else {
    //   navbar.className = navbar.className.replace(" w3-card-2 w3-animate-top w3-white", "");
    // }
  });

  // Toggle dropdown from hamburger icon
  document.querySelector('.w3-top i.fa-bars').addEventListener('click', function () {
    document.querySelector('#hamburgerMenu').classList.toggle('w3-show');
  });

  // Micro-interaction: hide hamburger menu on menu click before navigating away
  document.querySelectorAll('#hamburgerMenu a').forEach(function (a, i) {
    a.addEventListener('click', function () {
      document.querySelector('#hamburgerMenu').classList.remove('w3-show');
    });
  });
}


/**
 * TOGGLENAV
 * - Toggles the current-menu-item class to indicate which is the selected navigation item
 * 
 */
Tforster.prototype.toggleNav = function () {
  var bodyClassList = document.querySelector('body').classList;
  if (bodyClassList.length > 0) {
    var bodyClass = bodyClassList[0];
    document.querySelector('.pi-mega-fw a[href="' + bodyClass + '.html"]').parentNode.classList.add('current-menu-item');
  }
}






// var tforster = function () { };
// MICROTEMPLATE: Simple template system that parses {{$some-var}}. Use $$ to force processng of markdown.
Tforster.prototype.microTemplate = function (templateSelector, data) {
  var squiggies = /{{\$(\$)?([0-9a-zA-Z_\-\.]*)}}/mig;
  var template = document.querySelector(templateSelector);
  var clone;

  if (template.content) {
    // Returns a #document-fragment containing a NodeList of typically [text, div.row.section, text]
    clone = document.importNode(template.content, true);
  }
  else {
    // IE does not support template.content so we have to manually build it
    clone = document.createElement('div');
    clone.innerHTML = template.innerHTML;
  }

  var index = function (obj, i) { return obj[i] };

  for (var c = 0; c < clone.childNodes.length; c++) {
    var child = clone.childNodes[c];
    if (child.innerHTML) {
      child.innerHTML = child.innerHTML.replace(squiggies, function (match, $1, $2, offset, original) {
        if ($2) {
          var content = $2.split('.').reduce(index, data);
          if ($1 && content) {
            content = marked(content);
          }
          return content ? content : '';
        }
        else {
          return original;
        }
      });
    }
    clone.childNodes[c] = child;
  }


  return clone;
}


  // // POPULATEBIOS: Populates the #bios div on the about page
  // tforster.populateBios = function () {
  //   var bios = document.querySelector('#bios');
  //   tforster.contentfulClient.getEntries({ content_type: 'bio', order: 'fields.orderBy' })
  //     .then(function (bioEntries) {
  //       bioEntries.items.forEach(function (bio) {
  //         bios.appendChild(tforster.microTemplate('#bio', bio.fields));
  //       });
  //     });
  // }




  // // VIDEOCONTROLS: Adds play/pause via click/tap to our simple video elements
  // tforster.videoControls = function () {
  //   document.querySelectorAll('video').forEach(function (video) {
  //     console.log(video);
  //     video.addEventListener('click', function (e) {
  //       if (e.target.paused) {
  //         e.target.play();
  //       }
  //       else {
  //         e.target.pause();
  //       }
  //     });
  //   });
  // };

  ;
(function () {
  if (document.readyState != 'loading') {
    new Tforster(config);
  } else {
    document.addEventListener('DOMContentLoaded', function () { new Tforster(config) });
  }
}());
