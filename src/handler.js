/* eslint-disable no-restricted-syntax */
("use strict");

// Third party dependencies (Typically found in public NPM packages)
const WebProducer = require("./WebProducer");

// Custom transform to get query results into an object of keys

/**
 * Custom transform function to get query results into an object of keys
 */
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

/**
 * All the code needed to create a Lambda managed webhook to build Troy's personal website in the cloud
 */
module.exports.build = async (event) => {
  // Capture the time for reporting purposes. Not required in real-world usecases
  const appStart = new Date();

  const options = {
    transformFunction,
    stage: "stage",
    datoCMSToken: process.env["DATOCMS_TOKEN"],
    amplifyBucket: "wp.tforster.com",
    appId: process.env["AMPLIFY_APP_ID"],
    aws: {
      bucket: "wp.tforster.com",
      key: "archive.zip",
      region: "ca-central-1",
      accessKey: process.env["AWS_ACCESS_KEY_ID"],
      secretKey: process.env["AWS_SECRET_ACCESS_KEY"],
    },
  };

  // Create an instance of the WebProducer class
  const build = new WebProducer(options);
  // Call the public buildF() method
  await build.buildF();

  // Calculate the total time it took to fetch CMS data, merge with templates, concat, minify, zip, send to S3 and finally invoke
  // the Amplify Deploy method
  const retVal = `elapsed time to end of build ${new Date() - appStart}ms`;

  // Return a response to the caller
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: retVal,
        input: event,
      },
      null,
      2
    ),
  };
};
