'use strict';

/* Following functions are loaded from other scripts in index.html: */
/* global marked Contentful Lrt:true */

const config = {
  contentful: {
    accessToken: 'ebfa99618c6da4ae410dd709ec1b7b9c515cbf0cae711b3f78cb67dbea029b61',
    space: 'xyov37w0wvhz'
  }
};

let app;

// Contentful is the lightweight client for accessing Contentful CaaS API
let contentful = new Contentful(config.contentful);

/**
 * Main application wrapper class
 * - Makes it easier to group and execute initialization code and better to read
 * 
 * @class App
 */
class App {
  constructor() {
    this.lrt = new Lrt({
      handleBackButton: true
    });

    // Edge doesn't support NodeList.prototype.forEach so we don't feel bad about extending its prototype
    if (!NodeList.prototype.forEach) {
      NodeList.prototype.forEach = Array.prototype.forEach;
    }

    // Configure routes and handlers
    let lrt = this.lrt;
    lrt.use('/home', function () { });
    lrt.use('/hire-me', renderHireMe);
    lrt.use('/portfolio', renderPortfolio);
    lrt.use('/portfolio/:id', renderPortfolioItem);
    lrt.use('/uses', renderUses);
    lrt.use('/*', toggleNav)

    // globalBindings needs a reference to the instance of App and this is the constructor so pass 'this'
    globalBindings(this);

    // Route whatever the (deep) link is that we have started on
    lrt.route(window.location.pathname);
  }
}

/**
 * DOM bindings common to the entire app (mostly nav stuff)
 * 
 * @param {App} instance 
 */
let globalBindings = (instance) => {
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

  // Wire up the nav
  [].map.call(document.querySelectorAll('.w3-bar-item[href^="/"]'), a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      instance.lrt.route(e.target.pathname);
    });
  });
}

/**
 * Passed to Lrt which calls it on each route to ensure the correct nav is highlighted
 * Todo: use Express concept of route(*) to add a second route to do this
 */
let toggleNav = () => {
  // Add a findable path for the homepage aliases of / and nothing
  let topLevelPath = '/' + window.location.pathname.split('/').slice(1)[0];
  if (topLevelPath === '/home') {
    topLevelPath = '/';
  }

  document.querySelectorAll('#myNavbar a, #hamburgerMenu a').forEach(a => {
    a.classList.remove('w3-gray');
  });

  // Add new
  document.querySelectorAll(`#myNavbar a[href="${topLevelPath}"], #hamburgerMenu a[href="${topLevelPath}"]`).forEach(a => {
    a.classList.add('w3-gray');
  });
}

let renderUses = () => {
  contentful.getEntries('textBlock', { page: 'uses', id: 'main' }, 0)
    .then(data => {
      document.querySelector('#usesContentAnchor').innerHTML = marked(data.items[0].fields.content);
    });
}

let renderHireMe = () => {
  let el;
  contentful.getEntries('textBlock', { page: 'hire-me' }, 0)
    .then(data => {
      /**
       * Expecting two entries: bodyContent and taglist
       * Taglist gets added to #taglist while bodyContent is appended to the 
       * parent of taglist, therefore appearing after taglist. Taglist needs to
       * be separated so it can get different CSS treatment than other ULs
       */
      data.items.forEach(item => {
        switch (item.fields.id) {
          case 'taglist':
            el = document.createElement('div');
            el.innerHTML = marked(item.fields.content); // <div><ul><li>... </ul></div>
            document.getElementById('taglist').innerHTML = el.querySelector('ul').innerHTML;
            break;

          case 'bodyContent':
            el = document.createElement('div');
            el.innerHTML = marked(item.fields.content);
            document.getElementById('bodyContent').appendChild(el);
            break;

          default:
            console.warn(`Unexpected item ${item.fields.id}`);
        }
      });
    });
}

/**
 * Render a list of portfolio thumbnails
 */
let renderPortfolio = () => {
  let target = document.querySelector('#thumbViewPortfolio');

  contentful.getEntries('product', {}, 0)
    .then(data => {    
      data.items.forEach(product => {
        Lrt.microTemplate('#productThumbnail', product.fields, target);
      });
      target.classList.add('rendered');

      // Wire thumbnail clicks to the router
      [].map.call(document.querySelectorAll('#thumbViewPortfolio .w3-card-2'), div => {
        div.addEventListener('click', e => {
          e.preventDefault();
          app.lrt.route(e.currentTarget.querySelector('a').pathname);
        });
      });
    });
}

/**
 * Render an individual portfolio product 
 * 
 * @param {*} params 
 */
let renderPortfolioItem = (params) => {
  contentful.getEntry('product', { slug: params.id }, 10)
    .then(data => {

      let target = document.querySelector('#product');

      Lrt.microTemplate('#productTemplate', data.fields, target);
      target.classList.add('rendered');
    });
}


/**
 * Document Ready without jQuery, etc
 */
(function () {
  // Test for document so we can also use app.js with Mocha/NodeJS
  if (typeof (document) === 'object') {
    if (document.readyState != 'loading') {
      app = new App();
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        app = new App();
      });
    }
  }
}());

// Export this class when executing this script under Mocha/NodeJS
(typeof (module) === 'object') ? module.exports = app : null;
