/* eslint-disable no-restricted-syntax */
"use strict";

// System dependencies (Built in modules)
const fs = require("fs").promises;
const path = require("path");

// Third party dependencies (Typically found in public NPM packages)
const fetch = require("node-fetch");
const handlebars = require("handlebars");
const minifyCss = require("gulp-minify-css");
const minifyHtml = require("gulp-htmlmin");
const minifyJs = require("gulp-terser");
const rev = require("gulp-rev");
const usemin = require("gulp-usemin");
const vfs = require("vinyl-fs");

// ToDo: Error handling
// ToDo: Take better advantage of vinyl files, through2 and streaming to improve performance
// ToDo: Refactor some property and method names as we have build, buildF, buildSite, etc and its confusing

/**
 * Website and web-app agnostic class implementing a "build" process that handlebars templates with GraphQL data to produce static
 * output.
 * @class Build
 */
class Build {
  /**
   *Creates an instance of Build.
   * @param {symbol} stage: The stage { dev | stage | prod }
   * @memberof Build
   */
  constructor(options) {
    this.stage = options.stage || "dev";
    this.src = options.src || "./src";
    this.build = options.build || "./build";
    this.dest = options.dest || "./dest";
    this.transformFunction = options.transformFunction;

    // ToDo: Even though this token grants read-only and is client-side safe, it should be passed in externally for better practice
    this.token = process.env["DATOCMS_TOKEN"];
  }

  /**
   * Fetches data from the CMS with a GraphQL query
   * ToDO: Variabalise the URL and/or make it an external parameter
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
    return new Promise((resolve, reject) => {
      vfs
        .src(`${this.src}/resources/**/*.*`)
        .pipe(vfs.dest(this.build))
        .on("error", (err) => {
          console.log(err);
          reject(err);
        })
        .on("end", resolve);
    });
  }

  /**
   * Minifies and concatenates HTML, CSS and JavaScript. Also cache busts the minified CSS and JS files
   * @memberof Build
   */
  async _minifCatenate() {
    new Promise((resolve, reject) => {
      vfs
        .src(`${this.build}/**/*.html`)
        .on("error", (e) => {
          console.log("e", e);
          return reject();
        })
        .pipe(
          usemin({
            path: this.build,
            outputRelativePath: ".",
            css: [() => minifyCss(), () => rev()],
            html: [() => minifyHtml({ collapseWhitespace: true, removeComments: true })],
            js: [() => minifyJs(), () => rev()],
          })
        )
        .pipe(vfs.dest("./dist"))
        .on("end", resolve);
    });
  }

  async buildF() {
    await this._buildSite();
    await this._copyResources(this.src, this.build);
    await this._minifCatenate(this.build, this.dist);
  }

  /**
   * Monolithic function that prepares dist folder, retrieves data from GraphQL, shapes it, registers Handlebars templates, merges
   * with data and outputs final files.
   * ToDo: Split up into smaller functions
   * @param {function} transform: An optional function to further shape retrieved data
   * @returns Promise
   * @memberof Build
   */
  async _buildSite() {
    // 1. Clear the dist folder
    await fs.rmdir(this.build, { recursive: true });
    await fs.rmdir(this.dest, { recursive: true });

    await fs.mkdir(this.build);
    await fs.mkdir(this.dest);

    // Fetch graphQL query from external file
    const query = await fs.readFile("./db/query.graphql", { encoding: "utf8" });

    // Get, and transform, the site data
    const siteData = await this._fetchCMSData(query, this.transformFunction);

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

    // ToDo: Precompile the partials for added performance. See https://stackoverflow.com/questions/12014547/how-do-i-precompile-partials-for-handlebars-js
    // Iterate entries, rendering each entry and writing to the local filesystem
    // ToDo: Since we use vfs in _copyResources, consider refactoring this method to use vinyl streams too
    for (const key in siteData) {
      // Determine the correct handlebars template to load, compile and render
      const fields = siteData[key];
      const source = handlebars.partials[`${fields._modelApiKey}.hbs`].toString();
      const template = handlebars.compile(source);
      const result = template(fields);

      // Calculate the full relative path to the output file
      const filePath = path.join(this.build, key);

      // Ensure the calculated path exists by force creating it. Nb: Cheaper to force it each time than to cycle through {fs.exists, then, fs.mkdir}
      await fs.mkdir(path.parse(filePath).dir, { recursive: true });

      // Write the result to the filesystem at the filePath
      await fs.writeFile(filePath, result, { encoding: "utf8" });
    }

    return Promise.resolve("ok");
  }
}

// Custom transform to get query results into an object of keys

const transformFunction = (data) => {
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

// Anonymous asynchronous immediately invoked function that kicks off the build process
(async () => {
  const appStart = new Date();
  const options = {
    src: "./src",
    build: "./build",
    dest: "./dist",
    transformFunction,
    stage: "dev",
  };
  const build = new Build(options);

  const args = process.argv.slice(2);
  if (args && args[0] === "buildSite") {
    await build.buildF();
    console.log(`elapsed time ${new Date() - appStart}ms`);
    return 0;
  } else {
    console.error("not implemented");
    return;
  }
})();
