var AWS = require('aws-sdk'),
  del = require('del'),
  gulp = require('gulp'),
  debug = require('gulp-debug'),
  ejs = require('gulp-ejs'),
  htmlmin = require('gulp-htmlmin'),
  minifyCss = require('gulp-minify-css'),
  rename = require('gulp-rename'),
  rev = require('gulp-rev'),
  uglify = require('gulp-uglify'),
  usemin = require('gulp-usemin'),
  util = require('gulp-util'),
  watch = require('gulp-watch'),
  marked = require('marked'),
  S3 = require('./S3Class.js');

/**
 * CONFIG
 * - General configuration for this project
 */
let config = {
  slack: {
    url: 'https://hooks.slack.com/services/slack/hook/here',
    channel: '#dev',
    user: 'DevBot',
    icon_url: 'https://www.file-extensions.org/imgs/app-icon/128/8360/ripple-chat-bot-icon.png'
  },
  urls: {
    dev: 'http://localhost:9080',
    stage: 'https://something',
    prod: 'https://something else'
  },
  aws: {
    region: 'ca-central-1',
    s3: {
      // In dev mode we use a local S3 server provided by Docker tforster/s3-server
      fakeS3Endpoint: 'http://localhost:4568',
      buckets: {
        dev: 'www.tforster.com.s3.local',
        stage: 'www.tforster.com.stage.tforster.com',
        prod: 'www.tforster.com'
      }
    },
    profile: 'tforster'
  },
  marked: {
    renderer: new marked.Renderer(),
    gfm: true,
    tables: true,
    breaks: true,
    pedantic: false,
    sanitize: true,
    smartLists: true,
    smartypants: false
  }
}

/** 
 * Configure the marked plugin
 */
marked.setOptions(config.marked);

/**
 * Configure the slack plugin to use with notify()
 */
let slack = require('gulp-slack')(config.slack);


/**
 * NOTIFY
 * - Send a Slack or MS Teams notification
 */
let notify = () => {
  let msg = `${config.target} was updated. See ${config.urls[config.target]}`;
  console.log(msg);
  if (config.target !== 'dev') {
    return slack(msg);
  }
}


/**
 * COMPILEVIEWS
 * - Constructs .html views from .ejs templates in src/views
 */
let compileViews = () => {
  return new Promise(function (resolve, reject) {
    let pageData = {

    }
    // See https://github.com/mde/ejs for options
    gulp.src('./src/views/*.html', pageData)
      .on('error', reject)
      .pipe(ejs({}))
      .pipe(rename({ extname: '.html' }))
      .pipe(gulp.dest(config.buildPath))
      .on('end', resolve);
  });
}


/**
 * COPYRESOURCES
 * - Copies resources provided in resources hash
 */
let copyResources = (resources) => {
  return Promise.all(resources.map(function (resource) {
    return new Promise(function (resolve, reject) {
      gulp.src(resource.glob)
        .on('error', reject)
        .pipe(gulp.dest(config.buildPath + resource.dest))
        .on('end', resolve)
    });
  }));
}


/**
 * MINH
 * - Minifies and concatenates globbed .HTML files including nested Javascript and CSS resources
 */
let minh = () => {
  return new Promise(function (resolve, reject) {
    gulp.src(config.buildPath + '/*.html')
      .on('error', reject)
      .pipe(debug())
      .pipe(usemin({
        css: [function () { return minifyCss(); }, function () { return rev(); }],
        html: [function () { return htmlmin({ collapseWhitespace: true, removeComments: true }); }],
        js: [function () { return uglify({ 'negate_iife': false }); }, function () { return rev(); }],
        inlinejs: [uglify()],
        inlinecss: [minifyCss(), 'concat']
      }))
      .pipe(gulp.dest(config.buildPath))
      .on('end', resolve);
  })
}


/**
 * BUILD
 * - The actual build pipeline that clears a target, compiles views, copies images and fonts, minifies and cleans up
 */
