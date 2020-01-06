/* eslint-disable no-restricted-syntax */
("use strict");

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

// Project deps
const Amplify = require("./Amplify");
const vs3 = require("./Vinyl-s3");
const vzip = require("./Vinyl-zip");

// ToDo: Error handling
// ToDo: Apply streaming approach to reading and processing .hbs files
// ToDo: Replace verbose timestamps with a logging function that can be toggled for dev vs prod
// ToDo: Refactor some property and method names as we have build, buildF, buildSite, etc and its confusing
// ToDo: Did I say error handling?
// ToDo: Performance tuning
// ToDo: Replace antiquated usemin() structure with Jake's modern process
// *NB:  User bucket in this example is ca-central-1 but AWS Amplify region is us-east-1 since Amplify is not in ca-central-1 yet

/**
 * Website and web-app agnostic class implementing a "build" process that merges handlebars templates with GraphQL data to produce
 * static output.
 * Note that the Lambda runtime filesystem is read-only with the exception of the /tmp directory..
 * @class WebProducer
 */
class WebProducer {
  /**
   *Creates an instance of Build.
   * @param {object} options: Runtime options passed in from project implementation
   * @memberof WebProducer
   */
  constructor(options) {
    // Stage as in AWS Lambda definition of stage
    this.stage = options.stage || "dev";
    // Temporary path to contain build artifacts in progress
    this.build = "/tmp/build";
    // Temporary path to contain final output of this.build
    this.dest = "/tmp/dist";
    // Optional user function to further shape data retrieved from CMS source
    this.transformFunction = options.transformFunction;
    // Name of S3 bucket to upload this.dist contents to
    this.amplifyBucket = options.amplifyBucket;
    // Additional AWS options, including ./aws/credentials profile
    this.aws = options.aws;
    // READ-ONLY token to access CMS
    this.datoCMSToken = options.datoCMSToken;
    // Amplify appId
    this.appId = options.appId;
  }

  /**
   * Fetches data from DatoCMS with a GraphQL query
   * ToDO: Variabalise the URL and/or make it an external parameter
   * @param {string} query:       The GraphQL query to execute
   * @param {function} transform: An optional, developer supplied function to further shape query results
   * @returns                     JSON object
   * @memberof WebProducer
   */
  async _fetchCMSData(query, transform) {
    const fnStart = new Date();
    try {
      const response = await fetch("https://graphql.datocms.com/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${this.datoCMSToken}`,
        },
        body: JSON.stringify({
          query: query,
        }),
      });
      let data = (await response.json()).data;

      if (transform) {
        data = transform(data);
      }
      console.log(`Data fetched from DatoCMS and transformed in ${new Date() - fnStart}ms`);
      return Promise.resolve(data);
    } catch (reason) {
      return Promise.reject(reason);
    }
  }

  /**
   * Copies static files and folders, including images, scripts, css, etc, from resources to root of dist.
   * @memberof WebProducer
   */
  _copyResources() {
    console.log("Starting _copyResources()");
    return new Promise((resolve, reject) => {
      vfs
        .src(`./resources/**/*.*`)
        .pipe(vfs.dest(this.build))
        .on("error", (err) => {
          console.log("_copyResources:", err);
          reject(err);
        })
        .on("end", resolve);
    });
  }

  /**
   * Minifies and concatenates HTML, CSS and JavaScript. Also cache busts the minified CSS and JS files before creating and
   * uploading a zip file to AWS S3.
   * ToDo: Add parameters to support choice of raw files or zipped output and whether to go local, or S3 or both
   * @memberof WebProducer
   */
  async _createDistribution() {
    const fnStart = new Date();
    const aws = this.aws;
    console.log("Starting _createDistribution()");
    return new Promise((resolve, reject) => {
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
        .pipe(vzip.zip("archive.zip"))
        .pipe(vs3.dest(null, { aws: { bucket: aws.bucket, key: aws.key, region: aws.region } }))
        .on("finish", () => {
          resolve(`Distribution created and uploaded to S3 in ${new Date() - fnStart}ms`);
        });
    });
  }

  /**
   * Wrapper for all the sub functions
   * @memberof WebProducer
   */
  async buildF() {
    const aws = this.aws;
    const appId = this.appId;
    const stage = this.stage;
    // Process handlebars templates with retrieved content into build directory
    console.log(await this._buildSite());
    // Copy static files to build directory
    await this._copyResources();
    // Concat, minify then zip into a single distribution file
    console.log(await this._createDistribution());
    // Deploy distribution to AWS Amplify
    console.log(
      await Amplify.deploy({
        appId,
        stage,
        // Note that Amplify is not available in all regions yet, including ca-central-1. Force to us-east-1 for now.
        aws: { bucket: aws.bucket, key: aws.key, bucketRegion: aws.region, amplifyRegion: "us-east-1" },
      })
    );
  }

  /**
   * Monolithic function that prepares dist folder, retrieves data from GraphQL, shapes it, registers Handlebars templates, merges
   * with data and outputs final files.
   * ToDo: Split up into smaller functions
   * @param {function} transform: An optional function to further shape retrieved data
   * @returns Promise
   * @memberof WebProducer
   */
  async _buildSite() {
    const fnStart = new Date();
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
    // ToDo: Since we use vfs in _copyResources, consider refactoring this method to use vinyl streams too
    const handlebarsFolders = ["./theme/organisms", "./theme/templates"];
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

    return Promise.resolve(`Site contents generated in ${new Date() - fnStart}ms`);
  }
}

module.exports = WebProducer;
