// twinny!

// @ts-check

// System dependencies
import { resolve } from "path";

// Third party dependencies
import vfs from "vinyl-fs";
import WebProducer from "@tforster/webproducer";

/**
 * @description: A simple NodeJS wrapper around WebProducer, soon to be renamed to Gilbert.
 * @date 2023-05-27
 * @class Gilbert
 */
class Gilbert {
  /**
   * Creates an instance of Gilbert.
   * @date 2023-05-27
   * @memberof Gilbert
   */
  constructor() {
    // @type {number}
    this.start = new Date().getTime();

    // Create a stream of data files from our uber simplistic file-based CMS
    this.dataStream = () => vfs.src("./cms/data.json");

    // Set the parameters for WebProducer including the data stream created above
    this.params = {
      uris: {
        data: { stream: this.dataStream() },
        theme: { stream: vfs.src(["./src/templates/**/*.hbs"]) },
      },
      //scripts: { entryPoints: ["./src/scripts/main.js"] },
      stylesheets: { entryPoints: ["./src/stylesheets/main.css", "./src/stylesheets/vendor.css"] },
      //files: { stream: vfs.src(["./src/files/**/*", "./src/_worker.js", "./src/serviceWorker.js", "./src/manifest.json"]) },
      files: { stream: vfs.src(["./src/files/**/*", "./src/images/**/*.*", "./src/*.png", "./src/site.webmanifest"]) },
    };

    // Create a new instance of WebProducer
    this.webproducer = new WebProducer({ relativeRoot: resolve("./src") });

    // Initialise the destination stream, in this case a local distribution folder
    this.dest = vfs.dest("./dist");

    // Add an event handler to write some useful information to the console when everything is complete
    this.dest.on("finish", () => {
      // @type {number}
      const now = new Date().getTime();

      console.log(
        `Processed ${this.webproducer.resources} files totalling ${(this.webproducer.size / (1024 * 1024)).toFixed(
          2
        )} Mb to /dist in ${now - this.start} ms.`
      );
    });

    // Configure WebProducer with the params (can't pass in the constructor because they are asynchronous)
    this.webproducer.produce(this.params);

    // Pipe the produced files to the destination S3 bucket
    this.webproducer.mergeStream.pipe(this.dest);
  }
}

// Get any arguments passed to the script
const args = process.argv.slice(2);
new Gilbert();
// if (args.length > 0 && args[0] === "watch") {
//   // If the first argument is "watch" then watch for changes to the data file
//   chokidar.watch(["./src", "./cms/data.json", "./services/**/*.js"]).on("change", () => {
//     new Gilbert();
//   });
// } else {
//   // Otherwise just run the script once
//   new Gilbert();
// }
