/* eslint-disable no-restricted-syntax */
const fs = require("fs").promises;
const path = require("path");

const fetch = require("node-fetch");
const handlebars = require("handlebars");
const vfs = require("vinyl-fs");

class Build {
  constructor(stage) {
    this.stage = stage;
    // ToDo: Even though this token grants read-only and is client-side safe, it should be passed in externally for better practice
    this.token = "9cfbc892f6eba7abc41914504e714c";
  }

  /**
   * Fetches data from the CMS with a GraphQL query
   * ToDO: Variabalise the URL and/or make it an external parameter
   *
   * @param {*} query
   * @param {*} transform
   * @returns
   * @memberof Build
   */
  async _fetchCMSData(query, transform) {
    const response = await fetch("https://graphql.datocms.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        query: query,
      }),
    });
    let data = (await response.json()).data;

    if (transform) {
      data = transform(data);
    }

    return data;
  }

  /**
   * Copies files and folders from resources to root of dist. Uses an external dependency but we will
   * likely be expanding this build script to use streams and vinyl files elsewhere
   *
   * @memberof Build
   */
  _copyResources() {
    vfs.src("./src/resources/**/*.*").pipe(vfs.dest("dist"));
  }

  /**
   *
   *
   * @returns
   * @memberof Build
   */
  async buildSite() {
    // 1. Clear the dist folder
    const emptyDist = fs.rmdir("dist", { recursive: true });

    // Fetch graphQL query from external file
    const query = await fs.readFile("./query.graphql", { encoding: "utf8" });

    // Custom transform to get query results into an object of keys
    const transform = (data) => {
      const retVal = {};
      for (const obj in data) {
        if (Array.isArray(data[obj])) {
          data[obj].forEach((o) => {
            retVal[o.key] = o;
          });
        } else {
          retVal[data[obj].key] = data[obj];
        }
      }
      return retVal;
    };

    // Get, and transform, the site data
    const data = await this._fetchCMSData(query, transform);

    // 2. Register .hbs files
    // !: NPM Glob has 6 deps; a recursive function is more complex to debug and maintain; we KNOW the folder paths we need; Therefore an iterable array is the way to go
    // ToDo: Since we use vfs in _copyResources, consider refactoring this method to use vinyl streams too
    const handlebarsFolders = ["src/theme/organisms", "src/theme/templates"];
    await Promise.all(
      handlebarsFolders.map(async (folder) => {
        const entries = await fs.readdir(folder, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile()) {
            const source = (await fs.readFile(path.join(folder, entry.name))).toString();
            handlebars.registerPartial(entry.name, source);
          }
        }
      })
    );

    // Ensure the dist directory was emptied before continuing
    await emptyDist;

    // ToDo: Precompile the partials for added performance. See https://stackoverflow.com/questions/12014547/how-do-i-precompile-partials-for-handlebars-js
    // Iterate entries, rendering each entry and writing to the local filesystem
    // ToDo: Since we use vfs in _copyResources, consider refactoring this method to use vinyl streams too
    for (const key in data) {
      // Determine the correct handlebars template to load, compile and render
      const fields = data[key];
      const source = handlebars.partials[`${fields._modelApiKey}.hbs`].toString();
      const template = handlebars.compile(source);
      const result = template(fields);

      // Calculate the full relative path to the output file
      const filePath = path.join("dist", key);

      // Ensure the calculated path exists by force creating it. Nb: Cheaper to force it each time than to cycle through {fs.exists, then, fs.mkdir}
      await fs.mkdir(path.parse(filePath).dir, { recursive: true });

      // Write the result to the filesystem at the filePath
      await fs.writeFile(filePath, result, { encoding: "utf8" });
    }

    return Promise.resolve("ok");
  }
}

(async () => {
  const build = new Build("dev");
  const args = process.argv.slice(2);
  if (args && args[0] === "buildSite") {
    await build.buildSite();
    build._copyResources();
    return 0;
  } else {
    console.error("not implemented");
    return;
  }
})();
