'use strict';

class Contentful {
  constructor(config) {
    this.space = config.space;
    this.accessToken = config.accessToken;

    // Returns a Promise
    this.query = (contentType, included = 0, query, denormalize = true, raw = false) => {
      let self = this;
      let url = `https://cdn.contentful.com/spaces/${self.space}/entries?access_token=${self.accessToken}&content_type=${contentType}&include=${included}`;

      // Add any additional query field params
      if (query) {
        for (let f in query) {
          url = url + `&fields.${f}=${query[f]}`
        }
      }

      const request = new Request(url, {
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      });

      return fetch(request)
        .then((response) => {
          return response.json();
        })
        .then(data => {
          if (denormalize && data.includes && !raw) {
            self.denormalizeLinkedItems(data);
            // Since we have denormalized we no longer require the separate includes property
            delete data.includes;
          }
          return Promise.resolve(data);
        })
    }


    /**
     * Deeper properties are returned from Contentful in a separate field 
     * called includes. This method resolves the links between the parent item
     * and its included properties so that items[n] is the full object.
     */
    this.denormalizeLinkedItems = (obj) => {
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
  }


  /**
   * Returns a Promise for an array of entries matching the query. 
   * - Default behaviour is to automatically denormalize any occurance of
   *   included properties.
   * 
   * @param {any} contentType 
   * @param {any} query 
   * @param {number} [included=0] 
   * @returns 
   * @memberof Contentful
   */
  getEntries(contentType, query, included = 0) {
    return new Promise((resolve, reject) => {
      this.query(contentType, included, query, true, false)
        .then(entries => {
          return resolve(entries);
        })
        .catch(reason => {
          console.warn('contentful.getEntries failed:', reason);
          return reject(reason);
        })
    });
  }


  /**
   * Returns a Promise for a single entry
   * - Returns items[0] thus ignore anything but the first item in the 
   *   array. Ensure the query should only fetch one item.
   * - Does not return an array like getEntries but strips to the object
   *   level.
   * 
   * @param {any} contentType 
   * @param {any} query 
   * @param {number} [included=0] 
   * @returns 
   * @memberof Contentful
   */
  getEntry(contentType, query, included = 0) {
    return new Promise((resolve, reject) => {
      this.query(contentType, included, query, true, false)
        .then(entries => {
          let entry = {};
          if (entries && entries.items) {
            entry = entries.items[0];
          }
          return resolve(entry);
        })
        .catch(reason => {
          console.warn('contentful.getEntry failed:', reason);
          return reject(reason);
        })
    })
  }
}


// Export this class when executing this script under Mocha/NodeJS
(typeof (module) === 'object') ? module.exports = Contentful : null;

