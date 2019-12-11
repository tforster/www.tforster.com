const handlebars = require("handlebars");
const fetch = require('node-fetch');

const fs = require("fs").promises;
const path = require("path");

class Build {
  constructor(stage) {
    this.stage = stage;
    this.contentful = {
      accessToken: "ebfa99618c6da4ae410dd709ec1b7b9c515cbf0cae711b3f78cb67dbea029b61",
      space: "xyov37w0wvhz"
    }
  }


  /**
   * Required for use with Contentful/REST APIs so that the data can be shaped to fit the templates. This is
   * not needed when using GraphQL since the shape can be achieved by the query
   *
   * @param {*} allData
   * @memberof Build
   */
  async _getShapedData() {
    const url = `https://cdn.contentful.com/spaces/${this.contentful.space}/entries?access_token=${this.contentful.accessToken}&include=10`;
    const options = {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    }
    const response = await fetch(url, options);
    let data = await response.json();


    return Promise.resolve(data.items.map(item => {
      const temp = { fields: item.fields, type: item.sys.contentType.sys.id, id: item.sys.id }

      // Check to see if this page references additional queries, fetch, and merge them
      if (temp.fields.queries) {
        temp.fields.queryData = data.items.filter((item) => {
          return item.sys.contentType.sys.id === temp.fields.queries[0]
        });
      }
      // Check to see if this page references additional contentTypes, fetch, and merge them
      if (temp.fields.contentTypes) {
        temp.fields.contentTypesData = data.items.filter(item => {
          return item.sys.id === temp.fields.contentTypes[0].sys.id
        });
      }

      return temp;
    }))
  }


  /**
   *
   *
   * @returns
   * @memberof Build
   */
  async buildSite() {

    // 1. Get data from our data provider, currently Contenful, but Strapi/GraphQL is being actively developed
    const data = await this._getShapedData();

    // 2. Register ebs files
    // !: NPM Glob has 6 deps; a recursive function is more complex to debug and maintain; we KNOW the folder paths we need; Therefore an iterable array is the way to go
    const handlebarsFolders = ["src/theme/organisms", "src/theme/templates"]
    await Promise.all(handlebarsFolders.map(async folder => {
      const entries = await fs.readdir(folder, { withFileTypes: true });
      for (let entry of entries) {
        if (entry.isFile()) {
          const source = (await fs.readFile(path.join(folder, (entry.name)))).toString();
          handlebars.registerPartial(entry.name, source);
        }
      }
    }));

    // ToDo: Precompile the partials for added performance. See https://stackoverflow.com/questions/12014547/how-do-i-precompile-partials-for-handlebars-js
    // Iterate entries, looking for and rendering type=page
    data.forEach(async entry => {
      if (entry.type !== "page") {
        return;
      }

      const source = handlebars.partials[`${entry.fields.template}-layout.hbs`].toString()
      const template = handlebars.compile(source);

      const result = template(entry.fields);
      // Write the rendered file to dist, naming it via the key 
      // ToDo: keys with separators need to be expanded into subdirectories still! (manually create the dist/portfolio folder for now)
      await fs.writeFile(path.join('dist', entry.fields.key), result, { encoding: "utf8" });
    })
    return Promise.resolve("ok");
  }
}



(async () => {
  const build = new Build("dev");
  const args = process.argv.slice(2);
  if (args && args[0] === "buildSite") {
    const r = await build.buildSite();
    return 0;
  } else {
    console.error('not implemented');
    return;
  }
})();
