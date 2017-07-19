/**
 * LRT: Light Rapid Transit or a small fast Express
 */

'use strict';

class Lrt {
  constructor(options) {
    let self = this;
    this.routes = [];

    // Automatically handle back and forward buttons if true    
    if (options.handleBackButton) {
      if (typeof(window)==='object') {
        window.onpopstate = () => {
          if (location && location.pathname) {
            self.route(location.pathname, false);
          }
        }
      }
    }
  }

  use(route, cb) {
    let self = this;
    self.routes.push({
      route: route,
      cb: cb
    });
  }


  /**
   * 
   * 
   * @param {any} route 
   * @memberof Lrt
   */
  route(route, updateHistory = true) {
    let self = this;
    // Add a findable path for the homepage aliases of / and nothing
    if (route === '/' || route === '') {
      route = '/home';
    }
    // locationSegments is the current route being matched
    let locationSegments = route.split('/').slice(1);


    // Compares path and location returning true if they match along with any param values
    this.processPath = function (pathSegments, locationSegments, params) {
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

    let routeNotFound = true;

    for (let r = 0; r < self.routes.length; r++) {
      // pathSegments is the path array of routes table item being looped
      let pathSegments = self.routes[r].route.split('/').slice(1);

      if (pathSegments[0] === '*') {
        // This is a generic handler so don't bother with history, vpages, etc
        self.routes[r].cb.call(self.routes[r]);
      } else {
        let params = {};

        // Look for a match. If we are not already on that view (.html) then redirect to it
        if (self.processPath(pathSegments, locationSegments, params)) {
          routeNotFound = false;

          // Calculate the DOM id from the route template
          let id = self.routes[r].route.replace(/\//g, '').replace(/:/g, '--');

          // Hide any currently showing virtual pages and show the vpage based on the calculated DOM id
          [].map.call(document.querySelectorAll('.vpage'), function (e) { e.classList.remove('current') });
          document.querySelector('#' + id).classList.add('current');

          // Update the URL
          if (updateHistory) {
            history.pushState({ pathname: route }, null, route);
          }

          // Execute the callback to populate any templates
          self.routes[r].cb.call(self.routes[r], params);
        }
      }
    }

    if (routeNotFound) {
      console.warn('Route not found. 404 handling coming soon...');
    }
  }

  static microTemplate(templateSelector, data, target) {
    let squiggies = /{{\$(\$)?([0-9a-zA-Z_\-\.]*)}}/mig;
    let template = document.querySelector(templateSelector);
    if (target.classList.contains('rendered')) {
      // Remove all previous renderings
      target.innerHTML = '';
      target.classList.toggle('rendered');
    }

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
      target.appendChild(tmp.childNodes[0]);
    }
    else {
      let warn = 'This browser does not support template.content';
      console.warn(warn);
      target.innerHTML = `<p>${warn}</p>`;
    }
  }
}

// Export this class when executing this script under Mocha/NodeJS
(typeof (module) === 'object') ? module.exports = Lrt : null;
