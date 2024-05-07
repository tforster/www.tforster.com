// System dependencies
import { resolve } from "path";
import { Readable } from "stream";

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
  #start;

  /**
   * Creates an instance of BuildScript.
   * @memberof BuildScript
   */
  constructor() {
    // @type {number}
    this.#start = new Date().getTime();
  }

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

  async build() {
    this.params = {
      uris: {
        data: { stream: await this.#fetchDataStream() },
        theme: { stream: vfs.src(["./src/templates/**/*.hbs"]) },
      },
      //scripts: { entryPoints: ["./src/scripts/main.js"] },
      stylesheets: { entryPoints: ["./src/stylesheets/main.css", "./src/stylesheets/vendor.css"] },
      //files: { stream: vfs.src(["./src/files/**/*", "./src/_worker.js", "./src/serviceWorker.js", "./src/manifest.json"]) },
      files: {
        stream: vfs.src(["./cms/media/**/*", "./src/files/**/*", "./src/images/**/*.*", "./src/*.png", "./src/site.webmanifest"]),
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
