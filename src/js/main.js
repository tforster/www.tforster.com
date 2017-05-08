'use strict'

var config = {
  contentful: {
    accessToken: 'ebfa99618c6da4ae410dd709ec1b7b9c515cbf0cae711b3f78cb67dbea029b61',
    space: 'xyov37w0wvhz'
  }
}

/**
 * CONSTRUCTOR
 * 
 * @param {object} config 
 */
function Tforster(config) {
  var self = this;
  self.config = config;

  // Create and initialize the contentful client found in contentful.js loaded before this script
  self.contentfulClient = contentful.createClient({
    accessToken: self.config.contentful.accessToken,
    space: self.config.contentful.space
  });


  // Add "selected" class to correct nav item
  self.toggleNav();

  // Bind all non-page-specific bindings
  self.globalBindings();

  /**
   * Configure static routes and page-specific bindings
   */
  self.route('/', function () {
    // Nothing for home page right now
  });

  self.route('/portfolio.html', function () {
    // Bind modal dialog click events
    document.querySelectorAll('#portfolio img').forEach(function (img, i) {
      img.addEventListener('click', function () {
        document.getElementById("img01").src = img.src;
        document.getElementById("modal01").style.display = "block";
        var captionText = document.getElementById("caption");
        captionText.innerHTML = img.alt;
      });
    });

    document.querySelector('#modal01').addEventListener('click', function () {
      this.style.display = 'none';
    });

    var thumbs = document.querySelector('#thumbViewPortfolio');
    self.contentfulClient.getEntries({ content_type: 'product' })
      .then(function (productEntries) {
        productEntries.items.forEach(function (product) {
          console.log(product);
          thumbs.appendChild(tforster.microTemplate('#productThumbnail', product.fields));
        });
      });



  });

  // Call the appropriate controller for the current route
  self.routes[location.pathname].call();
}

Tforster.prototype.globalBindings = function () {

  // Micro-interaction: menu bar when scrolling
  window.addEventListener('scroll', function () {
    var navbar = document.getElementById("myNavbar");
    if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
      navbar.className = "w3-bar" + " w3-card-2" + " w3-animate-top" + " w3-white";
    } else {
      navbar.className = navbar.className.replace(" w3-card-2 w3-animate-top w3-white", "");
    }
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

/**
 * Crude and simple router to execute page/view specific Javascript
 */
Tforster.prototype.route = function (route, cb) {
  var self = this;
  self.routes = self.routes || {};
  self.routes[route] = cb;
}




var tforster = function () { };
// MICROTEMPLATE: Simple template system that parses {{$some-var}}. Use $$ to force processng of markdown.
tforster.microTemplate = function (templateSelector, data) {
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


// POPULATEBIOS: Populates the #bios div on the about page
tforster.populateBios = function () {
  var bios = document.querySelector('#bios');
  tforster.contentfulClient.getEntries({ content_type: 'bio', order: 'fields.orderBy' })
    .then(function (bioEntries) {
      bioEntries.items.forEach(function (bio) {
        bios.appendChild(tforster.microTemplate('#bio', bio.fields));
      });
    });
}




// VIDEOCONTROLS: Adds play/pause via click/tap to our simple video elements
tforster.videoControls = function () {
  document.querySelectorAll('video').forEach(function (video) {
    console.log(video);
    video.addEventListener('click', function (e) {
      if (e.target.paused) {
        e.target.play();
      }
      else {
        e.target.pause();
      }
    });
  });
};










(function () {
  if (document.readyState != 'loading') {
    new Tforster(config);
  } else {
    document.addEventListener('DOMContentLoaded', function () { new Tforster(config) });
  }
}());