let build = async () => {
  await del([config.buildPath + '**/*']);
  await compileViews();
  let c = await copyResources([
    {
      glob: ['./favicon*.*'],
      dest: '/'
    },
    {
      glob: ['./src/img/**/*'],
      dest: '/img/'
    },
    {
      glob: ['./src/fonts/**/*'],
      dest: '/fonts/'
    },
    {
      glob: ['./src/favicon.ico'],
      dest: ''
    },
    {
      glob: ['./src/js/**/*.js'],
      dest: '/js/'
    },
    {
      glob: ['./src/css/**/*'],
      dest: '/css/'
    }
  ]);

  // Stage and Prod have single JS and CSS so we can clean up the unminified files
  if (config.target !== 'dev') {
    await minh();
    c = await del([config.buildPath + '/js', config.buildPath + '/css']);
  }
  return c;
}


/**
 * TEST
 * - Used for occasional prototyping and testing of new gulp tasks
 */
gulp.task('test', function () {
  let awsConfig = {
    credentials: new AWS.SharedIniFileCredentials({ profile: config.aws.profile }),
    //  endpoint: new AWS.Endpoint(config.aws.s3.fakeS3Endpoint)
  };
  let bucket = config.aws.s3.buckets[config.target];

  //S3.createNewWebBucket(awsConfig, bucket);
  S3.makeWebBucketServable(awsConfig, bucket);
  // S3.syncGlobToBucket(awsConfig, bucket, 'build/dev/**/*');
  // // .then(result => {
  // //   console.log('r1', result);
  // //   return S3.makeWebBucketServable(awsConfig, bucket);
  // // })
  // // .then(result => {
  // //   console.log('r2', result);
  // //   console.log(result);
  // //   return S3.syncGlobToBucket(awsConfig, bucket, 'build/dev/**/*');
  // // });
  // //  S3.syncGlobToBucket(awsConfig, bucket, 'build/dev/**/*');
  // //S3.makeWebBucketServable(awsConfig, bucket);
});


/**
 * DEPLOY
 * - A gulp task wrapper around deploy() for copying to S3 static hosts
 */
gulp.task('deploy', function () {
  let awsConfig = {
    credentials: new AWS.SharedIniFileCredentials({ profile: config.aws.profile })
  };

  if (config.target === 'dev') {
    awsConfig.endpoint = new AWS.Endpoint(config.aws.s3.fakeS3Endpoint);
  }
  return S3.syncGlobToBucket(awsConfig, config.aws.s3.buckets[config.target], config.buildPath + '**/*');
});


/**
 * BUILD
 * - A gulp task wrapper around build()
 */
gulp.task('build', function () {
  return build(); // Currently no promise wrapped around build()!
})


/**
 * A gulp task wrapper around S3 bucket creation. Creates a bucket in dev or S3
 * based on the current target and what is named in config.
 */
gulp.task('createBucket', function () {
  let awsConfig = {
    credentials: new AWS.SharedIniFileCredentials({ profile: config.aws.profile })
  };

  if (config.target === 'dev') {
    awsConfig.endpoint = new AWS.Endpoint(config.aws.s3.fakeS3Endpoint);
  }
  S3.createNewWebBucket(awsConfig, config.aws.s3.buckets[config.target]);
});


/**
 * WATCH
 * - Watches src/ and automatically builds into build/dev
 */
gulp.task('watch', function () {
  // Some hacky sh!t for build and deploy needs to be cleaned up a bit
  return watch('src/**/*', function () {
    build()
      .then(result => {
        gulp.start('deploy');
      })
  });
});

/** 
 * HELP
 * - Display some basic help info
 */
gulp.task('help', function () {
  console.log(`
  
  Usage: gulp <command> [options]
    
    where <command> is one of:
      build:   Clean, compile views, copy resources, optionally minify and clean up
      deploy:  Synchronize the local target (e.g. dev, stage or prod) with AWS S3
      watch:   Starts a watcher on src and updates any changes to build/dev

    options:
      --target [dev] | stage | prod
  
  `)
});

/**
 * DEFAULT
 * - Show the help message
 */
gulp.task('default', ['help']);

/**
 * Set up the config object defaults based on --target flag
 */
(function () {
  config.target = util.env.target || 'dev';
  switch (config.target.toLowerCase()) {
    case 'stage':
      config.buildPath = 'build/stage/';
      break;
    case 'prod':
      config.buildPath = 'build/prod/';
      break;
    default:
      config.buildPath = 'build/dev/';
      break;
  }
})();
