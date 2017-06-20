'use strict'

const config = {
  contentful: {
    accessToken: 'ebfa99618c6da4ae410dd709ec1b7b9c515cbf0cae711b3f78cb67dbea029b61',
    space: 'xyov37w0wvhz'
  }
}

let app;


/**
 * CONSTRUCTOR
 * 
 * @param {object} config 
 */
function Tforster(config) {
  let self = this;
  self.config = config;
  self.routes = [];

  self.use('/', '/index.html', function () { });
  self.use('/portfolio', '/portfolio.html', renderPortfolio);
  self.use('/portfolio/:id', '/portfolio-product.html', function () { });
  self.use('/portfolio-product', '/portfolio-product.html', renderPortfolioItem);
  self.use('/hire-me', '/hire-me.html', function () { });
  self.use('/404', '/404.html', function () { });

  self.route(window.location);
}


/**
 * USE
 * - Pushes a new route method onto the routes array
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
 * Placeholder method for in-page search that will be implemented in the future
 */
Tforster.prototype.search = function () {
  console.warn('search() not implemented yet.');
}

/**
 * ROUTE
 * - The router for both virual and physical pages
 * 
 */
Tforster.prototype.route = function (windowLocation) {
  let self = this;

  let location = windowLocation.pathname.replace('.html', '');
  let locationSegments = location.split('/').slice(1);
  let routes = this.routes;
  let params = {};
  if (window.location.hash) {
    params = JSON.parse(window.location.hash.replace('#!/', ''));
  }

  // Compares path and location returning true if they match along with any param values
  let processPath = function (pathSegments, locationSegments, params) {
    if (pathSegments.length !== locationSegments.length) {
      return false;
    }

    for (let l = 0; l < pathSegments.length; l++) {
      let isParam = pathSegments[l].match(/^:([\w-]+)/);

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
  for (let r = 0; r < routes.length; r++) {
    let xparams = params || {}
    let pathSegments = routes[r].path.split('/').slice(1);

    // Look for a match. If we are not already on that view (.html) then redirect to it
    if (processPath(pathSegments, locationSegments, xparams)) {
      let viewMeta = document.querySelector('meta[name="view"]');
      if (viewMeta && viewMeta.content !== routes[r].view) {
        // Load the named view
        if (Object.keys(xparams).length === 0 && xparams.constructor === Object) {
          window.location = routes[r].view;
        } else {
          window.location = routes[r].view + '#!/' + JSON.stringify(xparams);
        }
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


/**
 * GLOBALBINDINGS
 * - Some bindings common to all pages
 * 
 */
Tforster.prototype.globalBindings = function () {
  // Toggle dropdown from hamburger icon
  document.querySelector('.w3-top i.fa-bars').addEventListener('click', function () {
    document.querySelector('#hamburgerMenu').classList.toggle('w3-show');
  });

  // Micro-interaction: hide hamburger menu on menu click before navigating away
  document.querySelectorAll('#hamburgerMenu a').forEach(function (a) {
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
  let bodyClassList = document.querySelector('body').classList;
  if (bodyClassList.length > 0) {
    let bodyClass = bodyClassList[0];
    document.querySelector('.pi-mega-fw a[href="' + bodyClass + '.html"]').parentNode.classList.add('current-menu-item');
  }
}


/**
 * MICROTEMPLATE
 * - Simple template system that parses {{$some-var}}. Use $$ to force processng of markdown.
 * 
 */
Tforster.prototype.microTemplate = function (templateSelector, data) {
  let squiggies = /{{\$(\$)?([0-9a-zA-Z_\-\.]*)}}/mig;
  let template = document.querySelector(templateSelector);

  if (template.content) {
    let s = template.content.querySelector('*').outerHTML;
    s = s.replace(squiggies, function (match, $1, $2, offset, original) {
      if ($2) {
        let content = $2.split('.').reduce(function (obj, i) { return obj[i] || '' }, data);
        if ($1 && content) {
          content = marked(content);
        }
        return content ? content : '';
      }
      else {
        return original;
      }
    });

    let tmp = document.createElement('div');
    tmp.innerHTML = s;
    return tmp.childNodes[0];
  }
  else {
    console.warn('This browser does not support template.content');
    return document.createElement('div').innerHTML = '<p>template.content is not supported</p>';
  }
}

let renderPortfolio = () => {

  const contentType = 'product';
  const url = `https://cdn.contentful.com/spaces/${config.contentful.space}/entries?access_token=${config.contentful.accessToken}&content_type=${contentType}&include=0`;
  const request = new Request(url, {
    headers: new Headers({
      'Content-Type': 'application/json'
    })
  });

  fetch(request)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      data.items.forEach((product) => {
        document.querySelector('#thumbViewPortfolio').appendChild(app.microTemplate('#productThumbnail', product.fields));
      });
    })
}

let renderPortfolioItem = (params) => {
  const contentType = 'product';
  history.replaceState({}, null, '/portfolio/' + params.id);
  const url = 'https://cdn.contentful.com/spaces/' + config.contentful.space + '/entries?access_token=' + config.contentful.accessToken + '&content_type=' + contentType + '&fields.slug=' + params.id + '&include=10';

  const request = new Request(url, {
    headers: new Headers({
      'Content-Type': 'application/json'
    })
  });

  fetch(request)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      normalizeLinkedItems(data);
      document.querySelector('#product').appendChild(app.microTemplate('#productTemplate', data.items[0].fields));
    });
}


  ;
(function () {
  if (document.readyState != 'loading') {
    app = new Tforster(config);
  } else {
    document.addEventListener('DOMContentLoaded', function () { app = new Tforster(config) });
  }
}());

let normalizeLinkedItems = (obj) => {
  obj.items.forEach((item) => {
    let f = item.fields;
    for (let p in f) {
      if (typeof (f[p]) === 'object' && f[p].sys) {
        let o = obj.includes.Entry.filter((e) => {
          return e.sys.id === f[p].sys.id;
        });
        if (o) {
          f[p] = o[0];
        }
      }
    }
  })
}

