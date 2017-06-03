/**
 * Super lightweight wrapper around Javascript AWS SDK to support the creation
 * of S3 buckets suitable for web serving.
 * 
 * @class S3
 */

const AWS = require('aws-sdk'),
  parallelize = require('concurrent-transform'),
  gulp = require('gulp'),
  awspublish = require('gulp-awspublish');

class S3 {

  /**
   * Creates a new empty bucket with a public-read ACL if none is provided.
   * 
   * @static
   * @param {object} AwsConfig 
   * @param {string} Bucket 
   * @param {string} ACL 
   * @returns 
   * 
   * @memberof S3
   */
  static createNewWebBucket(AwsConfig, Bucket, ACL) {
    ACL = ACL || 'public-read';

    return new Promise(function (resolve, reject) {
      AwsConfig.apiVersion = '2006-03-01';
      AwsConfig.s3ForcePathStyle = true;
      let client = new AWS.S3(AwsConfig);

      let bucketParams = {
        Bucket: Bucket,
        ACL: ACL
      };
      console.log(bucketParams);
      client.createBucket(bucketParams, function (err, data) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
   * Creates a new empty bucket with the appropriate policy to support static 
   * web serving. Also applies support for default index.html and error.html 
   * files.
   * 
   * @static
   * @param {object} AwsConfig 
   * @param {string} Bucket 
   * @returns 
   * 
   * @memberof S3
   */
  static makeWebBucketServable(AwsConfig, Bucket) {
    return new Promise(function (resolve, reject) {
      AwsConfig.apiVersion = '2006-03-01';
      AwsConfig.s3ForcePathStyle = true;
      AwsConfig.signatureVersion = 'v4';
      let client = new AWS.S3(AwsConfig);

      let staticHostParams = {
        Bucket: Bucket,
        WebsiteConfiguration: {
          ErrorDocument: {
            Key: 'app.html'
          },
          IndexDocument: {
            Suffix: 'index.html'
          },
        }
      };

      client.putBucketWebsite(staticHostParams, function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
   * Synchronizes the local files specified in the glob with the named bucket
   * with any pre-existing files in the bucket no longer in the glob being
   * removed.
   * 
   * @static
   * @param {object} AwsConfig 
   * @param {string} Bucket 
   * @param {[string]} Glob 
   * @returns A Promise
   * 
   * @memberof S3
   */
  static syncGlobToBucket(AwsConfig, Bucket, Glob) {
    console.log(AwsConfig, Bucket, Glob)
    return new Promise(function (resolve, reject) {
      AwsConfig.apiVersion = '2006-03-01';
      AwsConfig.s3ForcePathStyle = true;
      AwsConfig.signatureVersion = 'v4';
      AwsConfig.params = {
        Bucket: Bucket
      };
      let publisher = awspublish.create(AwsConfig);

      const headers = {
        'Cache-Control': 'no-cache'
      };

      gulp.src(Glob)
        .on('error', reject)
        .pipe(parallelize(publisher.publish(headers, { force: true })), 10)
        .pipe(publisher.sync())
        .pipe(awspublish.reporter())
        .on('end', resolve);
    });
  }
}

module.exports = S3;
