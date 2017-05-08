var AWS = require('aws-sdk'),
  parallelize = require('concurrent-transform'),
  del = require('del'),
  gulp = require('gulp'),
  awspublish = require('gulp-awspublish'),
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
  marked = require('marked');

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
  s3: {
    region: "ca-central-1",
    "bucket-prod": "www.tforster.com",
    "bucket-stage": "www.tforster.com",
    profile: "tforster"
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
 * DEPLOY
 * - Synchronizes the named instance with AWS S3
 */
let deploy = () => {
  if (config.target === 'dev') {
    console.error('dev not supported for S3 deployments.');
    return;
  }

  let publisher = awspublish.create({
    region: config.s3.region,
    params: {
      Bucket: (config.target === 'stage') ? config.s3['bucket-stage'] : config.s3['bucket-prod']
    },
    credentials: new AWS.SharedIniFileCredentials({ profile: config.s3.profile })
  });

  const headers = {
    'Cache-Control': 'no-cache'
  };

  return gulp.src(config.buildPath + '**/*.*')
    .pipe(parallelize(publisher.publish(headers, { force: true })), 10)
    // .sync removes files from S3 not found in the publish stream
    .pipe(publisher.sync())
    .pipe(awspublish.reporter())
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
 * COMPILEVIEWS
 * - Constructs .html views from .ejs templates in src/views
 */
let compileViews = () => {
  return new Promise(function (resolve, reject) {
    let pageData = {

    }
    // See https://github.com/mde/ejs for options
    gulp.src("./src/views/*.html", pageData)
      .on('error', reject)
      .pipe(ejs({}))
      .pipe(rename({ extname: '.html' }))
      .pipe(gulp.dest(config.buildPath))
      .on('end', resolve);
  });
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
  await copyResources([
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
    del([config.buildPath + '/js', config.buildPath + '/css']);
  }

  return;
}

/**
 * TEST
 * - Used for occasional prototyping and testing of new gulp tasks
 */
gulp.task('test', function () {
  // Nothing here at the moment
  notify();
});

/**
 * DEPLOY
 * - A gulp task wrapper around deploy() for copying to S3 static hosts
 */
gulp.task('deploy', function () {
  deploy();
});

/**
 * BUILD
 * - A gulp task wrapper around build()
 */
gulp.task('build', function () {
  return build(); // Currently no promise wrapped around build()!
})

/**
 * WATCH
 * - Watches src/ and automatically builds into build/dev
 */
gulp.task('watch', function () {
  return watch('src/**/*', function () {
    gulp.start('build')
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
