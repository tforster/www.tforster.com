# www.tforster.com

_The official website of Troy Forster_

# Built With

* [Visual Studio Code](https://code.visualstudio.com/) on Windows 10
* [Oh-My-Zsh](https://github.com/robbyrussell/oh-my-zsh) on Bash on Ubuntu on [Windows Subsystem for Linux](https://msdn.microsoft.com/en-us/commandline/wsl/install_guide)
* [NodeJS](https://nodejs.org/en/) 7.8.0
* ~~NPM 4.2.0~~ [Yarn](https://yarnpkg.com/lang/en/) 0.2.34
* [Git](https://git-scm.com/) 2.7.4
* [Contentful](http://contentful.com)
* [Gulp](http://gulpjs.com/)
* [s3rver](https://github.com/jamhall/s3rver)
* [Coffee](https://en.wikipedia.org/wiki/Coffee): A good source of [C8H10N4O2](https://pubchem.ncbi.nlm.nih.gov/compound/caffeine)
* [Cloudinary](http://cloudinary.com): Use as a CLI (via query string) to crop and resize images
* [babel-eslint](https://github.com/babel/babel-eslint): Handles ES2017 features like arrow functions inside classes better than the default Espree parser.
* [AWS-SDK](https://aws.amazon.com/sdk-for-node-js/): Deploy to S3 filesystem
* [TinyPNG](https://tinypng.com/developers): PNG and JPG minification
* [Babili](https://github.com/babel/babili): ES6 minification

# Developer Setup

1. Ensure all dependencies are installed (see Built With above)
1. Ensure AWS credentials are properly configured in ~/.aws/credentials and ~/.aws/config
1. Run `yarn`
1. Add `127.0.0.1	www.tforster.com.s3.local` to the hosts file
1. Run `yarn run s3-server` to start the local S3 emulator. Since I build a lot of S3 apps I have s3rver installed outside of this project. 
1. Run `gulp watch` to automatically build and serve development changes from [http://www.tforster.com.s3.local](http://www.tforster.com.s3.local)
1. Start editing...
1. Run `gulp build --target stage` to build a stage release. 
1. Deploy to S3 with `gulp deploy --target {stage | prod}`

## Yarn Scripts

* s3-server: Launch s3Server

# Special Thanks

Wes Bos for contributing the Docker SVG icon https://github.com/wesbos/Font-Awesome-Docker-Icon

# Change Log

v3.1.0 Feature iteration and bug fixes (2017-06-20)

* .gitignore: Now includes yarn error logs
* gulpfile.js: Switched from UglifyJS to [Babili](https://github.com/babel/babili) for ES6 minification. Also added TinyPNG support for crushing
.png and .jpg images
* package.json: NPM script `s3-server` launches both s3-server and gulp watch (and should be renamed more appropriately in next release)
* app.js:
  * Started migration to native ES6 following decision to not support IE
  * Moved render functions outside of main class. More refactoring to come to gain complete separation of router logic from site specific implementation.
  * Improved error handling when loading physical .html template files
  * Removed deprecated event listener on scroll
  * Added renderPortfolioItem
  * Added normalizeLinkedItems to better handle Contentful responses. Later release might see a standalone Contentful client
* *.html: numerous tweaks and cosmetic improvments

v3.0.0 Replatformed using a serverless architecture (2017-05-07)

* Migrated from NodeJS/ExpressJS hosted on Digital Ocean to Serverless architecture on AWS S3 with AWS Lambda support
* Added a completely overhauled gulpfile automating the build process
* Migrated from NPM to Yarn
* Switched from Git Bash on Windows to ZSH on Linux (on Windows)
* Switched from Visual Studio Community Edition to Visual Studio Code
* Redesigned from a SPA-like experience to a more UX friendly multi-page experience
* Eschewed the paid and overly bloaty theme-forest theme to a W3Schools CSS-only theme
* Utilizing Content as a Service (CaaS) via Contentful
* No more Modernizr
* No more jQuery
* No more HTML5Shiv
* No Angular, React, Ember, etc
* ES5 __not__ ES6 because:
  * Not all evergreen browers are supporting the full ES6 feature set natively (but soon)
  * Babel transpiles ES6 to ES5 so evergreen browsers supporing ES6 still end up running ES5
  * By not relying on frameworks as a default behaviour the entire JS footprint is under 5kb including a custom router, view manager, cms, etc.
  * P.s. I speak fluent ES6 when targeting NodeJS and AWS Lambda 

v2.0.0 Now a NodeJS/Express App

* Migrated from ASP.NET on GoDaddy to NodeJS/ExpressJS on Digital Ocean

v1.0.0

* ASP.NET
