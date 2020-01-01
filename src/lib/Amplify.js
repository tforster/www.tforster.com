("use strict");

// Third party dependencies (Typically found in public NPM packages)
const AWS = require("aws-sdk");

class Amplify {
  static async deploy(options) {
    // Construct the source Url to fetch the archive from
    const sourceUrl = `https://s3.${options.aws.region}.amazonaws.com/${options.aws.bucket}/${options.aws.key}`;
    //https://s3.ca-central-1.amazonaws.com/wp.tforster.com/archive.zip
    // Create AWS credentials
    const amplifyOptions = {
      credentials: new AWS.SharedIniFileCredentials({ profile: options.aws.profile }),
    };

    // Had to force region since profile "appears" to be ignored at the moment
    AWS.config.update({ region: "us-east-1" });

    // Create new Amplify client plus some other miscellany
    const amplify = new AWS.Amplify(amplifyOptions);
    const appId = options.appId;
    const branchName = options.stage;

    // Deploy a previously copied zip from S3
    // ! Amplify deploys only changed files from the zip and does garbage collection on redundant files "later"
    await amplify
      .startDeployment({
        appId,
        branchName,
        sourceUrl,
      })
      .promise();

    return Promise.resolve("zip uploaded to AWS Amplify");
  }
}

module.exports = Amplify;
