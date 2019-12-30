// System dependencies (Built in modules)
const { Writable } = require("stream");

// Third party dependencies (Typically found in public NPM packages)
const AWS = require("aws-sdk");

/**
 * Implements Gulp-like dest() function to terminate a piped process by uploading the supplied Vinyl file to AWS S3
 *
 * @class VinylS3
 */
class VinylS3 {
  static dest(_, options) {
    const writable = new Writable({
      objectMode: true,
      write(file, _, done) {
        const s3Options = {
          credentials: new AWS.SharedIniFileCredentials({ profile: options.aws.profile }),
        };
        AWS.config.update({ region: options.aws.region });

        const s3 = new AWS.S3(s3Options);
        const params = {
          Bucket: options.aws.bucket,
          Key: options.aws.key || file.basename,
          Body: file.contents,
          ACL: "public-read",
        };
        s3.upload(params)
          .promise()
          .then((result) => {
            console.log("result", result);
            done();
          })
          .catch((reason) => {
            console.error(reason);
          });
      },
    });

    writable.on("error", (reason) => {
      console.error(reason);
    });

    return writable;
  }
}

module.exports = VinylS3;
