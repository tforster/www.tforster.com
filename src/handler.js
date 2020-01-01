/* eslint-disable no-restricted-syntax */
("use strict");

const WebProducer = require("./lib/WebProducer");

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

module.exports.build = async (event) => {
  const appStart = new Date();
  const options = {
    //src: "./src",
    build: "./build",
    dest: "./dist",
    transformFunction,
    stage: "dev",
    datoCMSToken: process.env["DATOCMS_TOKEN"],
    amplifyBucket: "wp.tforster.com",
    appId: process.env["AMPLIFY_APP_ID"],
    aws: {
      bucket: "wp.tforster.com",
      key: "archive.zip",
      region: "ca-central-1",
      profile: "tforster",
    },
  };
  const build = new WebProducer(options);
  await build.buildF(true);
  const retVal = `elapsed time to end of build ${new Date() - appStart}ms`;

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
