// System dependencies
import { resolve } from "path";
import { Readable, Transform } from "stream";

// Third party dependencies
import vfs from "vinyl-fs";
import vinyl from "vinyl";
import WebProducer from "@tforster/webproducer";

// TODO: Make an iterable query so we don't have to specify each file
const query = `
query AggregateCmsData {
  repository(owner: "tforster", name: "www.tforster.com") {
    about: object(expression: "cloudflare:cms/about.json") {
      ... on Blob {
        text
      }
    }    
    home: object(expression: "cloudflare:cms/home.json") {
      ... on Blob {
        text
      }
    }    
    services: object(expression: "cloudflare:cms/services.json") {
      ... on Blob {
        text
      }
    }
    projects: object(expression: "cloudflare:cms/projects.json") {
      ... on Blob {
        text
      }
    }
    contact: object(expression: "cloudflare:cms/contact.json") {
      ... on Blob {
        text
      }
    }

  }
}`;

/**
 * @description: A simple NodeJS wrapper around Gilbert, soon to be renamed to BuildScript.
 * @class BuildScript
 */
class BuildScript {
  // @type {number}
  #start;

  /**
   * Creates an instance of BuildScript.
   * @memberof BuildScript
   */
  constructor() {
    this.#start = new Date().getTime();
  }

  /**
   * @description Fetches the data stream from the GitHub GraphQL API.
   * @memberof BuildScript
   */
  #fetchDataStream = async () => {
    const url = "https://api.github.com/graphql";
    const options = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
      body: JSON.stringify({ query: query }),
    };
    const response = await fetch(url, options);
    const responseData = await response.json();

    // Create a Gilbert compatible data object from the response data
    const data = {
      uris: {
        //JSON.parse(responseData.data.repository.about.text || "{}"),
        "/index.html": JSON.parse(responseData.data.repository.home.text || "{}"),
        "/about.html": JSON.parse(responseData.data.repository.about.text || "{}"),
        "/services.html": JSON.parse(responseData.data.repository.services.text || "{}"),
        "/projects.html": JSON.parse(responseData.data.repository.projects.text || "{}"),
        "/contact.html": JSON.parse(responseData.data.repository.contact.text || "{}"),
        //JSON.parse(responseData.data.repository.services.text || "{}"),
      },
    };

    // Convert the data object to a Vinyl file object
    const vinylFile = new vinyl({ path: "/data.json", contents: Buffer.from(JSON.stringify(data)) });

    // Return a new readable stream containing the Vinyl file object
    return new Readable({
      objectMode: true,
      read() {
        this.push(vinylFile);
        // Signal the end of the stream
        this.push(null);
      },
    });
  };

  /**
   * @description Fetches the data from the local file system cms folder
   * @note Use this when developing locally and reading the latest Git fetched data from the Pages CMS
   * @memberof BuildScript
   */
  #fetchDataLocal = async () => {
    // Create writable stream of Vinyl files
    const dataStream = vfs.src(["./cms/**/*.json"]);
    // Initialise the Gilbert data object
    const data = { uris: {} };

    // Create a transform stream to parse the JSON files and add them to the data object
    const transform = new Transform({
      objectMode: true,

      // Transform function to parse the JSON files and add them to the data object
      transform: (file, _, callback) => {
        file = JSON.parse(file.contents.toString());
        data.uris[file.uri] = file;
        callback(null);
      },
    });

    // Add an event handler to write the data object to a Vinyl file when the stream ends
    dataStream.on("end", () => {
      // Add the data object to the transform stream
      transform.push(new vinyl({ path: "/data.json", contents: Buffer.from(JSON.stringify(data)) }));
      // Signal the end of the stream
      transform.push(null);
    });

    return dataStream.pipe(transform);
  };

  async build() {
    this.params = {
      uris: {
        data: { stream: await this.#fetchDataLocal() },
        theme: { stream: vfs.src(["./src/templates/**/*.hbs"]) },
      },
      scripts: { entryPoints: ["./src/scripts/main.js"] },
      stylesheets: { entryPoints: ["./src/stylesheets/main.css", "./src/stylesheets/vendor.css"] },
      files: {
        stream: vfs.src(["./src/media/**/*", "./src/*.png", "./src/site.webmanifest"]),
      },
    };

    // Create a new instance of Gilbert
    this.gilbert = new WebProducer({ relativeRoot: resolve("./src") });

    // Initialise the destination stream, in this case a local distribution folder
    this.dest = vfs.dest("./dist");

    // Add an event handler to write some useful information to the console when everything is complete
    this.dest.on("finish", () => {
      // @type {number}
      const now = new Date().getTime();

      console.log(
        `Processed ${this.gilbert.resources} files totalling ${(this.gilbert.size / (1024 * 1024)).toFixed(2)} Mb to /dist in ${
          now - this.#start
        } ms.`
      );
    });

    // Configure gilbert with the params (can't pass in the constructor because they are asynchronous)
    this.gilbert.produce(this.params);

    // Pipe the produced files to the destination
    this.gilbert.mergeStream.pipe(this.dest);
  }
}

// Get any arguments passed to the script
const args = process.argv.slice(2);
const buildScript = new BuildScript();
buildScript.build();

// if (args.length > 0 && args[0] === "watch") {
//   // If the first argument is "watch" then watch for changes to the data file
//   chokidar.watch(["./src", "./cms/data.json", "./services/**/*.js"]).on("change", () => {
//     new BuildScript();
//   });
// } else {
//   // Otherwise just run the script once
//   new BuildScript();
// }
